<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Services\ExpedienteServiceInterface;
use App\DTO\ListQuery;
use App\Exceptions\DomainActionException;
use App\Models\Expediente;
use App\Models\ExpedienteDecisionFile;
use App\Models\ExpedienteEvent;
use App\Models\ExpedienteInspection;
use App\Models\ExpedienteInspectionFile;
use App\Models\ExpedienteRequirement;
use App\Models\ExpedienteRequirementFile;
use App\Models\ExpedienteResponse;
use App\Models\ProcedureType;
use App\Models\Requirement;
use App\Models\Solicitante;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExpedienteService extends BaseService implements ExpedienteServiceInterface
{
    /** @return array<string, mixed> */
    protected function toRow(Model $model): array
    {
        /** @var Expediente $m */
        $m = $model;

        $procedureType = $m->relationLoaded('procedureType') ? $m->procedureType : null;
        $solicitante = $m->relationLoaded('solicitante') ? $m->solicitante : null;
        $reviewer = $m->relationLoaded('reviewer') ? $m->reviewer : null;
        $inspector = $m->relationLoaded('inspector') ? $m->inspector : null;

        return [
            'id' => $m->getAttribute('id'),
            'tracking' => (string) $m->getAttribute('tracking'),
            'status' => (string) $m->getAttribute('status'),
            'is_active' => (bool) ($m->getAttribute('is_active') ?? true),
            'numero_receptoria' => $m->getAttribute('numero_receptoria'),
            'codigo_catastral' => $m->getAttribute('codigo_catastral'),
            'procedure_type' => $procedureType ? [
                'id' => (int) $procedureType->getAttribute('id'),
                'code' => (string) $procedureType->getAttribute('code'),
                'name' => (string) $procedureType->getAttribute('name'),
            ] : null,
            'solicitante' => $solicitante ? [
                'id' => (int) $solicitante->getAttribute('id'),
                'tipo_documento' => (string) $solicitante->getAttribute('tipo_documento'),
                'numero_documento' => (string) $solicitante->getAttribute('numero_documento'),
                'nombre_razon_social' => (string) $solicitante->getAttribute('nombre_razon_social'),
            ] : null,
            'assigned_to' => $reviewer ? (string) $reviewer->getAttribute('name') : ($inspector ? (string) $inspector->getAttribute('name') : null),
            'received_at' => $m->getAttribute('received_at'),
            'created_at' => $m->getAttribute('created_at'),
        ];
    }

    /** @return array<string, mixed> */
    public function toItem(Model $model): array
    {
        /** @var Expediente $m */
        $m = $model;

        $procedureType = $m->relationLoaded('procedureType') ? $m->procedureType : null;
        $solicitante = $m->relationLoaded('solicitante') ? $m->solicitante : null;

        $createdAt = $m->getAttribute('created_at');
        $updatedAt = $m->getAttribute('updated_at');
        $receivedAt = $m->getAttribute('received_at');

        $requirements = [];
        if ($m->relationLoaded('requirements')) {
            /** @var \Illuminate\Database\Eloquent\Collection<int, ExpedienteRequirement> $reqs */
            $reqs = $m->requirements;
            $requirements = $reqs->map(function (ExpedienteRequirement $er): array {
                $req = $er->relationLoaded('requirement') ? $er->requirement : null;
                $currentFile = $er->relationLoaded('currentFile') ? $er->currentFile : null;

                return [
                    'id' => (int) $er->getAttribute('id'),
                    'requirement_id' => (int) $er->getAttribute('requirement_id'),
                    'sort_order' => (int) $er->getAttribute('sort_order'),
                    'is_required' => (bool) $er->getAttribute('is_required'),
                    'is_active' => (bool) $er->getAttribute('is_active'),
                    'physical_received' => (bool) $er->getAttribute('physical_received'),
                    'notes' => $er->getAttribute('notes'),
                    'requirement' => $req ? [
                        'id' => (int) $req->getAttribute('id'),
                        'code' => (string) $req->getAttribute('code'),
                        'name' => (string) $req->getAttribute('name'),
                        'description' => $req->getAttribute('description'),
                    ] : null,
                    'current_file' => $currentFile ? [
                        'id' => (int) $currentFile->getAttribute('id'),
                        'original_name' => (string) $currentFile->getAttribute('original_name'),
                        'mime' => (string) $currentFile->getAttribute('mime'),
                        'size' => (int) $currentFile->getAttribute('size'),
                        'uploaded_at' => $currentFile->getAttribute('uploaded_at'),
                    ] : null,
                ];
            })->values()->toArray();
        }

        return [
            'id' => $m->getAttribute('id'),
            'tracking' => (string) $m->getAttribute('tracking'),
            'qr_token' => (string) $m->getAttribute('qr_token'),
            'status' => (string) $m->getAttribute('status'),
            'numero_receptoria' => $m->getAttribute('numero_receptoria'),
            'codigo_catastral' => $m->getAttribute('codigo_catastral'),
            'observaciones' => $m->getAttribute('observaciones'),
            'is_active' => (bool) ($m->getAttribute('is_active') ?? true),
            'procedure_type' => $procedureType ? [
                'id' => (int) $procedureType->getAttribute('id'),
                'code' => (string) $procedureType->getAttribute('code'),
                'name' => (string) $procedureType->getAttribute('name'),
            ] : null,
            'solicitante' => $solicitante ? [
                'id' => (int) $solicitante->getAttribute('id'),
                'tipo_documento' => (string) $solicitante->getAttribute('tipo_documento'),
                'numero_documento' => (string) $solicitante->getAttribute('numero_documento'),
                'nombre_razon_social' => (string) $solicitante->getAttribute('nombre_razon_social'),
                'telefono' => $solicitante->getAttribute('telefono'),
                'email' => $solicitante->getAttribute('email'),
                'direccion' => $solicitante->getAttribute('direccion'),
            ] : null,
            'requirements' => $requirements,
            'events' => $m->relationLoaded('events')
                ? $m->events->map(function (ExpedienteEvent $e): array {
                    $ca = $e->getAttribute('created_at');

                    return [
                        'id' => (int) $e->getAttribute('id'),
                        'type' => (string) $e->getAttribute('type'),
                        'description' => (string) $e->getAttribute('description'),
                        'actor_name' => $e->getAttribute('actor_name'),
                        'payload' => $e->getAttribute('payload'),
                        'created_at' => $ca instanceof Carbon ? $ca->toISOString() : ($ca ? (string) $ca : null),
                    ];
                })->values()->toArray()
                : [],
            'reviewer' => $m->relationLoaded('reviewer') && $m->reviewer ? [
                'id' => (int) $m->reviewer->getKey(),
                'name' => (string) $m->reviewer->getAttribute('name'),
            ] : null,
            'reviewer_assigned_at' => $this->toIso($m->getAttribute('reviewer_assigned_at')),
            'inspector' => $m->relationLoaded('inspector') && $m->inspector ? [
                'id' => (int) $m->inspector->getKey(),
                'name' => (string) $m->inspector->getAttribute('name'),
            ] : null,
            'inspector_assigned_at' => $this->toIso($m->getAttribute('inspector_assigned_at')),
            'decision' => $m->getAttribute('decision'),
            'decision_notes' => $m->getAttribute('decision_notes'),
            'decision_user' => $m->relationLoaded('decisionUser') && $m->decisionUser ? [
                'id' => (int) $m->decisionUser->getKey(),
                'name' => (string) $m->decisionUser->getAttribute('name'),
            ] : null,
            'decision_at' => $this->toIso($m->getAttribute('decision_at')),
            'completed_at' => $this->toIso($m->getAttribute('completed_at')),
            'valid_from' => $m->getAttribute('valid_from') ? (string) $m->getAttribute('valid_from') : null,
            'valid_until' => $m->getAttribute('valid_until') ? (string) $m->getAttribute('valid_until') : null,
            'returned_from_status' => $m->getAttribute('returned_from_status'),
            'return_reason' => $m->getAttribute('return_reason'),
            'latest_inspection' => $this->serializeInspection($m),
            'latest_response' => $this->serializeResponse($m),
            'decision_files' => $this->serializeDecisionFiles($m),
            'received_at' => $receivedAt instanceof Carbon ? $receivedAt->toISOString() : ($receivedAt ? (string) $receivedAt : null),
            'created_at' => method_exists($createdAt, 'toISOString') ? $createdAt->toISOString() : (string) $createdAt,
            'updated_at' => method_exists($updatedAt, 'toISOString') ? $updatedAt->toISOString() : (string) $updatedAt,
        ];
    }

    private function toIso(mixed $value): ?string
    {
        if ($value instanceof Carbon) {
            return $value->toISOString();
        }

        return $value ? (string) $value : null;
    }

    /** @return array<string, mixed>|null */
    private function serializeInspection(Expediente $m): ?array
    {
        if (! $m->relationLoaded('latestInspection') || ! $m->latestInspection) {
            return null;
        }

        /** @var ExpedienteInspection $ins */
        $ins = $m->latestInspection;

        $files = [];
        if ($ins->relationLoaded('files')) {
            $files = $ins->files->map(function (ExpedienteInspectionFile $f): array {
                return [
                    'id' => (int) $f->getKey(),
                    'type' => (string) $f->getAttribute('type'),
                    'original_name' => (string) $f->getAttribute('original_name'),
                    'mime' => (string) $f->getAttribute('mime'),
                    'size' => (int) $f->getAttribute('size'),
                ];
            })->values()->toArray();
        }

        return [
            'id' => (int) $ins->getKey(),
            'observations' => (string) $ins->getAttribute('observations'),
            'result' => (string) $ins->getAttribute('result'),
            'inspected_at' => $ins->getAttribute('inspected_at') ? (string) $ins->getAttribute('inspected_at') : null,
            'submitted_at' => $this->toIso($ins->getAttribute('submitted_at')),
            'files' => $files,
        ];
    }

    /** @return array<string, mixed>|null */
    private function serializeResponse(Expediente $m): ?array
    {
        if (! $m->relationLoaded('latestResponse') || ! $m->latestResponse) {
            return null;
        }

        /** @var ExpedienteResponse $resp */
        $resp = $m->latestResponse;

        $reviewer = $resp->relationLoaded('reviewer') && $resp->reviewer ? [
            'id' => (int) $resp->reviewer->getKey(),
            'name' => (string) $resp->reviewer->getAttribute('name'),
        ] : null;

        return [
            'id' => (int) $resp->getKey(),
            'content' => (string) $resp->getAttribute('content'),
            'submitted_at' => $this->toIso($resp->getAttribute('submitted_at')),
            'reviewer' => $reviewer,
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function serializeDecisionFiles(Expediente $m): array
    {
        if (! $m->relationLoaded('decisionFiles')) {
            return [];
        }

        return $m->decisionFiles->map(function (ExpedienteDecisionFile $f): array {
            return [
                'id' => (int) $f->getKey(),
                'original_name' => (string) $f->getAttribute('original_name'),
                'mime' => (string) $f->getAttribute('mime'),
                'size' => (int) $f->getAttribute('size'),
            ];
        })->values()->toArray();
    }

    protected function repoModelClass(): string
    {
        return Expediente::class;
    }

    protected function defaultExportFilename(string $format, ListQuery $query): string
    {
        return 'expedientes_export_'.date('Ymd_His').'.'.$format;
    }

    /** @return array<string, string> */
    protected function defaultExportColumns(): array
    {
        return [
            'id' => '#',
            'tracking' => 'Tracking',
            'status' => 'Estado',
            'numero_receptoria' => 'N° Receptoría',
            'codigo_catastral' => 'Código catastral',
            'received_at' => 'Recibido',
            'created_at' => 'Creado',
        ];
    }

    /** @param  array<string, mixed>|null  $payload */
    protected function recordEvent(Expediente $expediente, string $type, string $description, ?User $actor = null, ?array $payload = null): ExpedienteEvent
    {
        return ExpedienteEvent::query()->create([
            'expediente_id' => $expediente->getKey(),
            'type' => $type,
            'description' => $description,
            'payload' => $payload,
            'actor_id' => $actor?->getKey(),
            'actor_name' => $actor ? (string) $actor->getAttribute('name') : null,
            'created_at' => now(),
        ]);
    }

    public function createReception(array $payload, User $actor, bool $confirm): Expediente
    {
        return $this->transaction(function () use ($payload, $actor, $confirm): Expediente {
            $procedureTypeId = (int) ($payload['procedure_type_id'] ?? 0);
            if ($procedureTypeId <= 0) {
                throw new DomainActionException('Tipo de trámite inválido.');
            }

            $procedureType = ProcedureType::query()->with([
                'requirements' => function ($q) {
                    $q->wherePivot('is_active', true)
                        ->where('requirements.is_active', true)
                        ->orderBy('procedure_type_requirements.sort_order');
                },
            ])->findOrFail($procedureTypeId);

            // Phase validation: check recaudos before confirming
            if ($confirm && (bool) $procedureType->getAttribute('reception_requires_all_recaudos')) {
                $receivedIdsCheck = array_map(static fn ($v) => (int) $v, (array) data_get($payload, 'physical_received_requirement_ids', []));
                $missingCount = $procedureType->requirements
                    ->filter(fn ($r) => (bool) data_get($r->getAttribute('pivot'), 'is_required', true))
                    ->filter(fn ($r) => ! in_array((int) $r->getAttribute('id'), $receivedIdsCheck, true))
                    ->count();
                if ($missingCount > 0) {
                    throw new DomainActionException("Faltan {$missingCount} recaudo(s) requerido(s) por consignar.");
                }
            }

            $solicitanteId = (int) ($payload['solicitante_id'] ?? 0);
            if ($solicitanteId <= 0) {
                throw new DomainActionException('Debe seleccionar un solicitante.');
            }

            $solicitante = Solicitante::query()->findOrFail($solicitanteId);
            if (! (bool) $solicitante->getAttribute('is_active')) {
                throw new DomainActionException('El solicitante seleccionado está desactivado.');
            }

            $tracking = 'EXP-'.(string) Str::ulid();
            $qrToken = hash('sha256', (string) Str::ulid().Str::random(40));

            $expediente = Expediente::query()->create([
                'procedure_type_id' => $procedureType->getKey(),
                'solicitante_id' => $solicitante->getKey(),
                'tracking' => $tracking,
                'qr_token' => $qrToken,
                'numero_receptoria' => data_get($payload, 'numero_receptoria'),
                'codigo_catastral' => data_get($payload, 'codigo_catastral'),
                'observaciones' => data_get($payload, 'observaciones'),
                'status' => $confirm ? 'received' : 'draft',
                'received_at' => $confirm ? now() : null,
                'received_by' => $confirm ? $actor->getKey() : null,
                'presentado_por_nombre' => data_get($payload, 'presentado_por.nombre'),
                'presentado_por_documento' => data_get($payload, 'presentado_por.documento'),
                'presentado_por_telefono' => data_get($payload, 'presentado_por.telefono'),
                'is_active' => true,
            ]);

            $receivedIdsRaw = (array) data_get($payload, 'physical_received_requirement_ids', []);
            $receivedIds = array_map(static fn ($v) => (int) $v, $receivedIdsRaw);

            foreach ($procedureType->requirements as $req) {
                /** @var Requirement $req */
                $pivot = $req->getAttribute('pivot');

                $rid = (int) $req->getAttribute('id');
                $physical = in_array($rid, $receivedIds, true);

                ExpedienteRequirement::query()->create([
                    'expediente_id' => $expediente->getKey(),
                    'requirement_id' => $rid,
                    'sort_order' => (int) data_get($pivot, 'sort_order', 0),
                    'is_required' => (bool) data_get($pivot, 'is_required', true),
                    'is_active' => (bool) data_get($pivot, 'is_active', true),
                    'physical_received' => $physical,
                    'physical_received_at' => $physical && $confirm ? now() : null,
                    'physical_received_by' => $physical && $confirm ? $actor->getKey() : null,
                    'notes' => null,
                ]);
            }

            $this->recordEvent($expediente, 'reception_created', 'Expediente recepcionado', $actor, [
                'procedure_type' => (string) $procedureType->getAttribute('name'),
                'solicitante' => (string) $solicitante->getAttribute('nombre_razon_social'),
                'tracking' => $tracking,
            ]);

            return $expediente;
        });
    }

    public function setPhysicalReceived(ExpedienteRequirement $expedienteRequirement, bool $received, User $actor): ExpedienteRequirement
    {
        $expedienteRequirement->setAttribute('physical_received', $received);
        $expedienteRequirement->setAttribute('physical_received_at', $received ? now() : null);
        $expedienteRequirement->setAttribute('physical_received_by', $received ? $actor->getKey() : null);
        $expedienteRequirement->save();

        $expedienteRequirement->loadMissing('requirement');
        $reqName = $expedienteRequirement->requirement
            ? (string) $expedienteRequirement->requirement->getAttribute('name')
            : '#'.$expedienteRequirement->getAttribute('requirement_id');

        /** @var Expediente $expediente */
        $expediente = Expediente::query()->findOrFail($expedienteRequirement->getAttribute('expediente_id'));
        $this->recordEvent(
            $expediente,
            $received ? 'requirement_received' : 'requirement_unreceived',
            $received ? "Recaudo marcado como consignado: {$reqName}" : "Recaudo desmarcado: {$reqName}",
            $actor,
        );

        return $expedienteRequirement;
    }

    public function uploadRequirementFile(ExpedienteRequirement $expedienteRequirement, UploadedFile $file, User $actor): ExpedienteRequirementFile
    {
        return $this->transaction(function () use ($expedienteRequirement, $file, $actor): ExpedienteRequirementFile {
            $expedienteId = (int) $expedienteRequirement->getAttribute('expediente_id');
            $requirementId = (int) $expedienteRequirement->getAttribute('requirement_id');

            $rawOriginal = (string) $file->getClientOriginalName();
            $safeOriginal = preg_replace('/[^A-Za-z0-9._-]+/', '_', $rawOriginal);
            $safeOriginal = is_string($safeOriginal) && $safeOriginal !== '' ? $safeOriginal : 'file';
            $name = now()->format('Ymd_His').'_'.Str::random(10).'_'.$safeOriginal;

            $dir = 'expedientes/'.$expedienteId.'/requirements/'.$requirementId;
            $path = Storage::disk('local')->putFileAs($dir, $file, $name);

            $sha = null;
            try {
                $real = $file->getRealPath();
                if ($real) {
                    $sha = hash_file('sha256', $real) ?: null;
                }
            } catch (\Throwable) {
            }

            $current = ExpedienteRequirementFile::query()
                ->where('expediente_requirement_id', $expedienteRequirement->getKey())
                ->where('is_current', true)
                ->whereNull('deleted_at')
                ->first();

            if ($current) {
                $current->setAttribute('is_current', false);
                $current->save();
            }

            $new = ExpedienteRequirementFile::query()->create([
                'expediente_requirement_id' => $expedienteRequirement->getKey(),
                'disk' => 'local',
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime' => $file->getClientMimeType() ?: 'application/octet-stream',
                'size' => (int) $file->getSize(),
                'sha256' => $sha,
                'uploaded_by' => $actor->getKey(),
                'uploaded_at' => now(),
                'is_current' => true,
                'replaced_by_id' => null,
                'deleted_by' => null,
                'delete_reason' => null,
            ]);

            if ($current) {
                $current->setAttribute('replaced_by_id', $new->getKey());
                $current->save();
            }

            $expedienteRequirement->loadMissing('requirement');
            $reqName = $expedienteRequirement->requirement
                ? (string) $expedienteRequirement->requirement->getAttribute('name')
                : '#'.$expedienteRequirement->getAttribute('requirement_id');

            /** @var Expediente $expediente */
            $expediente = Expediente::query()->findOrFail($expedienteId);
            $this->recordEvent(
                $expediente,
                $current ? 'file_replaced' : 'file_uploaded',
                ($current ? 'Archivo reemplazado' : 'Archivo cargado').": {$reqName}",
                $actor,
                ['original_name' => $file->getClientOriginalName()],
            );

            return $new;
        });
    }

    public function deleteRequirementFile(ExpedienteRequirementFile $file, User $actor, ?string $reason = null): void
    {
        $this->transaction(function () use ($file, $actor, $reason): void {
            $erId = (int) $file->getAttribute('expediente_requirement_id');
            $originalName = (string) $file->getAttribute('original_name');

            $file->setAttribute('deleted_by', $actor->getKey());
            $file->setAttribute('delete_reason', $reason);
            $file->setAttribute('is_current', false);
            $file->save();
            $file->delete();

            $er = ExpedienteRequirement::query()->with('requirement')->find($erId);
            if ($er) {
                $reqName = $er->requirement
                    ? (string) $er->requirement->getAttribute('name')
                    : '#'.$er->getAttribute('requirement_id');

                /** @var Expediente $expediente */
                $expediente = Expediente::query()->findOrFail($er->getAttribute('expediente_id'));
                $this->recordEvent(
                    $expediente,
                    'file_deleted',
                    "Archivo eliminado: {$reqName}",
                    $actor,
                    ['original_name' => $originalName, 'reason' => $reason],
                );
            }
        });
    }
}

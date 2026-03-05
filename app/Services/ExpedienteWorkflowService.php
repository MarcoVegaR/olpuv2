<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Models\Expediente;
use App\Models\ExpedienteDecisionFile;
use App\Models\ExpedienteEvent;
use App\Models\ExpedienteInspection;
use App\Models\ExpedienteInspectionFile;
use App\Models\ExpedienteResponse;
use App\Models\ExpedienteResponseFile;
use App\Models\ProcedureType;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExpedienteWorkflowService
{
    // ──────────────────────────────────────────────
    // Status constants
    // ──────────────────────────────────────────────

    public const STATUS_DRAFT = 'draft';

    public const STATUS_RECEIVED = 'received';

    public const STATUS_PENDING_REVIEWER = 'pending_reviewer';

    public const STATUS_PENDING_INSPECTOR = 'pending_inspector';

    public const STATUS_IN_INSPECTION = 'in_inspection';

    public const STATUS_PENDING_RESPONSE = 'pending_response';

    public const STATUS_PENDING_DECISION = 'pending_decision';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_PARTIAL = 'partial';

    public const STATUS_SUSPENDED = 'suspended';

    /** Ordered list of workflow statuses (for phase comparison). Terminal statuses excluded. */
    public const PHASE_ORDER = [
        self::STATUS_DRAFT,
        self::STATUS_RECEIVED,
        self::STATUS_PENDING_REVIEWER,
        self::STATUS_PENDING_INSPECTOR,
        self::STATUS_IN_INSPECTION,
        self::STATUS_PENDING_RESPONSE,
        self::STATUS_PENDING_DECISION,
    ];

    public const TERMINAL_STATUSES = [
        self::STATUS_COMPLETED,
        self::STATUS_REJECTED,
        self::STATUS_PARTIAL,
        self::STATUS_SUSPENDED,
    ];

    /** Decision enum values */
    public const DECISIONS = ['approved', 'rejected', 'partial', 'suspended'];

    /** Inspection result enum values */
    public const INSPECTION_RESULTS = ['favorable', 'unfavorable', 'with_observations'];

    // ──────────────────────────────────────────────
    // Workflow actions
    // ──────────────────────────────────────────────

    public function assignReviewer(Expediente $expediente, User $reviewer, User $actor): Expediente
    {
        $this->assertStatus($expediente, self::STATUS_RECEIVED);

        return DB::transaction(function () use ($expediente, $reviewer, $actor): Expediente {
            $expediente->setAttribute('reviewer_id', $reviewer->getKey());
            $expediente->setAttribute('reviewer_assigned_at', now());

            $nextStatus = $this->resolveNextStatus($expediente, self::STATUS_PENDING_REVIEWER);
            $expediente->setAttribute('status', $nextStatus);
            $expediente->save();

            $this->recordEvent($expediente, 'reviewer_assigned', 'Revisor asignado: '.$reviewer->getAttribute('name'), $actor, [
                'reviewer_id' => $reviewer->getKey(),
                'reviewer_name' => (string) $reviewer->getAttribute('name'),
            ]);

            return $expediente;
        });
    }

    public function assignInspector(Expediente $expediente, User $inspector, User $actor): Expediente
    {
        $this->assertStatus($expediente, self::STATUS_PENDING_REVIEWER);

        return DB::transaction(function () use ($expediente, $inspector, $actor): Expediente {
            $expediente->setAttribute('inspector_id', $inspector->getKey());
            $expediente->setAttribute('inspector_assigned_at', now());

            $nextStatus = $this->resolveNextStatus($expediente, self::STATUS_PENDING_INSPECTOR);
            $expediente->setAttribute('status', $nextStatus);
            $expediente->save();

            $this->recordEvent($expediente, 'inspector_assigned', 'Inspector asignado: '.$inspector->getAttribute('name'), $actor, [
                'inspector_id' => $inspector->getKey(),
                'inspector_name' => (string) $inspector->getAttribute('name'),
            ]);

            return $expediente;
        });
    }

    public function startInspection(Expediente $expediente, User $actor): Expediente
    {
        $this->assertStatus($expediente, self::STATUS_PENDING_INSPECTOR);

        return DB::transaction(function () use ($expediente, $actor): Expediente {
            $expediente->setAttribute('status', self::STATUS_IN_INSPECTION);
            $expediente->save();

            $this->recordEvent($expediente, 'inspection_started', 'Inspección iniciada', $actor);

            return $expediente;
        });
    }

    /**
     * @param  array{observations: string, result: string, inspected_at: string}  $data
     * @param  array<UploadedFile>  $photos
     * @param  array<UploadedFile>  $reports
     */
    public function submitInspection(Expediente $expediente, array $data, array $photos, array $reports, User $actor): ExpedienteInspection
    {
        $this->assertStatus($expediente, self::STATUS_IN_INSPECTION);

        if (! in_array($data['result'], self::INSPECTION_RESULTS, true)) {
            throw new DomainActionException('Resultado de inspección no válido.');
        }

        $this->enforcePreConditions($expediente, 'submitInspection', $photos, $reports);

        return DB::transaction(function () use ($expediente, $data, $photos, $reports, $actor): ExpedienteInspection {
            /** @var ExpedienteInspection $inspection */
            $inspection = ExpedienteInspection::query()->create([
                'expediente_id' => $expediente->getKey(),
                'inspector_id' => $actor->getKey(),
                'observations' => $data['observations'],
                'result' => $data['result'],
                'inspected_at' => $data['inspected_at'],
                'submitted_at' => now(),
            ]);

            $this->storeInspectionFiles($inspection, $photos, 'photo', $actor);
            $this->storeInspectionFiles($inspection, $reports, 'report', $actor);

            $nextStatus = $this->resolveNextStatus($expediente, self::STATUS_PENDING_RESPONSE);
            $expediente->setAttribute('status', $nextStatus);
            $expediente->save();

            $resultLabel = match ($data['result']) {
                'favorable' => 'Favorable',
                'unfavorable' => 'Desfavorable',
                default => 'Con observaciones',
            };

            $this->recordEvent($expediente, 'inspection_submitted', "Inspección registrada: {$resultLabel}", $actor, [
                'inspection_id' => $inspection->getKey(),
                'result' => $data['result'],
                'photos_count' => count($photos),
                'reports_count' => count($reports),
            ]);

            return $inspection;
        });
    }

    /**
     * @param  array<UploadedFile>  $files
     */
    public function submitResponse(Expediente $expediente, string $content, array $files, User $actor): ExpedienteResponse
    {
        $this->assertStatus($expediente, self::STATUS_PENDING_RESPONSE);

        return DB::transaction(function () use ($expediente, $content, $files, $actor): ExpedienteResponse {
            /** @var ExpedienteResponse $response */
            $response = ExpedienteResponse::query()->create([
                'expediente_id' => $expediente->getKey(),
                'reviewer_id' => $actor->getKey(),
                'content' => $content,
                'submitted_at' => now(),
            ]);

            $this->storeResponseFiles($response, $files, $actor);

            $nextStatus = $this->resolveNextStatus($expediente, self::STATUS_PENDING_DECISION);
            $expediente->setAttribute('status', $nextStatus);
            $expediente->save();

            $this->recordEvent($expediente, 'response_submitted', 'Respuesta técnica enviada', $actor, [
                'response_id' => $response->getKey(),
                'files_count' => count($files),
            ]);

            return $response;
        });
    }

    /**
     * @param  array{decision: string, notes?: string|null, valid_from?: string|null, valid_until?: string|null}  $data
     * @param  array<UploadedFile>  $files
     */
    public function issueDecision(Expediente $expediente, array $data, array $files, User $actor): Expediente
    {
        $this->assertStatus($expediente, self::STATUS_PENDING_DECISION);

        if (! in_array($data['decision'], self::DECISIONS, true)) {
            throw new DomainActionException('Decisión no válida.');
        }

        $this->enforcePreConditions($expediente, 'issueDecision', [], [], $files);

        /** @var ProcedureType|null $pt */
        $pt = $expediente->procedureType;
        if ($pt && $pt->getAttribute('has_validity') && $data['decision'] === 'approved') {
            if (empty($data['valid_from']) || empty($data['valid_until'])) {
                throw new DomainActionException('Este trámite requiere fechas de vigencia.');
            }
        }

        return DB::transaction(function () use ($expediente, $data, $files, $actor): Expediente {
            $finalStatus = match ($data['decision']) {
                'approved' => self::STATUS_COMPLETED,
                'rejected' => self::STATUS_REJECTED,
                'partial' => self::STATUS_PARTIAL,
                default => self::STATUS_SUSPENDED,
            };

            $expediente->setAttribute('decision', $data['decision']);
            $expediente->setAttribute('decision_notes', $data['notes'] ?? null);
            $expediente->setAttribute('decision_by', $actor->getKey());
            $expediente->setAttribute('decision_at', now());
            $expediente->setAttribute('completed_at', now());
            $expediente->setAttribute('status', $finalStatus);

            if (! empty($data['valid_from'])) {
                $expediente->setAttribute('valid_from', $data['valid_from']);
            }
            if (! empty($data['valid_until'])) {
                $expediente->setAttribute('valid_until', $data['valid_until']);
            }

            $expediente->save();

            $this->storeDecisionFiles($expediente, $files, $actor);

            $decisionLabel = match ($data['decision']) {
                'approved' => 'Aprobado',
                'rejected' => 'Rechazado',
                'partial' => 'Aprobado parcialmente',
                default => 'Suspendido',
            };

            $this->recordEvent($expediente, 'decision_issued', "Decisión emitida: {$decisionLabel}", $actor, [
                'decision' => $data['decision'],
                'files_count' => count($files),
            ]);

            return $expediente;
        });
    }

    public function returnToPhase(Expediente $expediente, string $targetStatus, string $reason, User $actor): Expediente
    {
        $currentStatus = (string) $expediente->getAttribute('status');

        if (in_array($currentStatus, self::TERMINAL_STATUSES, true)) {
            throw new DomainActionException('No se puede devolver un expediente en estado terminal.');
        }

        $currentIdx = array_search($currentStatus, self::PHASE_ORDER, true);
        $targetIdx = array_search($targetStatus, self::PHASE_ORDER, true);

        if ($currentIdx === false || $targetIdx === false) {
            throw new DomainActionException('Estado actual o destino no válido para devolución.');
        }

        if ($targetIdx >= $currentIdx) {
            throw new DomainActionException('La fase destino debe ser anterior a la fase actual.');
        }

        // Minimum return target is 'received'
        if ($targetIdx < 1) {
            throw new DomainActionException('No se puede devolver a fase borrador.');
        }

        return DB::transaction(function () use ($expediente, $currentStatus, $targetStatus, $reason, $actor): Expediente {
            $expediente->setAttribute('returned_from_status', $currentStatus);
            $expediente->setAttribute('return_reason', $reason);
            $expediente->setAttribute('status', $targetStatus);
            $expediente->save();

            $statusLabels = self::statusLabels();
            $fromLabel = $statusLabels[$currentStatus] ?? $currentStatus;
            $toLabel = $statusLabels[$targetStatus] ?? $targetStatus;

            $this->recordEvent($expediente, 'returned_to_phase', "Devuelto de «{$fromLabel}» a «{$toLabel}»: {$reason}", $actor, [
                'from_status' => $currentStatus,
                'to_status' => $targetStatus,
                'reason' => $reason,
            ]);

            return $expediente;
        });
    }

    // ──────────────────────────────────────────────
    // Status helpers
    // ──────────────────────────────────────────────

    /**
     * Determine the next applicable status given the current action target,
     * respecting ProcedureType workflow flags to skip non-required phases.
     */
    protected function resolveNextStatus(Expediente $expediente, string $naturalNext): string
    {
        /** @var ProcedureType|null $pt */
        $pt = $expediente->relationLoaded('procedureType')
            ? $expediente->procedureType
            : $expediente->procedureType()->first();

        if (! $pt) {
            return $naturalNext;
        }

        // Map each skippable status to the ProcedureType flag that controls it
        $skipMap = [
            self::STATUS_PENDING_REVIEWER => 'workflow_requires_review_assignment',
            self::STATUS_PENDING_INSPECTOR => 'workflow_requires_inspector_assignment',
            self::STATUS_IN_INSPECTION => 'workflow_requires_inspection',
            self::STATUS_PENDING_RESPONSE => 'workflow_requires_technical_response',
            self::STATUS_PENDING_DECISION => 'workflow_requires_decision',
        ];

        $idx = array_search($naturalNext, self::PHASE_ORDER, true);
        if ($idx === false) {
            return $naturalNext;
        }

        // Walk forward from naturalNext, skipping phases whose flag is false
        for ($i = $idx; $i < count(self::PHASE_ORDER); $i++) {
            $candidateStatus = self::PHASE_ORDER[$i];
            $flag = $skipMap[$candidateStatus] ?? null;

            // If no flag controls this phase, or the flag is true → use it
            if ($flag === null || (bool) $pt->getAttribute($flag)) {
                return $candidateStatus;
            }
        }

        // All remaining phases skipped → completed
        return self::STATUS_COMPLETED;
    }

    /** @return array<string, string> */
    public static function statusLabels(): array
    {
        return [
            self::STATUS_DRAFT => 'Borrador',
            self::STATUS_RECEIVED => 'Recibido',
            self::STATUS_PENDING_REVIEWER => 'Por asignar revisor',
            self::STATUS_PENDING_INSPECTOR => 'Por asignar inspector',
            self::STATUS_IN_INSPECTION => 'En inspección',
            self::STATUS_PENDING_RESPONSE => 'Por respuesta técnica',
            self::STATUS_PENDING_DECISION => 'Por decisión',
            self::STATUS_COMPLETED => 'Concluido',
            self::STATUS_REJECTED => 'Rechazado',
            self::STATUS_PARTIAL => 'Aprobado parcialmente',
            self::STATUS_SUSPENDED => 'Suspendido',
        ];
    }

    /**
     * Return the list of statuses to which a given expediente can be returned.
     *
     * @return array<int, array{value: string, label: string}>
     */
    public function returnablePhases(Expediente $expediente): array
    {
        $currentStatus = (string) $expediente->getAttribute('status');
        $currentIdx = array_search($currentStatus, self::PHASE_ORDER, true);

        if ($currentIdx === false || $currentIdx <= 1) {
            return [];
        }

        $labels = self::statusLabels();
        $phases = [];

        // From index 1 (received) up to currentIdx - 1
        for ($i = 1; $i < $currentIdx; $i++) {
            $s = self::PHASE_ORDER[$i];
            $phases[] = ['value' => $s, 'label' => $labels[$s] ?? $s];
        }

        return $phases;
    }

    // ──────────────────────────────────────────────
    // Phase validation (pre-conditions)
    // ──────────────────────────────────────────────

    /**
     * Check all pre-conditions for a given transition and return an array of
     * human-readable warnings. Empty array = ready to proceed.
     *
     * @return array<int, string>
     */
    public function validatePreConditions(Expediente $expediente, string $action): array
    {
        /** @var ProcedureType|null $pt */
        $pt = $expediente->relationLoaded('procedureType')
            ? $expediente->procedureType
            : $expediente->procedureType()->first();

        if (! $pt) {
            return [];
        }

        return match ($action) {
            'confirm' => $this->validateReception($expediente, $pt),
            'submitInspection' => $this->validateInspectionSubmit($pt),
            'issueDecision' => $this->validateDecision($pt),
            default => [],
        };
    }

    /**
     * Enforce pre-conditions — throws if validation fails.
     *
     * @param  array<\Illuminate\Http\UploadedFile>  $photos
     * @param  array<\Illuminate\Http\UploadedFile>  $reports
     * @param  array<\Illuminate\Http\UploadedFile>  $decisionFiles
     */
    public function enforcePreConditions(Expediente $expediente, string $action, array $photos = [], array $reports = [], array $decisionFiles = []): void
    {
        /** @var ProcedureType|null $pt */
        $pt = $expediente->relationLoaded('procedureType')
            ? $expediente->procedureType
            : $expediente->procedureType()->first();

        if (! $pt) {
            return;
        }

        match ($action) {
            'confirm' => $this->enforceReception($expediente, $pt),
            'submitInspection' => $this->enforceInspectionSubmit($pt, $photos, $reports),
            'issueDecision' => $this->enforceDecision($pt, $decisionFiles),
            default => null,
        };
    }

    /** @return array<int, string> */
    private function validateReception(Expediente $expediente, ProcedureType $pt): array
    {
        $warnings = [];

        if ((bool) $pt->getAttribute('reception_requires_all_recaudos')) {
            $expediente->loadMissing('requirements');
            $missing = $expediente->requirements
                ->filter(fn ($r) => (bool) $r->getAttribute('is_required') && ! (bool) $r->getAttribute('physical_received'))
                ->count();
            if ($missing > 0) {
                $warnings[] = "Faltan {$missing} recaudo(s) requerido(s) por consignar.";
            }
        }

        if ((bool) $pt->getAttribute('reception_requires_file_uploads')) {
            $expediente->loadMissing('requirements.currentFile');
            $missingFiles = $expediente->requirements
                ->filter(fn ($r) => (bool) $r->getAttribute('is_required') && ! $r->relationLoaded('currentFile'))
                ->count();
            $missingFiles2 = $expediente->requirements
                ->filter(fn ($r) => (bool) $r->getAttribute('is_required') && $r->currentFile === null)
                ->count();
            if ($missingFiles2 > 0) {
                $warnings[] = "{$missingFiles2} recaudo(s) requerido(s) sin archivo digital cargado.";
            }
        }

        return $warnings;
    }

    private function enforceReception(Expediente $expediente, ProcedureType $pt): void
    {
        $warnings = $this->validateReception($expediente, $pt);
        if (! empty($warnings)) {
            throw new DomainActionException(implode(' ', $warnings));
        }
    }

    /** @return array<int, string> */
    private function validateInspectionSubmit(ProcedureType $pt): array
    {
        $warnings = [];
        if ((bool) $pt->getAttribute('inspection_requires_photos')) {
            $warnings[] = 'Se requiere al menos una fotografía de evidencia.';
        }
        if ((bool) $pt->getAttribute('inspection_requires_report')) {
            $warnings[] = 'Se requiere al menos un informe de inspección.';
        }

        return $warnings;
    }

    /**
     * @param  array<\Illuminate\Http\UploadedFile>  $photos
     * @param  array<\Illuminate\Http\UploadedFile>  $reports
     */
    private function enforceInspectionSubmit(ProcedureType $pt, array $photos, array $reports): void
    {
        if ((bool) $pt->getAttribute('inspection_requires_photos') && count($photos) === 0) {
            throw new DomainActionException('Este tipo de trámite requiere al menos una fotografía de inspección.');
        }
        if ((bool) $pt->getAttribute('inspection_requires_report') && count($reports) === 0) {
            throw new DomainActionException('Este tipo de trámite requiere al menos un informe de inspección.');
        }
    }

    /** @return array<int, string> */
    private function validateDecision(ProcedureType $pt): array
    {
        $warnings = [];
        if ((bool) $pt->getAttribute('decision_requires_document')) {
            $warnings[] = 'Se requiere adjuntar documento de decisión.';
        }

        return $warnings;
    }

    /** @param  array<\Illuminate\Http\UploadedFile>  $files */
    private function enforceDecision(ProcedureType $pt, array $files): void
    {
        if ((bool) $pt->getAttribute('decision_requires_document') && count($files) === 0) {
            throw new DomainActionException('Este tipo de trámite requiere adjuntar un documento de decisión.');
        }
    }

    // ──────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────

    protected function assertStatus(Expediente $expediente, string $expected): void
    {
        $current = (string) $expediente->getAttribute('status');
        if ($current !== $expected) {
            $labels = self::statusLabels();
            $expectedLabel = $labels[$expected] ?? $expected;
            $currentLabel = $labels[$current] ?? $current;
            throw new DomainActionException("El expediente debe estar en estado «{$expectedLabel}» (actual: «{$currentLabel}»).");
        }
    }

    /** @param  array<string, mixed>|null  $payload */
    protected function recordEvent(Expediente $expediente, string $type, string $description, User $actor, ?array $payload = null): void
    {
        ExpedienteEvent::query()->create([
            'expediente_id' => $expediente->getKey(),
            'type' => $type,
            'description' => $description,
            'payload' => $payload,
            'actor_id' => $actor->getKey(),
            'actor_name' => (string) $actor->getAttribute('name'),
            'created_at' => now(),
        ]);
    }

    /**
     * @param  array<UploadedFile>  $files
     */
    protected function storeInspectionFiles(ExpedienteInspection $inspection, array $files, string $type, User $actor): void
    {
        $disk = 'local';
        $basePath = 'expedientes/inspections/'.$inspection->getKey();

        foreach ($files as $file) {
            $ext = $file->getClientOriginalExtension() ?: 'bin';
            $storedPath = $file->storeAs($basePath, Str::ulid()->toBase32().'.'.$ext, $disk);

            if ($storedPath === false) {
                throw new DomainActionException('Error al almacenar archivo de inspección.');
            }

            $hash = null;
            $fullPath = Storage::disk($disk)->path($storedPath);
            if (file_exists($fullPath)) {
                $hash = hash_file('sha256', $fullPath);
            }

            ExpedienteInspectionFile::query()->create([
                'inspection_id' => $inspection->getKey(),
                'type' => $type,
                'disk' => $disk,
                'path' => $storedPath,
                'original_name' => $file->getClientOriginalName(),
                'mime' => (string) $file->getClientMimeType(),
                'size' => (int) $file->getSize(),
                'sha256' => $hash ?: null,
                'uploaded_by' => $actor->getKey(),
                'uploaded_at' => now(),
            ]);
        }
    }

    /**
     * @param  array<UploadedFile>  $files
     */
    protected function storeDecisionFiles(Expediente $expediente, array $files, User $actor): void
    {
        $disk = 'local';
        $basePath = 'expedientes/decisions/'.$expediente->getKey();

        foreach ($files as $file) {
            $ext = $file->getClientOriginalExtension() ?: 'bin';
            $storedPath = $file->storeAs($basePath, Str::ulid()->toBase32().'.'.$ext, $disk);

            if ($storedPath === false) {
                throw new DomainActionException('Error al almacenar archivo de decisión.');
            }

            $hash = null;
            $fullPath = Storage::disk($disk)->path($storedPath);
            if (file_exists($fullPath)) {
                $hash = hash_file('sha256', $fullPath);
            }

            ExpedienteDecisionFile::query()->create([
                'expediente_id' => $expediente->getKey(),
                'disk' => $disk,
                'path' => $storedPath,
                'original_name' => $file->getClientOriginalName(),
                'mime' => (string) $file->getClientMimeType(),
                'size' => (int) $file->getSize(),
                'sha256' => $hash ?: null,
                'uploaded_by' => $actor->getKey(),
                'uploaded_at' => now(),
            ]);
        }
    }

    /**
     * @param  array<UploadedFile>  $files
     */
    protected function storeResponseFiles(ExpedienteResponse $response, array $files, User $actor): void
    {
        $disk = 'local';
        $basePath = 'expedientes/responses/'.$response->getKey();

        foreach ($files as $file) {
            $ext = $file->getClientOriginalExtension() ?: 'bin';
            $storedPath = $file->storeAs($basePath, Str::ulid()->toBase32().'.'.$ext, $disk);

            if ($storedPath === false) {
                throw new DomainActionException('Error al almacenar archivo de respuesta técnica.');
            }

            $hash = null;
            $fullPath = Storage::disk($disk)->path($storedPath);
            if (file_exists($fullPath)) {
                $hash = hash_file('sha256', $fullPath);
            }

            ExpedienteResponseFile::query()->create([
                'response_id' => $response->getKey(),
                'disk' => $disk,
                'path' => $storedPath,
                'original_name' => $file->getClientOriginalName(),
                'mime' => (string) $file->getClientMimeType(),
                'size' => (int) $file->getSize(),
                'sha256' => $hash ?: null,
                'uploaded_by' => $actor->getKey(),
                'uploaded_at' => now(),
            ]);
        }
    }
}

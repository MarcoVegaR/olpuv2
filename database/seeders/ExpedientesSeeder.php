<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Expediente;
use App\Models\ExpedienteEvent;
use App\Models\ExpedienteInspection;
use App\Models\ExpedienteRequirement;
use App\Models\ExpedienteResponse;
use App\Models\ProcedureType;
use App\Models\Solicitante;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ExpedientesSeeder extends Seeder
{
    /** @var array<string, int> */
    private array $statusDistribution = [
        'received' => 3,
        'pending_reviewer' => 2,
        'pending_inspector' => 2,
        'in_inspection' => 2,
        'pending_response' => 2,
        'pending_decision' => 2,
        'completed' => 2,
        'rejected' => 1,
    ];

    public function run(): void
    {
        $solicitantes = Solicitante::query()->where('is_active', true)->get();

        if ($solicitantes->isEmpty()) {
            $this->command->warn('No active solicitantes found. Run SolicitantesSeeder first.');

            return;
        }

        $procedureTypes = ProcedureType::query()
            ->where('is_active', true)
            ->with('requirements')
            ->get();

        if ($procedureTypes->isEmpty()) {
            $this->command->warn('No active procedure types found. Run TramitesCatalogSeeder first.');

            return;
        }

        $users = User::query()->where('is_active', true)->get();

        if ($users->isEmpty()) {
            $this->command->warn('No users found. Run UsersSeeder first.');

            return;
        }

        $receiverUser = $users->firstWhere('email', 'secretaria@mailinator.com') ?? $users->first();
        $reviewers = [
            $users->firstWhere('email', 'revisor@mailinator.com') ?? $users->first(),
            $users->firstWhere('email', 'revisor2@mailinator.com') ?? $users->first(),
        ];
        $inspectors = [
            $users->firstWhere('email', 'inspector@mailinator.com') ?? $users->first(),
            $users->firstWhere('email', 'inspector2@mailinator.com') ?? $users->first(),
        ];
        $directoraUser = $users->firstWhere('email', 'directora@mailinator.com') ?? $users->first();
        $createdCount = 0;
        $receptoriaNum = 1;
        $assignmentIndex = 0;

        foreach ($this->statusDistribution as $status => $qty) {
            for ($i = 0; $i < $qty; $i++) {
                $solicitante = $solicitantes->random();
                $procedureType = $procedureTypes->random();

                // Alternate reviewer/inspector pairs so each gets roughly half
                $reviewerUser = $reviewers[$assignmentIndex % 2];
                $inspectorUser = $inspectors[$assignmentIndex % 2];
                $assignmentIndex++;

                $ulid = strtoupper(Str::ulid()->toBase32());
                $tracking = 'EXP-'.$ulid;
                $qrToken = Str::random(32);
                $receivedAt = now()->subDays(rand(5, 60));

                $attrs = [
                    'procedure_type_id' => $procedureType->id,
                    'solicitante_id' => $solicitante->id,
                    'tracking' => $tracking,
                    'qr_token' => $qrToken,
                    'status' => $status,
                    'numero_receptoria' => str_pad((string) $receptoriaNum, 6, '0', STR_PAD_LEFT),
                    'codigo_catastral' => $this->generateCatastralCode(),
                    'observaciones' => $this->getRandomObservation(),
                    'presentado_por_nombre' => rand(0, 1) ? $this->getRandomPresenterName() : null,
                    'presentado_por_documento' => rand(0, 1) ? $this->getRandomDocument() : null,
                    'presentado_por_telefono' => rand(0, 1) ? $this->getRandomPhone() : null,
                    'received_at' => $receivedAt,
                    'received_by' => $receiverUser->id,
                    'is_active' => true,
                ];

                $this->applyWorkflowState($attrs, $status, $reviewerUser, $inspectorUser, $directoraUser, $receivedAt);

                /** @var Expediente $expediente */
                $expediente = Expediente::query()->create($attrs);

                // Requirements
                $requirements = $procedureType->requirements ?? [];
                $sortOrder = 1;
                foreach ($requirements as $requirement) {
                    $physicalReceived = rand(0, 100) > 30;
                    ExpedienteRequirement::query()->create([
                        'expediente_id' => $expediente->id,
                        'requirement_id' => $requirement->id,
                        'sort_order' => $sortOrder++,
                        'is_required' => $requirement->pivot->is_required ?? true,
                        'is_active' => true,
                        'physical_received' => $physicalReceived,
                        'physical_received_at' => $physicalReceived ? $receivedAt : null,
                        'physical_received_by' => $physicalReceived ? $receiverUser->id : null,
                        'notes' => rand(0, 100) > 80 ? 'Documento verificado' : null,
                    ]);
                }

                // Timeline event for reception
                ExpedienteEvent::query()->create([
                    'expediente_id' => $expediente->id,
                    'type' => 'reception_created',
                    'description' => 'Expediente recepcionado',
                    'actor_id' => $receiverUser->id,
                    'actor_name' => (string) $receiverUser->getAttribute('name'),
                    'created_at' => $receivedAt,
                ]);

                // Additional records for advanced states
                $this->seedWorkflowRecords($expediente, $status, $reviewerUser, $inspectorUser, $directoraUser, $receivedAt);

                $receptoriaNum++;
                $createdCount++;
            }
        }

        $this->command->info("Created {$createdCount} test expedientes across various workflow phases.");
    }

    /**
     * @param  array<string, mixed>  $attrs
     */
    private function applyWorkflowState(array &$attrs, string $status, User $reviewer, User $inspector, User $directora, \Illuminate\Support\Carbon $receivedAt): void
    {
        $needsReviewer = in_array($status, ['pending_reviewer', 'pending_inspector', 'in_inspection', 'pending_response', 'pending_decision', 'completed', 'rejected'], true);
        $needsInspector = in_array($status, ['pending_inspector', 'in_inspection', 'pending_response', 'pending_decision', 'completed', 'rejected'], true);

        if ($needsReviewer) {
            $attrs['reviewer_id'] = $reviewer->id;
            $attrs['reviewer_assigned_at'] = $receivedAt->copy()->addDay();
        }
        if ($needsInspector) {
            $attrs['inspector_id'] = $inspector->id;
            $attrs['inspector_assigned_at'] = $receivedAt->copy()->addDays(2);
        }
        if (in_array($status, ['completed', 'rejected'], true)) {
            $attrs['decision'] = $status === 'completed' ? 'approved' : 'rejected';
            $attrs['decision_notes'] = $status === 'completed' ? 'Todo en orden.' : 'No cumple con los requisitos.';
            $attrs['decision_by'] = $directora->id;
            $attrs['decision_at'] = $receivedAt->copy()->addDays(rand(10, 20));
            $attrs['completed_at'] = $attrs['decision_at'];
        }
    }

    private function seedWorkflowRecords(Expediente $expediente, string $status, User $reviewer, User $inspector, User $directora, \Illuminate\Support\Carbon $receivedAt): void
    {
        $hasInspection = in_array($status, ['pending_response', 'pending_decision', 'completed', 'rejected'], true);
        $hasResponse = in_array($status, ['pending_decision', 'completed', 'rejected'], true);

        if ($hasInspection) {
            ExpedienteInspection::query()->create([
                'expediente_id' => $expediente->id,
                'inspector_id' => $inspector->id,
                'observations' => 'Inspección realizada correctamente. Sin observaciones relevantes.',
                'result' => 'favorable',
                'inspected_at' => $receivedAt->copy()->addDays(5)->toDateString(),
                'submitted_at' => $receivedAt->copy()->addDays(6),
            ]);

            ExpedienteEvent::query()->create([
                'expediente_id' => $expediente->id,
                'type' => 'inspection_submitted',
                'description' => 'Inspección registrada',
                'actor_id' => $inspector->id,
                'actor_name' => (string) $inspector->getAttribute('name'),
                'created_at' => $receivedAt->copy()->addDays(6),
            ]);
        }

        if ($hasResponse) {
            ExpedienteResponse::query()->create([
                'expediente_id' => $expediente->id,
                'reviewer_id' => $reviewer->id,
                'content' => 'Se confirma que la documentación está completa y la inspección es favorable. Se recomienda aprobación.',
                'submitted_at' => $receivedAt->copy()->addDays(8),
            ]);

            ExpedienteEvent::query()->create([
                'expediente_id' => $expediente->id,
                'type' => 'response_submitted',
                'description' => 'Respuesta técnica enviada',
                'actor_id' => $reviewer->id,
                'actor_name' => (string) $reviewer->getAttribute('name'),
                'created_at' => $receivedAt->copy()->addDays(8),
            ]);
        }

        if (in_array($status, ['completed', 'rejected'], true)) {
            ExpedienteEvent::query()->create([
                'expediente_id' => $expediente->id,
                'type' => 'decision_issued',
                'description' => $status === 'completed' ? 'Decisión emitida: Aprobado' : 'Decisión emitida: Rechazado',
                'actor_id' => $directora->id,
                'actor_name' => (string) $directora->getAttribute('name'),
                'created_at' => $receivedAt->copy()->addDays(12),
            ]);
        }
    }

    private function generateCatastralCode(): ?string
    {
        if (rand(0, 100) > 20) { // 80% have catastral code
            return sprintf(
                '%02d-%02d-%02d-%03d-%03d',
                rand(1, 15),
                rand(1, 10),
                rand(1, 5),
                rand(1, 999),
                rand(1, 999)
            );
        }

        return null;
    }

    private function getRandomObservation(): ?string
    {
        if (rand(0, 100) > 60) { // 40% have observations
            $observations = [
                'Documentos completos al momento de recepción.',
                'Pendiente por revisar expediente anterior del solicitante.',
                'Se sugiere inspección prioritaria.',
                'Documentación verificada con originales.',
                'Solicitante indica urgencia en el trámite.',
                'Requiere coordinación con otros departamentos.',
                null,
            ];

            return $observations[array_rand($observations)];
        }

        return null;
    }

    private function getRandomPresenterName(): string
    {
        $names = [
            'José Luis Martínez',
            'Carmen Elena Suárez',
            'Miguel Ángel Torres',
            'Patricia Fernández',
            'Luis Alberto Gómez',
            'Rosa María Díaz',
            'Fernando Ramírez',
            'Andrea Carolina López',
        ];

        return $names[array_rand($names)];
    }

    private function getRandomDocument(): string
    {
        $types = ['V', 'E'];
        $type = $types[array_rand($types)];

        return $type.'-'.rand(10000000, 30000000);
    }

    private function getRandomPhone(): string
    {
        $prefixes = ['0414', '0424', '0412', '0416', '0426'];
        $prefix = $prefixes[array_rand($prefixes)];

        return $prefix.'-'.rand(1000000, 9999999);
    }
}

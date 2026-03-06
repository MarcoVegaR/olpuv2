<?php

declare(strict_types=1);

namespace Tests\Feature\Expedientes;

use App\Models\Expediente;
use App\Models\ExpedienteDecisionFile;
use App\Models\ProcedureType;
use App\Models\Solicitante;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role as SpatieRole;
use Tests\TestCase;

class ExpedienteDecisionFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $directora;

    private User $recepcionista;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['expedientes.decision.issue', 'expedientes.decision.files', 'expedientes.files.view'] as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $this->directora = User::factory()->create();
        $this->recepcionista = User::factory()->create();

        $directorRole = SpatieRole::create(['name' => 'expediente_directora_test', 'guard_name' => 'web']);
        $directorRole->syncPermissions(['expedientes.decision.issue', 'expedientes.files.view']);
        $this->directora->assignRole($directorRole);

        $receptionRole = SpatieRole::create(['name' => 'expediente_recepcion_test', 'guard_name' => 'web']);
        $receptionRole->syncPermissions(['expedientes.decision.files', 'expedientes.files.view']);
        $this->recepcionista->assignRole($receptionRole);

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function test_directora_can_issue_decision_without_final_document(): void
    {
        $procedureType = ProcedureType::factory()->create([
            'decision_requires_document' => true,
        ]);
        $solicitante = Solicitante::factory()->create();

        $expediente = Expediente::query()->create([
            'procedure_type_id' => $procedureType->id,
            'solicitante_id' => $solicitante->id,
            'tracking' => 'TRK-'.Str::ulid(),
            'qr_token' => hash('sha256', (string) Str::ulid()),
            'status' => 'pending_decision',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->directora)->patch(route('expedientes.issueDecision', $expediente), [
            'decision' => 'approved',
            'notes' => 'Decisión emitida por dirección.',
        ]);

        $response->assertRedirect(route('expedientes.show', $expediente));

        $expediente->refresh();

        $this->assertSame('pending_decision', (string) $expediente->getAttribute('status'));
        $this->assertSame('approved', (string) $expediente->getAttribute('decision'));
        $this->assertNull($expediente->getAttribute('completed_at'));
    }

    public function test_directora_can_attach_correction_files_when_issuing_decision(): void
    {
        Storage::fake('local');

        $procedureType = ProcedureType::factory()->create();
        $solicitante = Solicitante::factory()->create();

        $expediente = Expediente::query()->create([
            'procedure_type_id' => $procedureType->id,
            'solicitante_id' => $solicitante->id,
            'tracking' => 'TRK-'.Str::ulid(),
            'qr_token' => hash('sha256', (string) Str::ulid()),
            'status' => 'pending_decision',
            'is_active' => true,
        ]);

        $correction = UploadedFile::fake()->create(
            'correccion-directora.docx',
            120,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );

        $response = $this->actingAs($this->directora)->post(route('expedientes.issueDecision', $expediente), [
            '_method' => 'patch',
            'decision' => 'partial',
            'correction_files' => [$correction],
        ]);

        $response->assertRedirect(route('expedientes.show', $expediente));

        $file = ExpedienteDecisionFile::query()
            ->where('expediente_id', $expediente->id)
            ->latest('id')
            ->firstOrFail();

        $this->assertSame('correction', (string) $file->getAttribute('kind'));
        Storage::disk('local')->assertExists((string) $file->getAttribute('path'));
    }

    public function test_recepcionista_can_attach_final_signed_document_and_complete_expediente(): void
    {
        Storage::fake('local');

        $procedureType = ProcedureType::factory()->create([
            'decision_requires_document' => true,
        ]);
        $solicitante = Solicitante::factory()->create();

        $expediente = Expediente::query()->create([
            'procedure_type_id' => $procedureType->id,
            'solicitante_id' => $solicitante->id,
            'tracking' => 'TRK-'.Str::ulid(),
            'qr_token' => hash('sha256', (string) Str::ulid()),
            'status' => 'pending_final_doc',
            'decision' => 'approved',
            'decision_at' => now(),
            'is_active' => true,
        ]);

        $signedDoc = UploadedFile::fake()->create('decision-firmada.pdf', 320, 'application/pdf');

        $response = $this->actingAs($this->recepcionista)->post(route('expedientes.uploadFinalDecisionDocument', $expediente), [
            'files' => [$signedDoc],
        ]);

        $response->assertRedirect(route('expedientes.show', $expediente));

        $expediente->refresh();

        $this->assertSame('completed', (string) $expediente->getAttribute('status'));
        $this->assertNotNull($expediente->getAttribute('completed_at'));

        $file = ExpedienteDecisionFile::query()
            ->where('expediente_id', $expediente->id)
            ->latest('id')
            ->firstOrFail();

        $this->assertSame('decision_document', (string) $file->getAttribute('kind'));

        $download = $this->actingAs($this->recepcionista)->get(route('expedientes.decisionFiles.download', [
            'expediente' => $expediente,
            'file' => $file,
        ]));

        $download->assertOk();
        $download->assertHeader('content-disposition');
    }
}

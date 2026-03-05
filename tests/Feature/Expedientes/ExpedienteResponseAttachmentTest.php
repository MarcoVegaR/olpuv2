<?php

declare(strict_types=1);

namespace Tests\Feature\Expedientes;

use App\Models\Expediente;
use App\Models\ExpedienteResponse;
use App\Models\ExpedienteResponseFile;
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

class ExpedienteResponseAttachmentTest extends TestCase
{
    use RefreshDatabase;

    private User $reviewer;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['expedientes.response.submit', 'expedientes.inspection.submit', 'expedientes.files.view'] as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $this->reviewer = User::factory()->create();
        $role = SpatieRole::create(['name' => 'expediente_response_test', 'guard_name' => 'web']);
        $role->syncPermissions(Permission::all());
        $this->reviewer->assignRole($role);

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function test_reviewer_can_submit_response_with_word_attachment_and_download_it(): void
    {
        Storage::fake('local');

        $procedureType = ProcedureType::factory()->create();
        $solicitante = Solicitante::factory()->create();

        $expediente = Expediente::query()->create([
            'procedure_type_id' => $procedureType->id,
            'solicitante_id' => $solicitante->id,
            'tracking' => 'TRK-'.Str::ulid(),
            'qr_token' => hash('sha256', (string) Str::ulid()),
            'status' => 'pending_response',
            'reviewer_id' => $this->reviewer->id,
            'is_active' => true,
        ]);

        $attachment = UploadedFile::fake()->create(
            'respuesta-tecnica.docx',
            200,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );

        $response = $this->actingAs($this->reviewer)->post(route('expedientes.submitResponse', $expediente), [
            'content' => 'Respuesta técnica de prueba',
            'files' => [$attachment],
        ]);

        $response->assertRedirect(route('expedientes.show', $expediente));

        $expedienteResponse = ExpedienteResponse::query()
            ->where('expediente_id', $expediente->id)
            ->latest('id')
            ->firstOrFail();

        $responseFile = ExpedienteResponseFile::query()
            ->where('response_id', $expedienteResponse->id)
            ->latest('id')
            ->firstOrFail();

        Storage::disk('local')->assertExists((string) $responseFile->getAttribute('path'));

        $download = $this->actingAs($this->reviewer)->get(route('expedientes.responseFiles.download', [
            'expediente' => $expediente,
            'file' => $responseFile,
        ]));

        $download->assertOk();
        $download->assertHeader('content-disposition');
    }

    public function test_response_rejects_invalid_attachment_type(): void
    {
        $procedureType = ProcedureType::factory()->create();
        $solicitante = Solicitante::factory()->create();

        $expediente = Expediente::query()->create([
            'procedure_type_id' => $procedureType->id,
            'solicitante_id' => $solicitante->id,
            'tracking' => 'TRK-'.Str::ulid(),
            'qr_token' => hash('sha256', (string) Str::ulid()),
            'status' => 'pending_response',
            'reviewer_id' => $this->reviewer->id,
            'is_active' => true,
        ]);

        $invalidFile = UploadedFile::fake()->create('no-permitido.txt', 10, 'text/plain');

        $response = $this->actingAs($this->reviewer)->post(route('expedientes.submitResponse', $expediente), [
            'content' => 'Intento con archivo inválido',
            'files' => [$invalidFile],
        ]);

        $response->assertSessionHasErrors([
            'files.0' => 'Solo se permiten archivos PDF, DOC o DOCX en la respuesta técnica.',
        ]);
    }

    public function test_inspection_rejects_invalid_report_type(): void
    {
        $procedureType = ProcedureType::factory()->create();
        $solicitante = Solicitante::factory()->create();

        $expediente = Expediente::query()->create([
            'procedure_type_id' => $procedureType->id,
            'solicitante_id' => $solicitante->id,
            'tracking' => 'TRK-'.Str::ulid(),
            'qr_token' => hash('sha256', (string) Str::ulid()),
            'status' => 'in_inspection',
            'inspector_id' => $this->reviewer->id,
            'is_active' => true,
        ]);

        $photo = UploadedFile::fake()->image('evidencia.jpg');
        $invalidReport = UploadedFile::fake()->create('informe.txt', 10, 'text/plain');

        $response = $this->actingAs($this->reviewer)->post(route('expedientes.submitInspection', $expediente), [
            'observations' => 'Inspección de prueba',
            'result' => 'favorable',
            'inspected_at' => now()->toDateString(),
            'photos' => [$photo],
            'reports' => [$invalidReport],
        ]);

        $response->assertSessionHasErrors(['reports.0']);
    }

    public function test_inspection_surfaces_workflow_error_when_required_photo_is_missing(): void
    {
        $procedureType = ProcedureType::factory()->create([
            'inspection_requires_photos' => true,
            'inspection_requires_report' => false,
        ]);
        $solicitante = Solicitante::factory()->create();

        $expediente = Expediente::query()->create([
            'procedure_type_id' => $procedureType->id,
            'solicitante_id' => $solicitante->id,
            'tracking' => 'TRK-'.Str::ulid(),
            'qr_token' => hash('sha256', (string) Str::ulid()),
            'status' => 'in_inspection',
            'inspector_id' => $this->reviewer->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->reviewer)->post(route('expedientes.submitInspection', $expediente), [
            'observations' => 'Inspección sin foto para validar error de workflow',
            'result' => 'favorable',
            'inspected_at' => now()->toDateString(),
        ]);

        $response->assertSessionHasErrors([
            'workflow' => 'Este tipo de trámite requiere al menos una fotografía de inspección.',
        ]);
    }
}

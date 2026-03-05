<?php

declare(strict_types=1);

namespace Tests\Feature\Expedientes;

use App\Mail\ExpedienteReceivedMail;
use App\Models\Expediente;
use App\Models\ProcedureType;
use App\Models\Requirement;
use App\Models\Solicitante;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role as SpatieRole;
use Tests\TestCase;

class ExpedienteEmailNotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $actor;

    protected function setUp(): void
    {
        parent::setUp();

        $perms = ['expedientes.create', 'expedientes.view'];
        foreach ($perms as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        $this->actor = User::factory()->create();
        $role = SpatieRole::create(['name' => 'recepcionista_test', 'guard_name' => 'web']);
        $role->syncPermissions(Permission::all());
        $this->actor->assignRole($role);

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function test_email_is_sent_when_expediente_is_confirmed_with_solicitante_email(): void
    {
        Mail::fake();

        $solicitante = Solicitante::factory()->create([
            'email' => 'solicitante@example.com',
            'nombre_razon_social' => 'Juan Pérez',
        ]);

        $procedureType = ProcedureType::factory()->create([
            'name' => 'Permiso de Construcción',
            'reception_requires_all_recaudos' => false,
        ]);

        $requirement = Requirement::factory()->create(['name' => 'Cédula de Identidad']);
        $procedureType->requirements()->attach($requirement->id, [
            'is_required' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($this->actor)->post(route('expedientes.store'), [
            'solicitante_id' => $solicitante->id,
            'procedure_type_id' => $procedureType->id,
            'numero_receptoria' => 'REC-001',
            'codigo_catastral' => 'CAT-001',
            'observaciones' => 'Test',
            'physical_received_requirement_ids' => [$requirement->id],
            'confirm' => true,
        ]);

        $response->assertRedirect();

        Mail::assertQueued(ExpedienteReceivedMail::class, function ($mail) use ($solicitante) {
            return $mail->hasTo($solicitante->email);
        });
    }

    public function test_email_is_not_sent_when_expediente_is_saved_as_draft(): void
    {
        Mail::fake();

        $solicitante = Solicitante::factory()->create([
            'email' => 'solicitante@example.com',
        ]);

        $procedureType = ProcedureType::factory()->create([
            'reception_requires_all_recaudos' => false,
        ]);

        $this->actingAs($this->actor)->post(route('expedientes.store'), [
            'solicitante_id' => $solicitante->id,
            'procedure_type_id' => $procedureType->id,
            'numero_receptoria' => 'REC-002',
            'confirm' => false,
        ]);

        Mail::assertNothingQueued();
    }

    public function test_email_is_not_sent_when_solicitante_has_no_email(): void
    {
        Mail::fake();

        $solicitante = Solicitante::factory()->create([
            'email' => null,
        ]);

        $procedureType = ProcedureType::factory()->create([
            'reception_requires_all_recaudos' => false,
        ]);

        $this->actingAs($this->actor)->post(route('expedientes.store'), [
            'solicitante_id' => $solicitante->id,
            'procedure_type_id' => $procedureType->id,
            'numero_receptoria' => 'REC-003',
            'confirm' => true,
        ]);

        Mail::assertNothingQueued();
    }

    public function test_email_contains_tracking_number_and_requirements_list(): void
    {
        Mail::fake();

        $solicitante = Solicitante::factory()->create([
            'email' => 'test@example.com',
            'nombre_razon_social' => 'María González',
        ]);

        $procedureType = ProcedureType::factory()->create([
            'name' => 'Permiso de Habitabilidad',
            'reception_requires_all_recaudos' => false,
        ]);

        $req1 = Requirement::factory()->create(['name' => 'Plano de ubicación']);
        $req2 = Requirement::factory()->create(['name' => 'Cédula']);

        $procedureType->requirements()->attach([
            $req1->id => ['is_required' => true, 'is_active' => true, 'sort_order' => 1],
            $req2->id => ['is_required' => false, 'is_active' => true, 'sort_order' => 2],
        ]);

        $this->actingAs($this->actor)->post(route('expedientes.store'), [
            'solicitante_id' => $solicitante->id,
            'procedure_type_id' => $procedureType->id,
            'numero_receptoria' => 'REC-004',
            'physical_received_requirement_ids' => [$req1->id],
            'confirm' => true,
        ]);

        Mail::assertQueued(ExpedienteReceivedMail::class, function ($mail) {
            $expediente = Expediente::latest()->first();

            return $mail->expediente->tracking === $expediente->tracking
                && $mail->procedureTypeName === 'Permiso de Habitabilidad'
                && $mail->solicitanteNombre === 'María González'
                && count($mail->requirements) === 2
                && str_contains($mail->trackingUrl, 'public/tracking');
        });
    }
}

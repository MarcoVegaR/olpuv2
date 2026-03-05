<?php

declare(strict_types=1);

namespace Tests\Feature\Solicitantes;

use App\Models\Solicitante;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role as SpatieRole;
use Tests\TestCase;

class SolicitanteUpdateTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Permission::firstOrCreate(['name' => 'solicitantes.update', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $role = SpatieRole::create(['name' => 'solicitantes_admin_test', 'guard_name' => 'web']);
        $role->syncPermissions(Permission::all());
        $this->admin->assignRole($role);

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function test_admin_can_update_solicitante_email(): void
    {
        $solicitante = Solicitante::factory()->create([
            'tipo_documento' => 'V',
            'numero_documento' => '12345678',
            'nombre_razon_social' => 'Solicitante Demo',
            'email' => 'anterior@example.com',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->put(route('solicitantes.update', $solicitante), [
            'tipo_documento' => 'V',
            'numero_documento' => '12345678',
            'nombre_razon_social' => 'Solicitante Demo',
            'telefono' => '04140000000',
            'email' => 'nuevo@example.com',
            'direccion' => 'Dirección actualizada',
            'is_active' => true,
        ]);

        $response
            ->assertRedirect(route('solicitantes.index'))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('solicitantes', [
            'id' => $solicitante->id,
            'email' => 'nuevo@example.com',
            'telefono' => '04140000000',
        ]);
    }
}

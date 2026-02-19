<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UsersSeeder extends Seeder
{
    /**
     * Seed the application's default users and roles.
     */
    public function run(): void
    {
        $guard = 'web';

        // ── Admin ──
        $admin = User::query()->firstOrCreate(
            ['email' => 'proyectos@caracoders.com.ve'],
            ['name' => 'Administrador', 'password' => Hash::make('12345678')]
        );

        $adminRole = Role::where('name', 'admin')->where('guard_name', $guard)->first();
        if ($adminRole) {
            $admin->syncRoles([$adminRole]);
        }

        // ── Role definitions ──
        $roles = [
            'recepcionista' => [
                'expedientes.view',
                'expedientes.create',
                'expedientes.update',
                'expedientes.receive',
                'expedientes.qr.download',
                'expedientes.files.view',
                'expedientes.files.upload',
                'expedientes.files.replace',
                'expedientes.export',
                'solicitantes.view',
                'solicitantes.create',
                'solicitantes.update',
            ],
            'revisor' => [
                'expedientes.view',
                'expedientes.export',
                'expedientes.qr.download',
                'expedientes.files.view',
                'expedientes.assign.inspector',
                'expedientes.response.submit',
                'expedientes.inspection.submit',
                'expedientes.inspection.files',
                'solicitantes.view',
            ],
            'inspector' => [
                'expedientes.view',
                'expedientes.qr.download',
                'expedientes.files.view',
                'expedientes.inspection.submit',
                'expedientes.inspection.files',
                'solicitantes.view',
            ],
            'directora' => [
                'expedientes.view',
                'expedientes.create',
                'expedientes.update',
                'expedientes.export',
                'expedientes.receive',
                'expedientes.qr.download',
                'expedientes.files.view',
                'expedientes.files.upload',
                'expedientes.files.replace',
                'expedientes.files.delete',
                'expedientes.assign.reviewer',
                'expedientes.assign.inspector',
                'expedientes.response.submit',
                'expedientes.decision.issue',
                'expedientes.decision.files',
                'expedientes.phase.return',
                'solicitantes.view',
                'solicitantes.create',
                'solicitantes.update',
                'solicitantes.export',
            ],
        ];

        foreach ($roles as $roleName => $permNames) {
            $role = Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => $guard]
            );

            $perms = Permission::query()
                ->where('guard_name', $guard)
                ->whereIn('name', $permNames)
                ->get();

            $role->syncPermissions($perms);
        }

        // ── Users ──
        $users = [
            ['email' => 'salfonzo@chacao.gob.ve',  'name' => 'Soraya Alfonzo',      'role' => 'directora'],
            ['email' => 'fcarrillo@chacao.gob.ve', 'name' => 'Francisco Carrillo',  'role' => 'revisor'],
            ['email' => 'msoto@chacao.gob.ve',     'name' => 'Mirian Soto',         'role' => 'recepcionista'],
            ['email' => 'dmania@chacao.gob.ve',    'name' => 'Daniela Mania',       'role' => 'revisor'],
            ['email' => 'aquintero@chacao.gob.ve', 'name' => 'Andreina Quintero',   'role' => 'revisor'],
        ];

        foreach ($users as $u) {
            $user = User::query()->firstOrCreate(
                ['email' => $u['email']],
                ['name' => $u['name'], 'password' => Hash::make('12345678')]
            );
            $user->syncRoles([$u['role']]);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->command->info('Created 6 users: admin, directora, 3 revisores, recepcionista');
    }
}

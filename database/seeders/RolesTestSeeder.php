<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class RolesTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * No longer creates random test roles/users — real roles are
     * created in PermissionsSeeder + UsersSeeder.
     */
    public function run(): void
    {
        $this->command->info('RolesTestSeeder: skipped (roles managed by PermissionsSeeder + UsersSeeder)');
    }
}

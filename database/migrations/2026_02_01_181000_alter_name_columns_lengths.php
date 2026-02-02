<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE procedure_types ALTER COLUMN name TYPE VARCHAR(255)');
        DB::statement('ALTER TABLE requirements ALTER COLUMN name TYPE VARCHAR(255)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE procedure_types ALTER COLUMN name TYPE VARCHAR(120)');
        DB::statement('ALTER TABLE requirements ALTER COLUMN name TYPE VARCHAR(160)');
    }
};

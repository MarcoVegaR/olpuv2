<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('expedientes')
            ->whereIn('status', ['pending_final_doc', 'pending_final_document'])
            ->update(['status' => 'pending_decision']);
    }

    public function down(): void
    {
        // Irreversible: we intentionally normalize legacy statuses into pending_decision.
    }
};

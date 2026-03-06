<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expediente_decision_files', function (Blueprint $table) {
            $table->string('kind', 30)->default('decision_document')->after('expediente_id');
            $table->index(['expediente_id', 'kind']);
        });
    }

    public function down(): void
    {
        Schema::table('expediente_decision_files', function (Blueprint $table) {
            $table->dropIndex(['expediente_id', 'kind']);
            $table->dropColumn('kind');
        });
    }
};

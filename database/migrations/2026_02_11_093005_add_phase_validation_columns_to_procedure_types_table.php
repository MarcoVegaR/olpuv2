<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('procedure_types', function (Blueprint $table) {
            $table->boolean('reception_requires_all_recaudos')->default(true)->after('workflow_requires_decision');
            $table->boolean('reception_requires_file_uploads')->default(false)->after('reception_requires_all_recaudos');
            $table->boolean('inspection_requires_photos')->default(false)->after('reception_requires_file_uploads');
            $table->boolean('inspection_requires_report')->default(false)->after('inspection_requires_photos');
            $table->boolean('decision_requires_document')->default(false)->after('inspection_requires_report');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('procedure_types', function (Blueprint $table) {
            $table->dropColumn([
                'reception_requires_all_recaudos',
                'reception_requires_file_uploads',
                'inspection_requires_photos',
                'inspection_requires_report',
                'decision_requires_document',
            ]);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('procedure_types', function (Blueprint $table) {
            $table->boolean('workflow_requires_review_assignment')->default(false);
            $table->boolean('workflow_requires_inspector_assignment')->default(false);
            $table->boolean('workflow_requires_inspection')->default(false);
            $table->boolean('workflow_requires_technical_response')->default(false);
            $table->boolean('workflow_requires_decision')->default(false);

            $table->string('inspection_mode', 20)->default('none');

            $table->boolean('has_validity')->default(false);
            $table->integer('validity_years')->nullable();
            $table->integer('validity_months')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('procedure_types', function (Blueprint $table) {
            $table->dropColumn([
                'workflow_requires_review_assignment',
                'workflow_requires_inspector_assignment',
                'workflow_requires_inspection',
                'workflow_requires_technical_response',
                'workflow_requires_decision',
                'inspection_mode',
                'has_validity',
                'validity_years',
                'validity_months',
            ]);
        });
    }
};

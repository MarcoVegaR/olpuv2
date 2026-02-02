<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('procedure_type_requirements', function (Blueprint $table) {
            $table->id();

            $table->foreignId('procedure_type_id')->constrained('procedure_types')->cascadeOnDelete();
            $table->foreignId('requirement_id')->constrained('requirements')->cascadeOnDelete();

            $table->integer('sort_order')->default(0);
            $table->boolean('is_required')->default(true);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['procedure_type_id', 'requirement_id']);
            $table->index(['procedure_type_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('procedure_type_requirements');
    }
};

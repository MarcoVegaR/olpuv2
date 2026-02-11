<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expediente_requirements', function (Blueprint $table) {
            $table->id();

            $table->foreignId('expediente_id')->constrained('expedientes')->cascadeOnDelete();
            $table->foreignId('requirement_id')->constrained('requirements')->cascadeOnDelete();

            $table->integer('sort_order')->default(0);
            $table->boolean('is_required')->default(true);
            $table->boolean('is_active')->default(true);

            $table->boolean('physical_received')->default(false);
            $table->timestamp('physical_received_at')->nullable();
            $table->foreignId('physical_received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique(['expediente_id', 'requirement_id']);
            $table->index(['expediente_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expediente_requirements');
    }
};

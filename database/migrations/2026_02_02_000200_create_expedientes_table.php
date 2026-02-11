<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expedientes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('procedure_type_id')->constrained('procedure_types')->cascadeOnDelete();
            $table->foreignId('solicitante_id')->constrained('solicitantes')->cascadeOnDelete();

            $table->string('tracking', 40)->unique();
            $table->string('qr_token', 64)->unique();

            $table->string('numero_receptoria', 50)->nullable();
            $table->string('codigo_catastral', 50)->nullable();
            $table->text('observaciones')->nullable();

            $table->string('status', 20)->default('draft');
            $table->timestamp('received_at')->nullable();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('presentado_por_nombre', 160)->nullable();
            $table->string('presentado_por_documento', 50)->nullable();
            $table->string('presentado_por_telefono', 30)->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['procedure_type_id', 'status']);
            $table->index(['solicitante_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expedientes');
    }
};

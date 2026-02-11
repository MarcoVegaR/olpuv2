<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expediente_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expediente_id')->constrained('expedientes')->cascadeOnDelete();
            $table->foreignId('inspector_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('observations');
            $table->string('result', 20);
            $table->date('inspected_at');
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();

            $table->index(['expediente_id', 'submitted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expediente_inspections');
    }
};

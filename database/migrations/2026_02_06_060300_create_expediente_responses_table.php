<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expediente_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expediente_id')->constrained('expedientes')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('content');
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();

            $table->index(['expediente_id', 'submitted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expediente_responses');
    }
};

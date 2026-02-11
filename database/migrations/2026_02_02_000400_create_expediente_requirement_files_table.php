<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expediente_requirement_files', function (Blueprint $table) {
            $table->id();

            $table->foreignId('expediente_requirement_id')->constrained('expediente_requirements')->cascadeOnDelete();

            $table->string('disk', 50)->default('local');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime', 100);
            $table->unsignedBigInteger('size');
            $table->string('sha256', 64)->nullable();

            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('uploaded_at')->nullable();

            $table->boolean('is_current')->default(true);
            $table->foreignId('replaced_by_id')->nullable()->constrained('expediente_requirement_files')->nullOnDelete();

            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('delete_reason')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['expediente_requirement_id', 'is_current']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expediente_requirement_files');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expediente_inspection_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('expediente_inspections')->cascadeOnDelete();
            $table->string('type', 10); // photo | report
            $table->string('disk', 20)->default('local');
            $table->string('path', 500);
            $table->string('original_name', 255);
            $table->string('mime', 100);
            $table->unsignedInteger('size');
            $table->string('sha256', 64)->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('uploaded_at')->useCurrent();
            $table->softDeletes();

            $table->index('inspection_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expediente_inspection_files');
    }
};

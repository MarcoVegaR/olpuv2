<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expedientes', function (Blueprint $table) {
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewer_assigned_at')->nullable();

            $table->foreignId('inspector_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('inspector_assigned_at')->nullable();

            $table->timestamp('completed_at')->nullable();

            $table->string('decision', 20)->nullable();
            $table->text('decision_notes')->nullable();
            $table->foreignId('decision_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decision_at')->nullable();

            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();

            $table->string('returned_from_status', 20)->nullable();
            $table->text('return_reason')->nullable();

            $table->index('reviewer_id');
            $table->index('inspector_id');
        });
    }

    public function down(): void
    {
        Schema::table('expedientes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reviewer_id');
            $table->dropConstrainedForeignId('inspector_id');
            $table->dropConstrainedForeignId('decision_by');
            $table->dropColumn([
                'reviewer_assigned_at',
                'inspector_assigned_at',
                'completed_at',
                'decision',
                'decision_notes',
                'decision_at',
                'valid_from',
                'valid_until',
                'returned_from_status',
                'return_reason',
            ]);
        });
    }
};

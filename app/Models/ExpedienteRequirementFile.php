<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExpedienteRequirementFile extends Model
{
    use SoftDeletes;

    protected $table = 'expediente_requirement_files';

    /** @var list<string> */
    protected $fillable = [
        'expediente_requirement_id',
        'disk',
        'path',
        'original_name',
        'mime',
        'size',
        'sha256',
        'uploaded_by',
        'uploaded_at',
        'is_current',
        'replaced_by_id',
        'deleted_by',
        'delete_reason',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
            'is_current' => 'boolean',
            'size' => 'integer',
        ];
    }

    /** @return BelongsTo<ExpedienteRequirement, $this> */
    public function expedienteRequirement(): BelongsTo
    {
        return $this->belongsTo(ExpedienteRequirement::class, 'expediente_requirement_id');
    }

    /** @return BelongsTo<User, $this> */
    public function uploadedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /** @return BelongsTo<User, $this> */
    public function deletedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    /** @return BelongsTo<ExpedienteRequirementFile, $this> */
    public function replacedBy(): BelongsTo
    {
        return $this->belongsTo(self::class, 'replaced_by_id');
    }
}

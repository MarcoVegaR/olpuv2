<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExpedienteInspectionFile extends Model
{
    use SoftDeletes;

    public $timestamps = false;

    protected $table = 'expediente_inspection_files';

    /** @var list<string> */
    protected $fillable = [
        'inspection_id',
        'type',
        'disk',
        'path',
        'original_name',
        'mime',
        'size',
        'sha256',
        'uploaded_by',
        'uploaded_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
            'size' => 'integer',
        ];
    }

    /** @return BelongsTo<ExpedienteInspection, $this> */
    public function inspection(): BelongsTo
    {
        return $this->belongsTo(ExpedienteInspection::class, 'inspection_id');
    }

    /** @return BelongsTo<User, $this> */
    public function uploadedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}

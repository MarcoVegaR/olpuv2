<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExpedienteResponseFile extends Model
{
    use SoftDeletes;

    public $timestamps = false;

    protected $table = 'expediente_response_files';

    /** @var list<string> */
    protected $fillable = [
        'response_id',
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

    /** @return BelongsTo<ExpedienteResponse, $this> */
    public function response(): BelongsTo
    {
        return $this->belongsTo(ExpedienteResponse::class, 'response_id');
    }

    /** @return BelongsTo<User, $this> */
    public function uploadedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}

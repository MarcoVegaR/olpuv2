<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpedienteResponse extends Model
{
    protected $table = 'expediente_responses';

    /** @var list<string> */
    protected $fillable = [
        'expediente_id',
        'reviewer_id',
        'content',
        'submitted_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Expediente, $this> */
    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /** @return HasMany<ExpedienteResponseFile, $this> */
    public function files(): HasMany
    {
        return $this->hasMany(ExpedienteResponseFile::class, 'response_id');
    }
}

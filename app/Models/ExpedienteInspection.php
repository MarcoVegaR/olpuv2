<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpedienteInspection extends Model
{
    protected $table = 'expediente_inspections';

    /** @var list<string> */
    protected $fillable = [
        'expediente_id',
        'inspector_id',
        'observations',
        'result',
        'inspected_at',
        'submitted_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'inspected_at' => 'date',
            'submitted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Expediente, $this> */
    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    /** @return BelongsTo<User, $this> */
    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    /** @return HasMany<ExpedienteInspectionFile, $this> */
    public function files(): HasMany
    {
        return $this->hasMany(ExpedienteInspectionFile::class, 'inspection_id');
    }

    /** @return HasMany<ExpedienteInspectionFile, $this> */
    public function photos(): HasMany
    {
        return $this->hasMany(ExpedienteInspectionFile::class, 'inspection_id')->where('type', 'photo');
    }

    /** @return HasMany<ExpedienteInspectionFile, $this> */
    public function reports(): HasMany
    {
        return $this->hasMany(ExpedienteInspectionFile::class, 'inspection_id')->where('type', 'report');
    }
}

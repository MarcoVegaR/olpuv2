<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ExpedienteRequirement extends Model
{
    protected $table = 'expediente_requirements';

    /** @var list<string> */
    protected $fillable = [
        'expediente_id',
        'requirement_id',
        'sort_order',
        'is_required',
        'is_active',
        'physical_received',
        'physical_received_at',
        'physical_received_by',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_required' => 'boolean',
            'is_active' => 'boolean',
            'physical_received' => 'boolean',
            'physical_received_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Expediente, $this> */
    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    /** @return BelongsTo<Requirement, $this> */
    public function requirement(): BelongsTo
    {
        return $this->belongsTo(Requirement::class, 'requirement_id');
    }

    /** @return HasMany<ExpedienteRequirementFile, $this> */
    public function files(): HasMany
    {
        return $this->hasMany(ExpedienteRequirementFile::class, 'expediente_requirement_id')->orderByDesc('id');
    }

    /** @return HasOne<ExpedienteRequirementFile, $this> */
    public function currentFile(): HasOne
    {
        return $this->hasOne(ExpedienteRequirementFile::class, 'expediente_requirement_id')
            ->where('is_current', true)
            ->whereNull('deleted_at');
    }

    /** @return BelongsTo<User, $this> */
    public function physicalReceivedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'physical_received_by');
    }
}

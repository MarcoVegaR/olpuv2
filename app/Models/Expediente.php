<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class Expediente extends Model implements AuditableContract
{
    use AuditableTrait;
    use SoftDeletes;

    protected $table = 'expedientes';

    /** @var list<string> */
    protected $fillable = [
        'procedure_type_id',
        'solicitante_id',
        'tracking',
        'qr_token',
        'numero_receptoria',
        'codigo_catastral',
        'observaciones',
        'status',
        'received_at',
        'received_by',
        'presentado_por_nombre',
        'presentado_por_documento',
        'presentado_por_telefono',
        'is_active',
        'reviewer_id',
        'reviewer_assigned_at',
        'inspector_id',
        'inspector_assigned_at',
        'completed_at',
        'decision',
        'decision_notes',
        'decision_by',
        'decision_at',
        'valid_from',
        'valid_until',
        'returned_from_status',
        'return_reason',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'received_at' => 'datetime',
            'reviewer_assigned_at' => 'datetime',
            'inspector_assigned_at' => 'datetime',
            'completed_at' => 'datetime',
            'decision_at' => 'datetime',
            'valid_from' => 'date',
            'valid_until' => 'date',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<ProcedureType, $this> */
    public function procedureType(): BelongsTo
    {
        return $this->belongsTo(ProcedureType::class, 'procedure_type_id');
    }

    /** @return BelongsTo<Solicitante, $this> */
    public function solicitante(): BelongsTo
    {
        return $this->belongsTo(Solicitante::class, 'solicitante_id');
    }

    /** @return HasMany<ExpedienteRequirement, $this> */
    public function requirements(): HasMany
    {
        return $this->hasMany(ExpedienteRequirement::class, 'expediente_id')->orderBy('sort_order');
    }

    /** @return HasMany<ExpedienteEvent, $this> */
    public function events(): HasMany
    {
        return $this->hasMany(ExpedienteEvent::class, 'expediente_id')->orderByDesc('created_at');
    }

    /** @return BelongsTo<User, $this> */
    public function receivedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /** @return BelongsTo<User, $this> */
    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    /** @return BelongsTo<User, $this> */
    public function decisionUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decision_by');
    }

    /** @return HasMany<ExpedienteInspection, $this> */
    public function inspections(): HasMany
    {
        return $this->hasMany(ExpedienteInspection::class, 'expediente_id')->orderByDesc('submitted_at');
    }

    /** @return HasOne<ExpedienteInspection, $this> */
    public function latestInspection(): HasOne
    {
        return $this->hasOne(ExpedienteInspection::class, 'expediente_id')->latestOfMany('submitted_at');
    }

    /** @return HasMany<ExpedienteResponse, $this> */
    public function responses(): HasMany
    {
        return $this->hasMany(ExpedienteResponse::class, 'expediente_id')->orderByDesc('submitted_at');
    }

    /** @return HasOne<ExpedienteResponse, $this> */
    public function latestResponse(): HasOne
    {
        return $this->hasOne(ExpedienteResponse::class, 'expediente_id')->latestOfMany('submitted_at');
    }

    /** @return HasMany<ExpedienteDecisionFile, $this> */
    public function decisionFiles(): HasMany
    {
        return $this->hasMany(ExpedienteDecisionFile::class, 'expediente_id');
    }
}

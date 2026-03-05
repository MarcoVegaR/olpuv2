<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\SolicitanteFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class Solicitante extends Model implements AuditableContract
{
    use AuditableTrait;

    /** @use HasFactory<SolicitanteFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $table = 'solicitantes';

    /** @var list<string> */
    protected $fillable = [
        'tipo_documento',
        'numero_documento',
        'nombre_razon_social',
        'telefono',
        'email',
        'direccion',
        'is_active',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<Expediente, $this> */
    public function expedientes(): HasMany
    {
        return $this->hasMany(Expediente::class, 'solicitante_id');
    }
}

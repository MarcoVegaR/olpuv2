<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Contracts\Repositories\SolicitanteRepositoryInterface;
use App\Models\Solicitante;
use Illuminate\Database\Eloquent\Builder;

class SolicitanteRepository extends BaseRepository implements SolicitanteRepositoryInterface
{
    protected string $modelClass = Solicitante::class;

    /** @return array<string> */
    protected function searchable(): array
    {
        return [
            'tipo_documento',
            'numero_documento',
            'nombre_razon_social',
            'email',
            'telefono',
        ];
    }

    /** @return array<string> */
    protected function allowedSorts(): array
    {
        return ['id', 'tipo_documento', 'numero_documento', 'nombre_razon_social', 'is_active', 'created_at'];
    }

    protected function activeColumn(): string
    {
        return 'is_active';
    }

    /** @return array<string, callable(Builder<Solicitante>, mixed): void> */
    protected function filterMap(): array
    {
        return [
            'is_active' => function (Builder $b, $v): void {
                $b->where('is_active', (bool) $v);
            },
            'tipo_documento' => function (Builder $b, $v): void {
                $b->where('tipo_documento', strtoupper((string) $v));
            },
            'numero_documento' => function (Builder $b, $v): void {
                $b->whereRaw('LOWER(numero_documento) LIKE ?', ['%'.strtolower((string) $v).'%']);
            },
        ];
    }
}

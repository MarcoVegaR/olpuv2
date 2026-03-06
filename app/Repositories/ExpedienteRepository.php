<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Contracts\Repositories\ExpedienteRepositoryInterface;
use App\Models\Expediente;
use Illuminate\Database\Eloquent\Builder;

class ExpedienteRepository extends BaseRepository implements ExpedienteRepositoryInterface
{
    protected string $modelClass = Expediente::class;

    /** @return array<string> */
    protected function searchable(): array
    {
        return [
            'tracking',
            'numero_receptoria',
            'codigo_catastral',
            'status',
        ];
    }

    /** @return array<string> */
    protected function allowedSorts(): array
    {
        return ['id', 'tracking', 'status', 'created_at', 'received_at'];
    }

    protected function activeColumn(): string
    {
        return 'is_active';
    }

    /** @param Builder<\Illuminate\Database\Eloquent\Model> $builder */
    protected function withRelations(Builder $builder): Builder
    {
        return $builder->with([
            'procedureType:id,code,name',
            'solicitante:id,tipo_documento,numero_documento,nombre_razon_social',
        ]);
    }

    /** @return array<string, callable(Builder<Expediente>, mixed): void> */
    protected function filterMap(): array
    {
        return [
            'status' => function (Builder $b, $v): void {
                $status = (string) $v;
                if ($status === 'pending_decision') {
                    $b->whereIn('status', ['pending_decision', 'pending_final_doc', 'pending_final_document']);

                    return;
                }

                $b->where('status', $status);
            },
            'procedure_type_id' => function (Builder $b, $v): void {
                $b->where('procedure_type_id', (int) $v);
            },
            'tracking' => function (Builder $b, $v): void {
                $b->whereRaw('LOWER(tracking) LIKE ?', ['%'.strtolower((string) $v).'%']);
            },
            'numero_receptoria' => function (Builder $b, $v): void {
                $b->whereRaw('LOWER(numero_receptoria) LIKE ?', ['%'.strtolower((string) $v).'%']);
            },
            'codigo_catastral' => function (Builder $b, $v): void {
                $b->whereRaw('LOWER(codigo_catastral) LIKE ?', ['%'.strtolower((string) $v).'%']);
            },
            'solicitante_tipo_documento' => function (Builder $b, $v): void {
                $b->whereHas('solicitante', function (Builder $q) use ($v): void {
                    $q->where('tipo_documento', strtoupper((string) $v));
                });
            },
            'solicitante_numero_documento_like' => function (Builder $b, $v): void {
                $b->whereHas('solicitante', function (Builder $q) use ($v): void {
                    $q->whereRaw('LOWER(numero_documento) LIKE ?', ['%'.strtolower((string) $v).'%']);
                });
            },
            'reviewer_id' => function (Builder $b, $v): void {
                $b->where('reviewer_id', (int) $v);
            },
            'inspector_id' => function (Builder $b, $v): void {
                $b->where('inspector_id', (int) $v);
            },
            'assigned_to_user' => function (Builder $b, $v): void {
                $uid = (int) $v;
                $b->where(function (Builder $q) use ($uid): void {
                    $q->where('reviewer_id', $uid)->orWhere('inspector_id', $uid);
                });
            },
        ];
    }
}

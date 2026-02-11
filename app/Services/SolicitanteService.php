<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Services\SolicitanteServiceInterface;
use App\DTO\ListQuery;
use App\Models\Solicitante;
use Illuminate\Database\Eloquent\Model;

class SolicitanteService extends BaseService implements SolicitanteServiceInterface
{
    /** @return array<string, mixed> */
    protected function toRow(Model $model): array
    {
        /** @var Solicitante $m */
        $m = $model;

        return [
            'id' => $m->getAttribute('id'),
            'tipo_documento' => (string) $m->getAttribute('tipo_documento'),
            'numero_documento' => (string) $m->getAttribute('numero_documento'),
            'nombre_razon_social' => (string) $m->getAttribute('nombre_razon_social'),
            'telefono' => $m->getAttribute('telefono'),
            'email' => $m->getAttribute('email'),
            'direccion' => $m->getAttribute('direccion'),
            'is_active' => (bool) ($m->getAttribute('is_active') ?? true),
            'created_at' => $m->getAttribute('created_at'),
        ];
    }

    /** @return array<string, mixed> */
    public function toItem(Model $model): array
    {
        /** @var Solicitante $m */
        $m = $model;

        $createdAt = $m->getAttribute('created_at');
        $updatedAt = $m->getAttribute('updated_at');

        return [
            'id' => $m->getAttribute('id'),
            'tipo_documento' => (string) $m->getAttribute('tipo_documento'),
            'numero_documento' => (string) $m->getAttribute('numero_documento'),
            'nombre_razon_social' => (string) $m->getAttribute('nombre_razon_social'),
            'telefono' => $m->getAttribute('telefono'),
            'email' => $m->getAttribute('email'),
            'direccion' => $m->getAttribute('direccion'),
            'is_active' => (bool) ($m->getAttribute('is_active') ?? true),
            'created_at' => method_exists($createdAt, 'toISOString') ? $createdAt->toISOString() : (string) $createdAt,
            'updated_at' => method_exists($updatedAt, 'toISOString') ? $updatedAt->toISOString() : (string) $updatedAt,
        ];
    }

    /** @return array<string, string> */
    protected function defaultExportColumns(): array
    {
        return [
            'id' => '#',
            'tipo_documento' => 'Tipo Doc',
            'numero_documento' => 'N° Doc',
            'nombre_razon_social' => 'Nombre / Razón social',
            'telefono' => 'Teléfono',
            'email' => 'Email',
            'is_active' => 'Estado',
            'created_at' => 'Creado',
        ];
    }

    protected function defaultExportFilename(string $format, ListQuery $query): string
    {
        return 'solicitantes_export_'.date('Ymd_His').'.'.$format;
    }

    protected function repoModelClass(): string
    {
        return Solicitante::class;
    }
}

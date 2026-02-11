<?php

declare(strict_types=1);

namespace App\Http\Requests;

class SolicitanteIndexRequest extends BaseIndexRequest
{
    /** @return array<string> */
    protected function allowedSorts(): array
    {
        return ['id', 'tipo_documento', 'numero_documento', 'nombre_razon_social', 'is_active', 'created_at'];
    }

    /** @return array<string, mixed> */
    protected function filterRules(): array
    {
        return [
            'filters.tipo_documento' => ['nullable', 'string', 'max:2'],
            'filters.numero_documento' => ['nullable', 'string', 'max:30'],
            'filters.is_active' => ['nullable', 'boolean'],
        ];
    }

    protected function defaultPerPage(): int
    {
        return 10;
    }
}

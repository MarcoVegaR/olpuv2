<?php

declare(strict_types=1);

namespace App\Http\Requests;

class ExpedienteIndexRequest extends BaseIndexRequest
{
    /** @return array<string> */
    protected function allowedSorts(): array
    {
        return ['id', 'tracking', 'status', 'created_at', 'received_at'];
    }

    /** @return array<string, mixed> */
    protected function filterRules(): array
    {
        return [
            'filters.status' => ['nullable', 'string', 'max:20'],
            'filters.procedure_type_id' => ['nullable', 'integer'],
            'filters.tracking' => ['nullable', 'string', 'max:40'],
            'filters.numero_receptoria' => ['nullable', 'string', 'max:50'],
            'filters.codigo_catastral' => ['nullable', 'string', 'max:50'],
            'filters.solicitante_tipo_documento' => ['nullable', 'string', 'max:2'],
            'filters.solicitante_numero_documento_like' => ['nullable', 'string', 'max:30'],
            'filters.reviewer_id' => ['nullable', 'integer'],
            'filters.inspector_id' => ['nullable', 'integer'],
            'filters.assigned_to_user' => ['nullable', 'integer'],
        ];
    }

    protected function defaultPerPage(): int
    {
        return 10;
    }
}

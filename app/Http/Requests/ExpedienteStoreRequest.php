<?php

declare(strict_types=1);

namespace App\Http\Requests;

class ExpedienteStoreRequest extends BaseStoreRequest
{
    public function authorize(): bool
    {
        return (bool) ($this->user()?->can('create', \App\Models\Expediente::class));
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'procedure_type_id' => ['bail', 'required', 'integer', 'exists:procedure_types,id'],
            'numero_receptoria' => ['bail', 'nullable', 'string', 'max:50'],
            'codigo_catastral' => ['bail', 'nullable', 'string', 'max:50'],
            'observaciones' => ['bail', 'nullable', 'string'],
            'confirm' => ['bail', 'nullable', 'boolean'],

            'solicitante_id' => ['bail', 'required', 'integer', 'exists:solicitantes,id'],

            'presentado_por' => ['bail', 'nullable', 'array'],
            'presentado_por.nombre' => ['bail', 'nullable', 'string', 'max:160'],
            'presentado_por.documento' => ['bail', 'nullable', 'string', 'max:50'],
            'presentado_por.telefono' => ['bail', 'nullable', 'string', 'max:30'],

            'physical_received_requirement_ids' => ['bail', 'nullable', 'array'],
            'physical_received_requirement_ids.*' => ['bail', 'integer', 'exists:requirements,id'],
        ];
    }

    /**
     * @param  array<string, mixed>  &$data
     */
    protected function additionalPreparation(array &$data): void
    {
        if (isset($data['confirm'])) {
            $data['confirm'] = (bool) $data['confirm'];
        }

        if (isset($data['physical_received_requirement_ids']) && is_array($data['physical_received_requirement_ids'])) {
            $data['physical_received_requirement_ids'] = array_values(array_filter(array_map('intval', $data['physical_received_requirement_ids']), static fn ($v) => $v > 0));
        }
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Solicitante;
use Illuminate\Validation\Rule;

class SolicitanteUpdateRequest extends BaseUpdateRequest
{
    public function authorize(): bool
    {
        // La autorización de update se realiza en middleware de ruta
        // (permission:solicitantes.update) y en el controlador mediante Policy.
        // Evitamos depender de route model binding aquí para no generar 403 falsos.
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Solicitante|int|string|null $solicitante */
        $solicitante = $this->route('solicitante');
        $id = $solicitante instanceof Solicitante
            ? $solicitante->getKey()
            : (is_scalar($solicitante) && is_numeric((string) $solicitante) ? (int) $solicitante : null);
        $tipo = strtoupper((string) $this->input('tipo_documento'));

        return [
            'tipo_documento' => ['bail', 'required', 'string', 'max:2', Rule::in(['V', 'E', 'P', 'J', 'G'])],
            'numero_documento' => [
                'bail',
                'required',
                'string',
                'max:30',
                Rule::unique('solicitantes', 'numero_documento')
                    ->ignore($id)
                    ->where(function ($q) use ($tipo) {
                        return $q->where('tipo_documento', $tipo)->whereNull('deleted_at');
                    }),
            ],
            'nombre_razon_social' => ['bail', 'required', 'string', 'max:160'],
            'telefono' => ['bail', 'nullable', 'string', 'max:30'],
            'email' => ['bail', 'nullable', 'email'],
            'direccion' => ['bail', 'nullable', 'string'],
            'is_active' => ['bail', 'required', 'boolean'],
        ];
    }

    /**
     * @param  array<string, mixed>  &$data
     */
    protected function additionalPreparation(array &$data): void
    {
        if (isset($data['tipo_documento']) && is_string($data['tipo_documento'])) {
            $data['tipo_documento'] = strtoupper(trim($data['tipo_documento']));
        }
        if (isset($data['numero_documento']) && is_string($data['numero_documento'])) {
            $data['numero_documento'] = trim($data['numero_documento']);
        }
        if (isset($data['nombre_razon_social']) && is_string($data['nombre_razon_social'])) {
            $data['nombre_razon_social'] = trim($data['nombre_razon_social']);
        }
        if (array_key_exists('is_active', $data)) {
            $data['is_active'] = (bool) $data['is_active'];
        }
    }
}

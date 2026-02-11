<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Solicitante;

class SetSolicitanteActiveRequest extends BaseStoreRequest
{
    public function authorize(): bool
    {
        $solicitante = $this->route('solicitante');

        return $solicitante instanceof Solicitante
            ? $this->user()?->can('setActive', $solicitante) === true
            : false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'active' => ['required', 'boolean'],
        ];
    }
}

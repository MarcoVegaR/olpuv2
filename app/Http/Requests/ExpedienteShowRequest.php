<?php

declare(strict_types=1);

namespace App\Http\Requests;

class ExpedienteShowRequest extends BaseShowRequest
{
    /** @return array<string> */
    protected function allowedRelations(): array
    {
        return [
            'procedureType',
            'solicitante',
            'requirements',
            'requirements.requirement',
            'requirements.currentFile',
            'requirements.files',
        ];
    }

    /** @return array<string> */
    protected function allowedCounts(): array
    {
        return [];
    }

    /** @return array<string> */
    protected function allowedAppends(): array
    {
        return [];
    }
}

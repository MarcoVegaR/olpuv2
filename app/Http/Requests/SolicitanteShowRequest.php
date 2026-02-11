<?php

declare(strict_types=1);

namespace App\Http\Requests;

class SolicitanteShowRequest extends BaseShowRequest
{
    /** @return array<string> */
    protected function allowedRelations(): array
    {
        return ['expedientes'];
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

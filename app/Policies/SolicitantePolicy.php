<?php

declare(strict_types=1);

namespace App\Policies;

class SolicitantePolicy extends BaseResourcePolicy
{
    protected function abilityPrefix(): string
    {
        return 'solicitantes';
    }
}

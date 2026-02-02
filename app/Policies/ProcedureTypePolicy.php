<?php

declare(strict_types=1);

namespace App\Policies;

class ProcedureTypePolicy extends BaseResourcePolicy
{
    protected function abilityPrefix(): string
    {
        return 'catalogs.procedure-type';
    }
}

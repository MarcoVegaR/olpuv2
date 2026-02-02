<?php

declare(strict_types=1);

namespace App\Policies;

class RequirementPolicy extends BaseResourcePolicy
{
    protected function abilityPrefix(): string
    {
        return 'catalogs.requirement';
    }
}

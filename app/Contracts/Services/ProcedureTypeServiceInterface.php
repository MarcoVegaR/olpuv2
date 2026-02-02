<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Models\ProcedureType;

interface ProcedureTypeServiceInterface extends ServiceInterface
{
    /**
     * Extra data for index view (e.g., stats).
     *
     * @return array<string, mixed>
     */
    public function getIndexExtras(): array;

    /**
     * @param  array<int, array<string, mixed>>  $requirements
     */
    public function syncRequirements(ProcedureType $procedureType, array $requirements): void;
}

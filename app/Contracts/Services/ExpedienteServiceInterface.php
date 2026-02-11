<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Models\Expediente;
use App\Models\ExpedienteRequirement;
use App\Models\ExpedienteRequirementFile;
use App\Models\User;
use Illuminate\Http\UploadedFile;

interface ExpedienteServiceInterface extends ServiceInterface
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function createReception(array $payload, User $actor, bool $confirm): Expediente;

    public function setPhysicalReceived(ExpedienteRequirement $expedienteRequirement, bool $received, User $actor): ExpedienteRequirement;

    public function uploadRequirementFile(ExpedienteRequirement $expedienteRequirement, UploadedFile $file, User $actor): ExpedienteRequirementFile;

    public function deleteRequirementFile(ExpedienteRequirementFile $file, User $actor, ?string $reason = null): void;
}

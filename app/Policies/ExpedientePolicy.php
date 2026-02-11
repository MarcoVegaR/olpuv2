<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Expediente;
use App\Models\User;

class ExpedientePolicy extends BaseResourcePolicy
{
    protected function abilityPrefix(): string
    {
        return 'expedientes';
    }

    /**
     * Scoped view: reviewers only see their assigned, inspectors only see theirs.
     * Recepcionista, directora and admin see all.
     */
    public function view(User $user, $model): bool
    {
        if (! $this->can($user, 'view')) {
            return false;
        }

        // Users who can assign reviewers (directora/admin) or create (recepcionista) see all
        if ($user->can('expedientes.assign.reviewer') || $user->can('expedientes.create')) {
            return true;
        }

        /** @var Expediente $model */
        $userId = $user->getKey();

        // Reviewer scope
        if ($user->can('expedientes.response.submit') && (int) $model->getAttribute('reviewer_id') === (int) $userId) {
            return true;
        }

        // Inspector scope
        if ($user->can('expedientes.inspection.submit') && (int) $model->getAttribute('inspector_id') === (int) $userId) {
            return true;
        }

        return false;
    }

    public function receive(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'receive');
    }

    public function qrDownload(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'qr.download');
    }

    public function filesView(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'files.view');
    }

    public function filesUpload(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'files.upload');
    }

    public function filesReplace(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'files.replace');
    }

    public function filesDelete(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'files.delete');
    }

    public function overrideLocked(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'overrideLocked');
    }

    public function assignReviewer(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'assign.reviewer');
    }

    public function assignInspector(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'assign.inspector');
    }

    public function submitInspection(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'inspection.submit');
    }

    public function uploadInspectionFiles(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'inspection.files');
    }

    public function submitResponse(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'response.submit');
    }

    public function issueDecision(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'decision.issue');
    }

    public function uploadDecisionFiles(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'decision.files');
    }

    public function returnToPhase(User $user, Expediente $expediente): bool
    {
        return $this->can($user, 'phase.return');
    }
}

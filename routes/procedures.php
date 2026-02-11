<?php

declare(strict_types=1);

use App\Http\Controllers\ExpedienteController;
use App\Http\Controllers\SolicitanteController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('procedures')->group(function () {
    // Solicitantes
    Route::get('/solicitantes', [SolicitanteController::class, 'index'])
        ->middleware('permission:solicitantes.view')
        ->name('solicitantes.index');

    Route::get('/solicitantes/search', [SolicitanteController::class, 'search'])
        ->middleware('permission:solicitantes.view')
        ->name('solicitantes.search');

    Route::get('/solicitantes/create', [SolicitanteController::class, 'create'])
        ->middleware('permission:solicitantes.create')
        ->name('solicitantes.create');

    Route::post('/solicitantes', [SolicitanteController::class, 'store'])
        ->middleware('permission:solicitantes.create')
        ->name('solicitantes.store');

    Route::get('/solicitantes/export', [SolicitanteController::class, 'export'])
        ->middleware('permission:solicitantes.export')
        ->name('solicitantes.export');

    Route::post('/solicitantes/bulk', [SolicitanteController::class, 'bulk'])
        ->middleware('permission:solicitantes.delete|solicitantes.restore|solicitantes.forceDelete|solicitantes.setActive')
        ->name('solicitantes.bulk');

    Route::get('/solicitantes/selected', [SolicitanteController::class, 'selected'])
        ->middleware('permission:solicitantes.view')
        ->name('solicitantes.selected');

    Route::get('/solicitantes/{solicitante}', [SolicitanteController::class, 'show'])
        ->middleware('permission:solicitantes.view')
        ->name('solicitantes.show');

    Route::get('/solicitantes/{solicitante}/edit', [SolicitanteController::class, 'edit'])
        ->middleware('permission:solicitantes.update')
        ->name('solicitantes.edit');

    Route::put('/solicitantes/{solicitante}', [SolicitanteController::class, 'update'])
        ->middleware('permission:solicitantes.update')
        ->name('solicitantes.update');

    Route::patch('/solicitantes/{solicitante}/active', [SolicitanteController::class, 'setActive'])
        ->middleware('permission:solicitantes.setActive')
        ->name('solicitantes.setActive');

    Route::delete('/solicitantes/{solicitante}', [SolicitanteController::class, 'destroy'])
        ->middleware('permission:solicitantes.delete')
        ->name('solicitantes.destroy');

    // Expedientes
    Route::get('/expedientes', [ExpedienteController::class, 'index'])
        ->middleware('permission:expedientes.view')
        ->name('expedientes.index');

    Route::get('/expedientes/create', [ExpedienteController::class, 'create'])
        ->middleware('permission:expedientes.create')
        ->name('expedientes.create');

    Route::post('/expedientes', [ExpedienteController::class, 'store'])
        ->middleware('permission:expedientes.create')
        ->name('expedientes.store');

    Route::get('/expedientes/export', [ExpedienteController::class, 'export'])
        ->middleware('permission:expedientes.export')
        ->name('expedientes.export');

    Route::post('/expedientes/bulk', [ExpedienteController::class, 'bulk'])
        ->middleware('permission:expedientes.delete|expedientes.restore|expedientes.forceDelete|expedientes.setActive')
        ->name('expedientes.bulk');

    Route::get('/expedientes/selected', [ExpedienteController::class, 'selected'])
        ->middleware('permission:expedientes.view')
        ->name('expedientes.selected');

    Route::get('/expedientes/{expediente}', [ExpedienteController::class, 'show'])
        ->middleware('permission:expedientes.view')
        ->name('expedientes.show');

    Route::get('/expedientes/{expediente}/planilla', [ExpedienteController::class, 'planilla'])
        ->middleware('permission:expedientes.view')
        ->name('expedientes.planilla');

    Route::get('/expedientes/{expediente}/qr', [ExpedienteController::class, 'downloadQr'])
        ->middleware('permission:expedientes.qr.download')
        ->name('expedientes.qr.download');

    Route::patch('/expedientes/{expediente}/active', [ExpedienteController::class, 'setActive'])
        ->middleware('permission:expedientes.setActive')
        ->name('expedientes.setActive');

    Route::patch('/expedientes/{expediente}/requirements/{expediente_requirement}/physical', [ExpedienteController::class, 'setPhysicalReceived'])
        ->middleware('permission:expedientes.receive')
        ->name('expedientes.requirements.physical');

    Route::post('/expedientes/{expediente}/requirements/{expediente_requirement}/file', [ExpedienteController::class, 'uploadRequirementFile'])
        ->middleware('permission:expedientes.files.upload|expedientes.files.replace')
        ->name('expedientes.requirements.file.upload');

    Route::get('/expedientes/{expediente}/files/{expediente_requirement_file}', [ExpedienteController::class, 'downloadRequirementFile'])
        ->middleware('permission:expedientes.files.view')
        ->name('expedientes.files.download');

    Route::delete('/expedientes/{expediente}/files/{expediente_requirement_file}', [ExpedienteController::class, 'deleteRequirementFile'])
        ->middleware('permission:expedientes.files.delete')
        ->name('expedientes.files.delete');

    // Workflow actions
    Route::patch('/expedientes/{expediente}/assign-reviewer', [ExpedienteController::class, 'assignReviewer'])
        ->middleware('permission:expedientes.assign.reviewer')
        ->name('expedientes.assignReviewer');

    Route::patch('/expedientes/{expediente}/assign-inspector', [ExpedienteController::class, 'assignInspector'])
        ->middleware('permission:expedientes.assign.inspector')
        ->name('expedientes.assignInspector');

    Route::patch('/expedientes/{expediente}/start-inspection', [ExpedienteController::class, 'startInspection'])
        ->middleware('permission:expedientes.inspection.submit')
        ->name('expedientes.startInspection');

    Route::post('/expedientes/{expediente}/inspection', [ExpedienteController::class, 'submitInspection'])
        ->middleware('permission:expedientes.inspection.submit')
        ->name('expedientes.submitInspection');

    Route::post('/expedientes/{expediente}/response', [ExpedienteController::class, 'submitResponse'])
        ->middleware('permission:expedientes.response.submit')
        ->name('expedientes.submitResponse');

    Route::patch('/expedientes/{expediente}/decision', [ExpedienteController::class, 'issueDecision'])
        ->middleware('permission:expedientes.decision.issue')
        ->name('expedientes.issueDecision');

    Route::patch('/expedientes/{expediente}/return', [ExpedienteController::class, 'returnToPhase'])
        ->middleware('permission:expedientes.phase.return')
        ->name('expedientes.returnToPhase');
});

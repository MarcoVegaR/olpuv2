<?php

declare(strict_types=1);

use App\Http\Controllers\PublicExpedienteVerificationController;
use App\Http\Controllers\PublicRequirementsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/public/requirements', [PublicRequirementsController::class, 'index'])->name('public.requirements.index');
Route::get('/public/requirements/{code}', [PublicRequirementsController::class, 'show'])->name('public.requirements.show');

Route::get('/public/tracking', function () {
    return Inertia::render('public/tracking');
})->name('public.tracking');
Route::get('/public/tracking/{tracking}', [PublicExpedienteVerificationController::class, 'tracking'])->name('public.verify.tracking');

Route::get('/public/verify/{token}', [PublicExpedienteVerificationController::class, 'show'])->name('public.verify.qr');

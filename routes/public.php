<?php

declare(strict_types=1);

use App\Http\Controllers\PublicRequirementsController;
use Illuminate\Support\Facades\Route;

Route::get('/public/requirements', [PublicRequirementsController::class, 'index'])->name('public.requirements.index');
Route::get('/public/requirements/{code}', [PublicRequirementsController::class, 'show'])->name('public.requirements.show');

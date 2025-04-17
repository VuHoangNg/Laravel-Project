<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\src\Controllers\MediaController;

Route::prefix('media')->group(function () {
    Route::get('/', [MediaController::class, 'index'])->name('media.index');
    Route::post('/', [MediaController::class, 'store'])->name('media.store'); // Removed middleware
    Route::get('/{id}', [MediaController::class, 'show'])->name('media.show');
    Route::put('/{id}', [MediaController::class, 'update'])->name('media.update'); // Removed middleware
    Route::delete('/{id}', [MediaController::class, 'destroy'])->name('media.destroy'); // Removed middleware
});
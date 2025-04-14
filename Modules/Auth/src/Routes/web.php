<?php
use Modules\Auth\src\Controllers\AuthController;

Route::prefix('auth')->group(function() {
    Route::get('{any?}', [AuthController::class, 'index'])->where('any', '.*');
});
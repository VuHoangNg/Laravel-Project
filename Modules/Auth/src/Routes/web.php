<?php
use Modules\Auth\src\Controllers\AuthController;

Route::prefix('auth')->group(function() {
    Route::get('/', [AuthController::class, 'index']);
});

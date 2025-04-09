<?php
use Modules\Auth\Http\Controllers\AuthController;

Route::prefix('auth')->group(function() {
    Route::get('/', [AuthController::class, 'index']);
});

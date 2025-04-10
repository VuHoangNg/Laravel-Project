<?php

use Modules\Auth\src\Controllers\AuthController;


Route::middleware('auth:sanctum')->get('/auth', function (Request $request) {
    return $request->user();
});

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

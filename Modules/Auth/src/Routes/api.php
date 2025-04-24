<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Modules\Auth\src\Controllers\AuthController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
// Auth Routes
Route::middleware('auth:sanctum')->get('/auth', function (Request $request) {
    return $request->user();
});

Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
Route::post('/register', [AuthController::class, 'register']);
Route::middleware('auth:sanctum')->get('/user', [AuthController::class, 'getUser']);
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/auth/update-avatar', [AuthController::class, 'updateAvatar']);
});
// Email Verification
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware('signed')
    ->name('verification.verify');

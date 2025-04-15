<?php

use Modules\Auth\src\Controllers\AuthController;
use Modules\Blog\src\Controllers\BlogController;

Route::middleware('auth:sanctum')->get('/auth', function (Request $request) {
    return $request->user();
});

Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
Route::post('/register', [AuthController::class, 'register']);
Route::middleware('auth:sanctum')->get('/user', [AuthController::class, 'getUser']);


Route::get('/blogs', [BlogController::class, 'index']); // Get all blogs
Route::get('/blogs/{id}', [BlogController::class, 'show']); // Get a specific blog
Route::post('/blogs', [BlogController::class, 'store']); // Create a new blog
Route::put('/blogs/{id}', [BlogController::class, 'update']); // Update a blog
Route::delete('/blogs/{id}', [BlogController::class, 'destroy']); // Delete a blog
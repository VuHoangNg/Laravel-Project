<?php

use Illuminate\Support\Facades\Route;
use Modules\Blog\src\Controllers\BlogController;

Route::prefix('blogs')->group(function () {
    Route::get('/', [BlogController::class, 'index'])->name('blogs.index');
    Route::post('/', [BlogController::class, 'store'])->middleware('auth:sanctum')->name('blogs.store');
    Route::get('/{id}', [BlogController::class, 'show'])->name('blogs.show');
    Route::put('/{id}', [BlogController::class, 'update'])->middleware('auth:sanctum')->name('blogs.update');
    Route::delete('/{id}', [BlogController::class, 'destroy'])->middleware('auth:sanctum')->name('blogs.destroy');
});
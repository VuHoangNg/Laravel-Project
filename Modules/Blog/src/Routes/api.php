<?php

use Illuminate\Support\Facades\Route;
use Modules\Blog\src\Controllers\BlogController;

Route::prefix('api/blogs')->group(function () {
    Route::get('/', [BlogController::class, 'index'])->name('blogs.index');
    Route::post('/', [BlogController::class, 'store'])->name('blogs.store');
    Route::get('/{id}', [BlogController::class, 'show'])->name('blogs.show');
    Route::put('/{id}', [BlogController::class, 'update'])->name('blogs.update');
    Route::delete('/{id}', [BlogController::class, 'destroy'])->name('blogs.destroy');
});
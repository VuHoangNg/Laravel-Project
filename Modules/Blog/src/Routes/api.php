<?php

use Illuminate\Support\Facades\Route;
use Modules\Blog\src\Controllers\BlogController;

Route::prefix('api/blogs')->group(function () {
    Route::get('/', [BlogController::class, 'get_all_blogs'])->name('blogs.index');
    Route::post('/', [BlogController::class, 'store_blog'])->name('blogs.store');
    Route::get('/{id}', [BlogController::class, 'get_blog_by_id'])->name('blogs.show');
    Route::put('/{id}', [BlogController::class, 'update_blog'])->name('blogs.update');
    Route::delete('/{id}', [BlogController::class, 'destroy_blog'])->name('blogs.destroy');
});
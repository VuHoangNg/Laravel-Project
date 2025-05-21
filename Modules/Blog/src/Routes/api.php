<?php

use Illuminate\Support\Facades\Route;
use Modules\Blog\src\Controllers\BlogController;
use Modules\Blog\src\Controllers\ReportController;

Route::prefix('api/blogs')->group(function () {
    Route::get('/', [BlogController::class, 'get_all_blogs'])->name('blogs.index');
    Route::post('/', [BlogController::class, 'store_blog'])->name('blogs.store');
    Route::get('/{id}', [BlogController::class, 'get_blog_by_id'])->name('blogs.show');
    Route::put('/{id}', [BlogController::class, 'update_blog'])->name('blogs.update');
    Route::delete('/{id}', [BlogController::class, 'destroy_blog'])->name('blogs.destroy');
});

Route::prefix('api/blogs/reports')->group(function () {
    Route::get('/{blogId}', [ReportController::class, 'index']);
    Route::post('/{blogId}/import', [ReportController::class, 'import']);
    Route::get('/{blogId}/export', [ReportController::class, 'export']);
});
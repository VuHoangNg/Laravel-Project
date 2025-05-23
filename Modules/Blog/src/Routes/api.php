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
    Route::get('/{blogId}/statistics', [ReportController::class, 'getStatistics'])->name('blogs.reports.statistics');
    Route::get('/{blogId}/likes', [ReportController::class, 'getLikesChart'])->name('blogs.reports.likes');
    Route::get('/{blogId}/views', [ReportController::class, 'getViewsChart'])->name('blogs.reports.views');
    Route::post('/{blogId}/import', [ReportController::class, 'import'])->name('blogs.reports.import');
    Route::get('/{blogId}/export', [ReportController::class, 'export'])->name('blogs.reports.export');
});
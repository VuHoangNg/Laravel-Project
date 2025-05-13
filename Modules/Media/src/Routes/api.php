<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\src\Controllers\MediaController;
use Modules\Media\src\Controllers\CommentController;

Route::prefix('media')->group(function () {
    //Comment
    Route::post('comments', [CommentController::class, 'store_comment']);
    Route::get('{mediaId}/comments', [CommentController::class, 'get_comments']);
    Route::put('comments/{id}', [CommentController::class, 'update_comment']);
    Route::delete('comments/{id}', [CommentController::class, 'destroy_comment']);
    Route::get('comments/{id}', [CommentController::class, 'get_comment_by_id']);

    Route::get('/', [MediaController::class, 'get_all_media'])->name('media.index');
    Route::post('/', [MediaController::class, 'store_media'])->name('media.store');
    Route::get('/{id}', [MediaController::class, 'get_media_by_id'])->name('media.show');
    Route::match(['put', 'post'], '/{id}', [MediaController::class, 'update_media'])->name('media.update');
    Route::delete('/{id}', [MediaController::class, 'destroy_media'])->name('media.destroy');
});
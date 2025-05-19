<?php

use Illuminate\Support\Facades\Route;
use Modules\Script\src\Controllers\ScriptController;
use Modules\Script\src\Controllers\FeedBackController;

Route::prefix('script')->middleware('auth:sanctum')->group(function () {
    //Import-Export
    Route::post('/media/{media1_id}/import', [ScriptController::class, 'import_scripts']);
    Route::get('/media/{media1_id}/export', [ScriptController::class, 'export_scripts']);
    // Script Routes
    Route::get('/media/{media1_id}', [ScriptController::class, 'get_scripts'])->name('script.index');
    Route::post('/media/{media1_id}', [ScriptController::class, 'create_script'])->name('script.store');
    Route::get('/media/{media1_id}/{id}', [ScriptController::class, 'get_script_by_id'])->name('script.show');
    Route::match(['get', 'put'], '/media/{media1_id}/{id}', [ScriptController::class, 'update_script'])->name('script.update');
    Route::delete('/media/{media1_id}/{id}', [ScriptController::class, 'destroy_script'])->name('script.destroy');

    // Feedback Routes
    Route::post('/feedback', [FeedBackController::class, 'store_feedback'])->name('feedback.store');
    Route::get('/feedbacks/{script_id}', [FeedBackController::class, 'get_feedbacks'])->name('feedback.index');
    Route::get('/feedback/{id}', [FeedBackController::class, 'get_feedback_by_id'])->name('feedback.show');
    Route::put('/feedback/{id}', [FeedBackController::class, 'update_feedback'])->name('feedback.update');
    Route::delete('/feedback/{id}', [FeedBackController::class, 'destroy_feedback'])->name('feedback.destroy');
});
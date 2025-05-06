<?php

use Modules\Core\src\Controllers\CoreController;

Route::middleware('sanctum')->get('/core', function (Request $request) {
    return $request->user();
});

Route::prefix('core')->group(function () {
    Route::middleware('auth:sanctum')->get('/', function (Request $request) {
        return $request->user();
    });
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('comments', [CoreController::class, 'storeComment']);
        Route::get('media/{mediaId}/comments', [CoreController::class, 'getComments']);
        Route::put('comments/{id}', [CoreController::class, 'updateComment']);
        Route::delete('comments/{id}', [CoreController::class, 'destroyComment']);
        Route::get('notifications', [CoreController::class, 'getNotifications']);
        Route::put('notifications/{id}/read', [CoreController::class, 'markNotificationAsRead']);
    });
});
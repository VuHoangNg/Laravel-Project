<?php

use Illuminate\Http\Request;
use Modules\Core\src\Controllers\NotificationController;
use Modules\Core\src\Controllers\ReportController;

Route::middleware('auth:sanctum')->get('/core', function (Request $request) {
    return $request->user();
});

Route::prefix('core')->group(function () {
    Route::middleware('auth:sanctum')->get('/', function (Request $request) {
        return $request->user();
    });
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('notifications', [NotificationController::class, 'get_notifications']);
        Route::put('notifications/{id}/read', [NotificationController::class, 'update_notification_as_read']);
        Route::get('reports', [ReportController::class, 'index']);
    });
});
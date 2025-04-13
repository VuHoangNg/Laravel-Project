<?php

use Modules\Core\src\Controllers\CoreController;

Route::middleware('sanctum')->get('/core', function (Request $request) {
    return $request->user();
});

Route::post('/login', [CoreController::class, 'login']);
Route::post('/register', [CoreController::class, 'register']);
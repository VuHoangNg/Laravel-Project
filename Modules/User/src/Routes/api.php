<?php

use Illuminate\Http\Request;
use Modules\User\src\Controllers\UserController;

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users', [UserController::class, 'get_all_users'])->name('api.users.index');
    Route::post('/user', [UserController::class, 'store_user'])->name('api.users.store');
    Route::get('/user/{id}', [UserController::class, 'get_user_by_id'])->name('api.users.show');
    Route::put('/user/{id}', [UserController::class, 'update_user'])->name('api.users.update');
    Route::delete('/user/{id}', [UserController::class, 'destroy_user'])->name('api.users.destroy');
});
<?php

use Illuminate\Http\Request;
use Modules\User\src\Controllers\UserController;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users', [UserController::class, 'index'])->name('api.users.index');
    Route::post('/user', [UserController::class, 'store'])->name('api.users.store');
    Route::get('/user/{id}', [UserController::class, 'show'])->name('api.users.show');
    Route::put('/user/{id}', [UserController::class, 'update'])->name('api.users.update');
    Route::delete('/user/{id}', [UserController::class, 'destroy'])->name('api.users.destroy');
});
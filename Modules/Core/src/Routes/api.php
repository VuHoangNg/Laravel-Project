<?php

use Modules\Core\src\Controllers\CoreController;

Route::middleware('sanctum')->get('/core', function (Request $request) {
    return $request->user();
});
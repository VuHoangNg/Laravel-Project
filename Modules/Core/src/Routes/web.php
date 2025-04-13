<?php

use Modules\Core\src\Controllers\CoreController;

Route::prefix('core')->group(function() {
    Route::get('{any?}', [CoreController::class, 'index'])->where('any', '.*');
});
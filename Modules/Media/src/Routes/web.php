<?php

use Modules\Media\src\Controllers\MediaController;

Route::prefix('media')->group(function() {
    Route::get('{any?}', [MediaController::class, 'index'])->where('any', '.*');
});
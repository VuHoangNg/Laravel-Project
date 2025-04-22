<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

Artisan::command('test:ffmpeg', function () {
    try {
        $ffmpeg = FFMpeg\FFMpeg::create([
            'ffmpeg.binaries' => config('media.ffmpeg_path', 'ffmpeg'),
            'ffprobe.binaries' => config('media.ffprobe_path', 'ffprobe'),
        ]);
        $this->info('FFmpeg initialized successfully!');
    } catch (\Exception $e) {
        $this->error('FFmpeg failed: ' . $e->getMessage());
    }
})->describe('Test FFmpeg integration');

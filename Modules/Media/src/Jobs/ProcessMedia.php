<?php

namespace Modules\Media\src\Jobs;

use Modules\Media\src\Models\Media;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use FFMpeg\FFMpeg;
use FFMpeg\Format\Video\X264;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProcessMedia implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $media;
    public $file;
    public $type;
    public $title;

    /**
     * Create a new job instance.
     *
     * @param Media $media
     * @param mixed $file
     * @param string $type
     * @param string $title
     */
    public function __construct(Media $media, $file, string $type, string $title)
    {
        $this->media = $media;
        $this->file = $file;
        $this->type = $type;
        $this->title = $title;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $filename = Str::random(40) . '.' . $this->file->getClientOriginalExtension();
        $path = 'media/' . $this->type . 's/' . $filename;

        if ($this->type === 'video') {
            // Store the video temporarily
            $tempPath = $this->file->storeAs('temp', $filename, 'local');

            // Process the video using FFmpeg
            $hlsPath = 'media/videos/' . Str::random(40) . '/playlist.m3u8';
            $this->convertToHls(storage_path('app/' . $tempPath), storage_path('app/public/' . dirname($hlsPath)));

            // Delete the temporary file
            Storage::disk('local')->delete($tempPath);

            // Set the path to the generated HLS playlist
            $path = $hlsPath;
        } else {
            // Store image as is
            $this->file->storeAs('public', $path);
        }

        // Update media with the new path
        $this->media->update([
            'title' => $this->title,
            'type' => $this->type,
            'path' => $path,
        ]);
    }

    /**
     * Convert the video to HLS format using FFmpeg.
     *
     * @param string $inputPath
     * @param string $outputDir
     */
    protected function convertToHls($inputPath, $outputDir)
    {
        try {
            $ffmpeg = FFMpeg::create([
                'ffmpeg.binaries' => config('media.ffmpeg_path', 'C:\FFMPEG\bin\ffmpeg'),
                'ffprobe.binaries' => config('media.ffprobe_path', 'C:\FFMPEG\bin\ffprobe'),
            ]);

            $video = $ffmpeg->open($inputPath);
            $format = new X264();
            $format->setAdditionalParameters([
                '-hls_time', '10',
                '-hls_list_size', '0',
                '-hls_segment_filename', $outputDir . '/segment_%03d.ts',
            ]);

            if (!file_exists($outputDir)) {
                mkdir($outputDir, 0755, true);
            }

            $video->save($format, $outputDir . '/playlist.m3u8');
        } catch (\Exception $e) {
            \Log::error("FFmpeg conversion failed: " . $e->getMessage());
            throw $e;
        }
    }
}

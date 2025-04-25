<?php

namespace Modules\Media\src\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use FFMpeg\FFMpeg;
use FFMpeg\Format\Video\X264;
use Illuminate\Support\Facades\Log;
use Modules\Media\src\Repositories\MediaRepositoryInterface;
use Modules\Media\src\Models\Media1;

class ProcessVideoToHls implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $inputPath;
    protected $outputDir;
    protected $mediaId;
    protected $thumbnailPath;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public $backoff = 60;

    /**
     * Create a new job instance.
     *
     * @param string $inputPath
     * @param string $outputDir
     * @param int $mediaId
     * @param string $thumbnailPath
     */
    public function __construct(string $inputPath, string $outputDir, int $mediaId, string $thumbnailPath)
    {
        $this->inputPath = $inputPath;
        $this->outputDir = $outputDir;
        $this->mediaId = $mediaId;
        $this->thumbnailPath = $thumbnailPath;
        $this->onQueue('video-processing'); // Dedicated queue for video processing
    }

    /**
     * Execute the job.
     *
     * @param MediaRepositoryInterface $mediaRepository
     * @return void
     */
    public function handle(MediaRepositoryInterface $mediaRepository)
    {
        Log::info("Starting HLS conversion and thumbnail generation for Media ID: {$this->mediaId}", [
            'input_path' => $this->inputPath,
            'output_dir' => $this->outputDir,
            'thumbnail_path' => $this->thumbnailPath,
        ]);

        // Set status to "processing"
        Media1::find($this->mediaId)->update(['status' => 0]);

        try {
            $ffmpeg = FFMpeg::create([
                'ffmpeg.binaries' => config('media.ffmpeg_path', 'C:\FFMPEG\bin\ffmpeg.exe'),
                'ffprobe.binaries' => config('media.ffprobe_path', 'C:\FFMPEG\bin\ffprobe.exe'),
            ]);

            // Ensure thumbnail directory exists
            $thumbnailDir = dirname($this->thumbnailPath);
            if (!file_exists($thumbnailDir)) {
                Log::info("Creating thumbnail directory: {$thumbnailDir}");
                mkdir($thumbnailDir, 0755, true);
            }

            // Generate thumbnail
            Log::info("Generating thumbnail at: {$this->thumbnailPath}");
            $video = $ffmpeg->open($this->inputPath);
            $frame = $video->frame(\FFMpeg\Coordinate\TimeCode::fromSeconds(0.1));
            $frame->save($this->thumbnailPath);
            Log::info("Thumbnail generated successfully at: {$this->thumbnailPath}");

            // Process HLS conversion
            $format = new X264();
            $format->setAdditionalParameters([
                '-hls_time', '10',
                '-hls_list_size', '0',
                '-hls_segment_filename', $this->outputDir . '/segment_%03d.ts',
            ]);

            if (!file_exists($this->outputDir)) {
                Log::info("Creating HLS output directory: {$this->outputDir}");
                mkdir($this->outputDir, 0755, true);
            }

            $video->save($format, $this->outputDir . '/playlist.m3u8');
            Log::info("HLS conversion completed for Media ID: {$this->mediaId}");

            // Update status to "success"
            Media1::find($this->mediaId)->update(['status' => 1]);

            // Clean up temporary file
            if (file_exists($this->inputPath)) {
                Log::info("Deleting temporary file: {$this->inputPath}");
                unlink($this->inputPath);
            }

            Log::info("HLS conversion and thumbnail generation completed for Media ID: {$this->mediaId}");
        } catch (\Exception $e) {
            // Update status to "failed"
            Media1::find($this->mediaId)->update(['status' => -1]);
            Log::error("FFmpeg processing failed for Media ID: {$this->mediaId}", [
                'error' => $e->getMessage(),
                'input_path' => $this->inputPath,
                'thumbnail_path' => $this->thumbnailPath,
                'output_dir' => $this->outputDir,
            ]);
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     *
     * @param \Throwable $exception
     * @return void
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('ProcessVideoToHls job failed after all retries', [
            'media_id' => $this->mediaId,
            'error' => $exception->getMessage(),
        ]);
        Media1::find($this->mediaId)->update(['status' => -1]);
    }
}
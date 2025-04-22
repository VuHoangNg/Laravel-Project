<?php

namespace Modules\Media\src\Controllers;

use App\Jobs\ProcessMedia;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Media\src\Models\Media;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;

class MediaController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
     */
    public function index()
    {
        $media = Media::all()->map(function ($item) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'type' => $item->type,
                'url' => Storage::url($item->path),
            ];
        });

    return response()->json([
        'data' => $transformedMedia,
        'current_page' => $media->currentPage(),
        'per_page' => $media->perPage(),
        'total' => $media->total(),
        'last_page' => $media->lastPage(),
    ]);
}



    /**
     * Store a newly created media in storage.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        // Validate the incoming request
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type' => 'required|in:image,video',
            'file' => 'required|file|mimes:jpg,jpeg,png,mp4,mov,mkv,flv,avi,wmv|max:20480', // Add supported video formats
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Get the validated data
        $file = $request->file('file');
        $type = $request->input('type');
        $title = $request->input('title');

        // Create a new media entry in the database
        $media = Media::create([
            'title' => $title,
            'type' => $type,
            'path' => '', // This will be updated after the processing is done
        ]);

        // Dispatch the job to process the media
        ProcessMedia::dispatch($media, $file, $type, $title);

        return response()->json([
            'id' => $media->id,
            'title' => $media->title,
            'type' => $media->type,
            'url' => Storage::url($media->path),
        ], 201);
    }

    /**
     * Display the specified media.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        $media = Media::findOrFail($id);

        return response()->json([
            'id' => $media->id,
            'title' => $media->title,
            'type' => $media->type,
            'url' => Storage::url($media->path),
        ]);
    }

    /**
     * Update the specified media in storage.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        $media = Media::findOrFail($id);

        // Validate the incoming request
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type' => 'required|in:image,video',
            'file' => 'nullable|file|mimes:jpg,jpeg,png,mp4,mov,mkv,flv,avi,wmv|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = [
            'title' => $request->input('title'),
            'type' => $request->input('type'),
        ];

        if ($request->hasFile('file')) {
            // Delete old file
            Storage::disk('public')->delete($media->path);
            if ($media->type === 'video') {
                // Delete the HLS directory
                Storage::disk('public')->deleteDirectory(dirname($media->path));
            }

            $file = $request->file('file');
            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
            $path = 'media/' . $data['type'] . 's/' . $filename;

            if ($data['type'] === 'video') {
                // Store the video temporarily
                $tempPath = $file->storeAs('temp', $filename, 'local');

                // Process the video using FFmpeg
                $hlsPath = 'media/videos/' . Str::random(40) . '/playlist.m3u8';
                $this->convertToHls(storage_path('app/' . $tempPath), storage_path('app/public/' . dirname($hlsPath)));

                // Delete the temporary file
                Storage::disk('local')->delete($tempPath);

                // Set the path to the generated HLS playlist
                $path = $hlsPath;
            } else {
                // Store image as is
                $file->storeAs('public', $path);
            }

            $data['path'] = $path;
        }

        $media->update($data);

        return response()->json([
            'id' => $media->id,
            'title' => $media->title,
            'type' => $media->type,
            'url' => Storage::url($media->path),
        ]);
    }

    /**
     * Remove the specified media from storage.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        $media = Media::findOrFail($id);

        // Delete the file
        Storage::disk('public')->delete($media->path);
        if ($media->type === 'video') {
            // Delete the HLS directory
            Storage::disk('public')->deleteDirectory(dirname($media->path));
        }

        $media->delete();

        return response()->json(null, 204);
    }

    /**
     * Convert video to HLS format using FFmpeg.
     *
     * @param string $inputPath
     * @param string $outputDir
     * @return void
     */
    protected function convertToHls($inputPath, $outputDir)
    {
        try {
            $ffmpeg = FFMpeg\FFMpeg::create([
                'ffmpeg.binaries' => config('media.ffmpeg_path', 'C:\FFMPEG\bin\ffmpeg'),
                'ffprobe.binaries' => config('media.ffprobe_path', 'C:\FFMPEG\bin\ffprobe'),
            ]);

            $video = $ffmpeg->open($inputPath);
            $format = new FFMpeg\Format\Video\X264();
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

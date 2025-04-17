<?php

namespace Modules\Media\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Media\src\Models\Media;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use FFMpeg\FFMpeg;
use FFMpeg\Format\Video\X264;
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

        return response()->json($media);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type' => 'required|in:image,video',
            'file' => 'required|file|mimes:jpg,jpeg,png,mp4,mov,mkv,flv,avi,wmv|max:20480', // Add supported video formats
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $file = $request->file('file');
        $type = $request->input('type');
        $title = $request->input('title');
        $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
        $path = 'media/' . $type . 's/' . $filename;

        if ($type === 'video') {
            // Store original video temporarily
            $tempPath = $file->storeAs('temp', $filename, 'local');

            // Process video with FFmpeg to HLS
            $hlsPath = 'media/videos/' . Str::random(40) . '/playlist.m3u8';
            $this->convertToHls(storage_path('app/' . $tempPath), storage_path('app/public/' . dirname($hlsPath)));

            // Delete temp file
            Storage::disk('local')->delete($tempPath);

            // Save HLS playlist path
            $path = $hlsPath;
        } else {
            // Store image
            $file->storeAs('public', $path);
        }

        // Save to database
        $media = Media::create([
            'title' => $title,
            'type' => $type,
            'path' => $path,
        ]);

        return response()->json([
            'id' => $media->id,
            'title' => $media->title,
            'type' => $media->type,
            'url' => Storage::url($media->path),
        ], 201);
    }

    /**
     * Display the specified resource.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show($id)
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
     * Update the specified resource in storage.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id)
    {
        $media = Media::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type' => 'required|in:image,video',
            'file' => 'required|file|mimes:jpg,jpeg,png,mp4,mov,mkv,flv,avi,wmv|max:20480', // Add supported video formats
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = [
            'title' => $request->input('type'),
            'type' => $request->input('type'),
        ];

        if ($request->hasFile('file')) {
            // Delete old file
            Storage::disk('public')->delete($media->path);
            if ($media->type === 'video') {
                // Delete HLS directory
                Storage::disk('public')->deleteDirectory(dirname($media->path));
            }

            $file = $request->file('file');
            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
            $path = 'media/' . $data['type'] . 's/' . $filename;

            if ($data['type'] === 'video') {
                // Store original video temporarily
                $tempPath = $file->storeAs('temp', $filename, 'local');

                // Process video with FFmpeg to HLS
                $hlsPath = 'media/videos/' . Str::random(40) . '/playlist.m3u8';
                $this->convertToHls(storage_path('app/' . $tempPath), storage_path('app/public/' . dirname($hlsPath)));

                // Delete temp file
                Storage::disk('local')->delete($tempPath);

                // Save HLS playlist path
                $path = $hlsPath;
            } else {
                // Store image
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
     * Remove the specified resource from storage.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($id)
    {
        $media = Media::findOrFail($id);

        // Delete file
        Storage::disk('public')->delete($media->path);
        if ($media->type === 'video') {
            // Delete HLS directory
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
        $ffmpeg = FFMpeg::create([
            'ffmpeg.binaries' => config('media.ffmpeg_path', 'C:\FFMPEG\bin\ffmpeg'),
            'ffprobe.binaries' => config('media.ffprobe_path', 'C:\FFMPEG\bin\ffmpeg'),
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
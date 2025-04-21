<?php

namespace Modules\Media\src\Repositories;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Modules\Media\src\Models\Media;
use Illuminate\Http\JsonResponse;
use FFMpeg\FFMpeg;
use FFMpeg\Format\Video\X264;

class MediaRepository implements MediaRepositoryInterface
{
    /**
     * Get paginated media.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->query('perPage', 10);
        $page = $request->query('page', 1);

        $perPage = min(max((int)$perPage, 1), 100);

        $media = Media::paginate($perPage, ['*'], 'page', $page);

        $transformedMedia = $media->map(function ($item) {
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
     * Store a newly created media file.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type' => 'required|in:image,video',
            'file' => 'required|file|mimes:jpg,jpeg,png,mp4,mov,mkv,flv,avi,wmv|max:20480',
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
            $tempPath = $file->storeAs('temp', $filename, 'local');
            $hlsPath = 'media/videos/' . Str::random(40) . '/playlist.m3u8';
            $this->convertToHls(storage_path('app/' . $tempPath), storage_path('app/public/' . dirname($hlsPath)));
            Storage::disk('local')->delete($tempPath);
            $path = $hlsPath;
        } else {
            $file->storeAs('public', $path);
        }

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
     * Show a specific media item.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
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
     * Update an existing media item.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $media = Media::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type' => 'required|in:image,video',
            'file' => 'required|file|mimes:jpg,jpeg,png,mp4,mov,mkv,flv,avi,wmv|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = [
            'title' => $request->input('title'),
            'type' => $request->input('type'),
        ];

        if ($request->hasFile('file')) {
            Storage::disk('public')->delete($media->path);
            if ($media->type === 'video') {
                Storage::disk('public')->deleteDirectory(dirname($media->path));
            }

            $file = $request->file('file');
            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
            $path = 'media/' . $data['type'] . 's/' . $filename;

            if ($data['type'] === 'video') {
                $tempPath = $file->storeAs('temp', $filename, 'local');
                $hlsPath = 'media/videos/' . Str::random(40) . '/playlist.m3u8';
                $this->convertToHls(storage_path('app/' . $tempPath), storage_path('app/public/' . dirname($hlsPath)));
                Storage::disk('local')->delete($tempPath);
                $path = $hlsPath;
            } else {
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
     * Delete a media item.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $media = Media::findOrFail($id);

        Storage::disk('public')->delete($media->path);
        if ($media->type === 'video') {
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
    protected function convertToHls(string $inputPath, string $outputDir): void
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

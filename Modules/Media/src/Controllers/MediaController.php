<?php

namespace Modules\Media\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Modules\Media\src\Jobs\ProcessVideoToHls;
use Modules\Media\src\Repositories\MediaRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class MediaController extends Controller
{
    private $mediaRepository;

    public function __construct(MediaRepositoryInterface $mediaRepository)
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
        $this->mediaRepository = $mediaRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->query('perPage', 10);
        $page = $request->query('page', 1);

        $mediaQuery = $this->mediaRepository->getPaginated(
            (int) $perPage,
            (int) $page,
            ['id', 'title', 'type', 'path', 'thumbnail_path'], // Added 'type'
            ['created_at' => 'desc']
        );

        $responseData = $mediaQuery->getCollection()->map(function ($media) {
            return [
                'id' => $media->id,
                'title' => $media->title,
                'type' => $media->type, // Include type in response
                'url' => $media->url,
                'thumbnail_url' => $media->thumbnail_url,
            ];
        })->toArray();

        return response()->json([
            'data' => $responseData,
            'current_page' => $mediaQuery->currentPage(),
            'per_page' => $mediaQuery->perPage(),
            'total' => $mediaQuery->total(),
            'last_page' => $mediaQuery->lastPage(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'file' => 'required|file|mimes:jpg,jpeg,png,mp4,mov,avi|max:20480',
        ], [
            'file.mimes' => 'Only images (jpg, jpeg, png) or videos (mp4, mov, avi) are allowed.',
            'file.max' => 'The file may not be greater than 20MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $file = $request->file('file');
        $mime = $file->getMimeType();
        $isVideo = in_array($mime, ['video/mp4', 'video/quicktime', 'video/x-msvideo']);
        $isImage = in_array($mime, ['image/jpeg', 'image/png']);

        if (!$isVideo && !$isImage) {
            return response()->json(['error' => 'Only images (jpg, jpeg, png) or videos (mp4, mov, avi) are allowed.'], 422);
        }

        // Determine the type based on MIME
        $type = $isVideo ? 'video' : 'image';

        $datePath = date('Y/m/d');
        $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
        $path = $isVideo
            ? "media/videos/{$datePath}/" . Str::random(40) . '/playlist.m3u8'
            : "media/images/{$datePath}/{$filename}";
        $thumbnailPath = $isVideo ? "media/thumbnails/{$datePath}/" . Str::random(40) . '.jpg' : null;
        $status = $isVideo ? 0 : 1;

        $media = $this->mediaRepository->create([
            'title' => $request->input('title'),
            'type' => $type, // Add type to the create data
            'path' => $path,
            'thumbnail_path' => $thumbnailPath,
            'status' => $status,
        ]);

        if ($isVideo) {
            $tempPath = $file->storeAs('temp', $filename, 'local');
            \Log::info("Dispatching ProcessVideoToHls for Media ID: {$media->id}", [
                'temp_path' => $tempPath,
                'output_dir' => dirname($path),
                'thumbnail_path' => $thumbnailPath,
            ]);
            ProcessVideoToHls::dispatch(
                storage_path('app/' . $tempPath),
                storage_path('app/public/' . dirname($path)),
                $media->id,
                storage_path('app/public/' . $thumbnailPath)
            )->onQueue('video-processing')->afterCommit();
        } else {
            $file->storeAs('public/' . dirname($path), basename($path));
        }

        return response()->json([
            'id' => $media->id,
            'title' => $media->title,
            'type' => $media->type, // Include type in response
            'url' => $media->url,
            'thumbnail_url' => $media->thumbnail_url,
        ], 201);
    }

    public function show($id): JsonResponse
    {
        try {
            $media = $this->mediaRepository->find($id, ['id', 'title', 'type', 'path', 'thumbnail_path']); // Added 'type'
            return response()->json([
                'id' => $media->id,
                'title' => $media->title,
                'type' => $media->type, // Include type in response
                'url' => $media->url,
                'thumbnail_url' => $media->thumbnail_url,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            \Log::info('Update request data for Media ID: ' . $id, $request->all());

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'file' => 'nullable|file|mimes:jpg,jpeg,png,mp4,mov,avi|max:20480',
            ], [
                'file.mimes' => 'Only images (jpg, jpeg, png) or videos (mp4, mov, avi) are allowed.',
                'file.max' => 'The file may not be greater than 20MB.',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $columns = ['id', 'title', 'type', 'path', 'thumbnail_path']; // Include type in selected columns
            $media = $this->mediaRepository->find($id, $columns);
            $file = $request->file('file');

            $updateData = [
                'title' => $request->input('title'),
            ];

            if ($file) {
                $mime = $file->getMimeType();
                $isVideo = in_array($mime, ['video/mp4', 'video/quicktime', 'video/x-msvideo']);
                $isImage = in_array($mime, ['image/jpeg', 'image/png']);

                if (!$isVideo && !$isImage) {
                    return response()->json(['error' => 'Only images (jpg, jpeg, png) or videos (mp4, mov, avi) are allowed.'], 422);
                }

                // Determine the type based on MIME
                $type = $isVideo ? 'video' : 'image';

                // Delete old files
                Storage::disk('public')->delete($media->path);
                if ($media->thumbnail_path) {
                    Storage::disk('public')->delete($media->thumbnail_path);
                    Storage::disk('public')->deleteDirectory(dirname($media->path));
                }

                $datePath = date('Y/m/d');
                $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
                $path = $isVideo
                    ? "media/videos/{$datePath}/" . Str::random(40) . '/playlist.m3u8'
                    : "media/images/{$datePath}/{$filename}";
                $thumbnailPath = $isVideo ? "media/thumbnails/{$datePath}/" . Str::random(40) . '.jpg' : null;
                $status = $isVideo ? 0 : 1;

                $updateData['type'] = $type; // Update type
                $updateData['path'] = $path;
                $updateData['thumbnail_path'] = $thumbnailPath;
                $updateData['status'] = $status;

                if ($isVideo) {
                    $tempPath = $file->storeAs('temp', $filename, 'local');
                    \Log::info("Dispatching ProcessVideoToHls for Media ID: {$id}", [
                        'temp_path' => $tempPath,
                        'output_dir' => dirname($path),
                        'thumbnail_path' => $thumbnailPath,
                    ]);
                    ProcessVideoToHls::dispatch(
                        storage_path('app/' . $tempPath),
                        storage_path('app/public/' . dirname($path)),
                        $media->id,
                        storage_path('app/public/' . $thumbnailPath)
                    )->onQueue('video-processing')->afterCommit();
                } else {
                    $file->storeAs('public/' . dirname($path), basename($path));
                }
            }

            $updatedMedia = $this->mediaRepository->update($id, $updateData);
            return response()->json([
                'id' => $updatedMedia->id,
                'title' => $updatedMedia->title,
                'type' => $updatedMedia->type, // Include type in response
                'url' => $updatedMedia->url,
                'thumbnail_url' => $updatedMedia->thumbnail_url,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $columns = ['id', 'path', 'thumbnail_path'];
            $media = $this->mediaRepository->find($id, $columns);

            Storage::disk('public')->delete($media->path);
            if ($media->thumbnail_path) {
                Storage::disk('public')->delete($media->thumbnail_path);
                Storage::disk('public')->deleteDirectory(dirname($media->path));
            }

            $this->mediaRepository->delete($id);

            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }
}
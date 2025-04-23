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

class MediaController extends Controller
{
    protected $mediaRepository;

    public function __construct(MediaRepositoryInterface $mediaRepository)
    {
        $this->mediaRepository = $mediaRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->query('perPage', 10);
        $page = $request->query('page', 1);

        $columns = ['id', 'title', 'path', 'thumbnail_path', 'status'];
        $media = $this->mediaRepository->getPaginated((int) $perPage, (int) $page, $columns);

        return response()->json([
            'data' => $media->items(),
            'current_page' => $media->currentPage(),
            'per_page' => $media->perPage(),
            'total' => $media->total(),
            'last_page' => $media->lastPage(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'file' => 'required|file|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $file = $request->file('file');
        $mime = $file->getMimeType();
        $isVideo = str_starts_with($mime, 'video/');
        $isImage = str_starts_with($mime, 'image/');

        if (!$isVideo && !$isImage) {
            return response()->json(['error' => 'Unsupported file type.'], 422);
        }

        // Generate date-based directory (YYYY/MM/DD)
        $datePath = date('Y/m/d');
        $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
        $path = $isVideo
            ? "media/videos/{$datePath}/" . Str::random(40) . '/playlist.m3u8'
            : "media/images/{$datePath}/{$filename}";
        $thumbnailPath = $isVideo ? "media/thumbnails/{$datePath}/" . Str::random(40) . '.jpg' : null;
        $status = $isVideo ? 0 : 1;

        $media = $this->mediaRepository->create([
            'title' => $request->input('title'),
            'path' => $path,
            'thumbnail_path' => $thumbnailPath,
            'status' => $status,
        ]);

        if ($isVideo) {
            $tempPath = $file->storeAs('temp', $filename, 'local');

            ProcessVideoToHls::dispatch(
                storage_path('app/' . $tempPath),
                storage_path('app/public/' . dirname($path)),
                $media->id,
                storage_path('app/public/' . $thumbnailPath)
            )->afterCommit();
        } else {
            $file->storeAs('public/' . dirname($path), basename($path));
        }

        return response()->json([
            'id' => $media->id,
            'title' => $media->title,
            'url' => $media->url,
            'thumbnail_url' => $media->thumbnail_url,
            'status' => $media->status,
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $columns = ['id', 'title', 'path', 'thumbnail_path', 'status'];
        $media = $this->mediaRepository->find($id, $columns);

        return response()->json([
            'id' => $media->id,
            'title' => $media->title,
            'url' => $media->url,
            'thumbnail_url' => $media->thumbnail_url,
            'status' => $media->status,
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'file' => 'nullable|file|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $columns = ['id', 'title', 'path', 'thumbnail_path', 'status'];
        $media = $this->mediaRepository->find($id, $columns);
        $file = $request->file('file');

        $updateData = [
            'title' => $request->input('title'),
        ];

        if ($file) {
            $mime = $file->getMimeType();
            $isVideo = str_starts_with($mime, 'video/');
            $isImage = str_starts_with($mime, 'image/');

            if (!$isVideo && !$isImage) {
                return response()->json(['error' => 'Unsupported file type.'], 422);
            }

            // Delete old files
            Storage::disk('public')->delete($media->path);
            if ($media->thumbnail_path) {
                Storage::disk('public')->delete($media->thumbnail_path);
                Storage::disk('public')->deleteDirectory(dirname($media->path));
            }

            // Generate date-based directory (YYYY/MM/DD)
            $datePath = date('Y/m/d');
            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
            $path = $isVideo
                ? "media/videos/{$datePath}/" . Str::random(40) . '/playlist.m3u8'
                : "media/images/{$datePath}/{$filename}";
            $thumbnailPath = $isVideo ? "media/thumbnails/{$datePath}/" . Str::random(40) . '.jpg' : null;
            $status = $isVideo ? 0 : 1;

            $updateData['path'] = $path;
            $updateData['thumbnail_path'] = $thumbnailPath;
            $updateData['status'] = $status;

            if ($isVideo) {
                $tempPath = $file->storeAs('temp', $filename, 'local');

                ProcessVideoToHls::dispatch(
                    storage_path('app/' . $tempPath),
                    storage_path('app/public/' . dirname($path)),
                    $media->id,
                    storage_path('app/public/' . $thumbnailPath)
                )->afterCommit();
            } else {
                $file->storeAs('public/' . dirname($path), basename($path));
            }
        }

        $updatedMedia = $this->mediaRepository->update($id, $updateData);

        return response()->json([
            'id' => $updatedMedia->id,
            'title' => $updatedMedia->title,
            'url' => $updatedMedia->url,
            'thumbnail_url' => $updatedMedia->thumbnail_url,
            'status' => $updatedMedia->status,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $columns = ['id', 'path', 'thumbnail_path'];
        $media = $this->mediaRepository->find($id, $columns);

        Storage::disk('public')->delete($media->path);
        if ($media->thumbnail_path) {
            Storage::disk('public')->delete($media->thumbnail_path);
            Storage::disk('public')->deleteDirectory(dirname($media->path));
        }

        $this->mediaRepository->delete($id);

        return response()->json(null, 204);
    }
}
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

    private function getRequestedFields(Request $request): array
    {
        $fields = $request->query('fields', '');
        $allowedFields = ['id', 'title', 'url', 'thumbnail_url', 'status'];
        $requestedFields = $fields ? array_filter(explode(',', $fields)) : [];
        return array_intersect($requestedFields, $allowedFields);
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->query('perPage', 10);
        $page = $request->query('page', 1);
        $fields = $this->getRequestedFields($request);

        $columnMap = [
            'id' => 'id',
            'title' => 'title',
            'url' => 'path',
            'thumbnail_url' => 'thumbnail_path',
            'status' => 'status',
        ];
        $columns = $fields ? array_values(array_intersect_key($columnMap, array_flip($fields))) : ['id', 'title', 'path', 'thumbnail_path', 'status'];

        $mediaQuery = $this->mediaRepository->getPaginated((int) $perPage, (int) $page, $columns);

        // Directly use the paginated collection, relying on model accessors
        $data = $mediaQuery->getCollection()->map(function ($item) use ($fields) {
            $itemArray = [
                'id' => $item->id,
                'title' => $item->title,
                'url' => $item->url,
                'thumbnail_url' => $item->thumbnail_url,
                'status' => $item->status,
            ];
            return empty($fields) ? $itemArray : array_intersect_key($itemArray, array_flip($fields));
        })->all();

        return response()->json([
            'data' => $data,
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

        $mediaArray = [
            'id' => $media->id,
            'title' => $media->title,
            'url' => $media->url,
            'thumbnail_url' => $media->thumbnail_url,
            'status' => $media->status,
        ];
        $fields = $this->getRequestedFields($request);
        return response()->json(
            empty($fields) ? $mediaArray : array_intersect_key($mediaArray, array_flip($fields)),
            201
        );
    }

    public function show($id): JsonResponse
    {
        try {
            $fields = $this->getRequestedFields(request());
            $columns = $fields ? array_values(array_intersect_key([
                'id' => 'id',
                'title' => 'title',
                'url' => 'path',
                'thumbnail_url' => 'thumbnail_path',
                'status' => 'status',
            ], array_flip($fields))) : ['id', 'title', 'path', 'thumbnail_path', 'status'];

            $media = $this->mediaRepository->find($id, $columns);
            $mediaArray = [
                'id' => $media->id,
                'title' => $media->title,
                'url' => $media->url,
                'thumbnail_url' => $media->thumbnail_url,
                'status' => $media->status,
            ];

            return response()->json(
                empty($fields) ? $mediaArray : array_intersect_key($mediaArray, array_flip($fields))
            );
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            \Log::info('Update request data:', $request->all());

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

            $columns = ['id', 'title', 'path', 'thumbnail_path', 'status'];
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
            $mediaArray = [
                'id' => $updatedMedia->id,
                'title' => $updatedMedia->title,
                'url' => $updatedMedia->url,
                'thumbnail_url' => $updatedMedia->thumbnail_url,
                'status' => $updatedMedia->status,
            ];

            $fields = $this->getRequestedFields($request);
            return response()->json(
                empty($fields) ? $mediaArray : array_intersect_key($mediaArray, array_flip($fields))
            );
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
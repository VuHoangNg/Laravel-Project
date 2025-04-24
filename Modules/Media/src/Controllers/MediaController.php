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
    private $id;
    private $title;
    private $url;
    private $thumbnailUrl;
    private $status;

    public function __construct(MediaRepositoryInterface $mediaRepository)
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
        $this->setMediaRepository($mediaRepository);
    }

    public function getMediaRepository(): MediaRepositoryInterface
    {
        return $this->mediaRepository;
    }

    public function setMediaRepository(MediaRepositoryInterface $mediaRepository): void
    {
        if (!$mediaRepository instanceof MediaRepositoryInterface) {
            throw new \InvalidArgumentException('The mediaRepository must implement MediaRepositoryInterface.');
        }
        $this->mediaRepository = $mediaRepository;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(?int $id): void
    {
        $this->id = $id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(?string $title): void
    {
        $this->title = $title;
    }

    public function getUrl(): ?string
    {
        return $this->url;
    }

    public function setUrl(?string $url): void
    {
        $this->url = $url;
    }

    public function getThumbnailUrl(): ?string
    {
        return $this->thumbnailUrl;
    }

    public function setThumbnailUrl(?string $thumbnailUrl): void
    {
        $this->thumbnailUrl = $thumbnailUrl;
    }

    public function getStatus(): ?int
    {
        return $this->status;
    }

    public function setStatus(?int $status): void
    {
        $this->status = $status;
    }

    private function getRequestedFields(Request $request): array
    {
        $fields = $request->query('fields', '');
        $allowedFields = ['id', 'title', 'url', 'thumbnail_url', 'status'];
        $requestedFields = $fields ? array_filter(explode(',', $fields)) : [];
        return array_intersect($requestedFields, $allowedFields);
    }

    private function toArray(array $fields = []): array
    {
        $data = [
            'id' => $this->getId(),
            'title' => $this->getTitle(),
            'url' => $this->getUrl(),
            'thumbnail_url' => $this->getThumbnailUrl(),
            'status' => $this->getStatus(),
        ];

        return empty($fields) ? $data : array_intersect_key($data, array_flip($fields));
    }

    private function setFromModel(object $media): void
    {
        $this->setId($media->id);
        $this->setTitle($media->title);
        $this->setUrl($media->path ? Storage::url($media->path) : null);
        $this->setThumbnailUrl($media->thumbnail_path ? Storage::url($media->thumbnail_path) : null);
        $this->setStatus($media->status);
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

        $media = $this->getMediaRepository()->getPaginated((int) $perPage, (int) $page, $columns);

        $data = [];
        foreach ($media->items() as $item) {
            $this->setFromModel($item);
            $data[] = $this->toArray($fields);
        }

        return response()->json([
            'data' => $data,
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

        $datePath = date('Y/m/d');
        $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
        $path = $isVideo
            ? "media/videos/{$datePath}/" . Str::random(40) . '/playlist.m3u8'
            : "media/images/{$datePath}/{$filename}";
        $thumbnailPath = $isVideo ? "media/thumbnails/{$datePath}/" . Str::random(40) . '.jpg' : null;
        $status = $isVideo ? 0 : 1;

        $media = $this->getMediaRepository()->create([
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

        $this->setFromModel($media);
        return response()->json($this->toArray($this->getRequestedFields($request)), 201);
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

            $media = $this->getMediaRepository()->find($id, $columns);
            $this->setFromModel($media);

            return response()->json($this->toArray($fields));
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            // Log request data for debugging
            \Log::info('Update request data:', $request->all());

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'file' => 'nullable|file|max:20480',
            ], [
                'title.required' => 'The title field is required.',
                'title.string' => 'The title must be a string.',
                'title.max' => 'The title may not be greater than 255 characters.',
                'file.max' => 'The file may not be greater than 20MB.',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $columns = ['id', 'title', 'path', 'thumbnail_path', 'status'];
            $media = $this->getMediaRepository()->find($id, $columns);
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

                // Delete existing files
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

            $updatedMedia = $this->getMediaRepository()->update($id, $updateData);
            $this->setFromModel($updatedMedia);

            return response()->json($this->toArray($this->getRequestedFields($request)));
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $columns = ['id', 'path', 'thumbnail_path'];
            $media = $this->getMediaRepository()->find($id, $columns);

            Storage::disk('public')->delete($media->path);
            if ($media->thumbnail_path) {
                Storage::disk('public')->delete($media->thumbnail_path);
                Storage::disk('public')->deleteDirectory(dirname($media->path));
            }

            $this->getMediaRepository()->delete($id);

            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }
}
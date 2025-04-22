<?php

namespace Modules\Media\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Media\src\Repositories\MediaRepositoryInterface;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;

class MediaController extends Controller
{
    protected $mediaRepository;

    public function __construct(MediaRepositoryInterface $mediaRepository)
    {
        $this->mediaRepository = $mediaRepository;
    }

    /**
     * Display a listing of the media.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->query('perPage', 10);
        $page = $request->query('page', 1);

        \Log::info('Requested page: ' . $page);
        \Log::info('Requested perPage: ' . $perPage);

        $media = $this->mediaRepository->getPaginated((int)$perPage, (int)$page);

        $transformedMedia = $media->map(function ($item) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'type' => $item->type,
                'url' => Storage::url($item->path),
                'thumbnail_url' => $item->thumbnail_path ? Storage::url($item->thumbnail_path) : null,
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
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type' => 'required|in:image,video',
            'file' => 'required|file|mimes:jpg,jpeg,png,mp4,mov,mkv,flv,avi,wmv|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $media = $this->mediaRepository->create(
            $request->only('title'),
            $request->file('file'),
            $request->input('type')
        );

        return response()->json([
            'id' => $media->id,
            'title' => $media->title,
            'type' => $media->type,
            'url' => Storage::url($media->path),
            'thumbnail_url' => $media->thumbnail_path ? Storage::url($media->thumbnail_path) : null,
            'status' => $media->status,
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
        $media = $this->mediaRepository->find($id);

        return response()->json([
            'id' => $media->id,
            'title' => $media->title,
            'type' => $media->type,
            'url' => Storage::url($media->path),
            'thumbnail_url' => $media->thumbnail_path ? Storage::url($media->thumbnail_path) : null,
        ]);
    }

    /**
     * Update the specified media in storage.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type' => 'required|in:image,video',
            'file' => 'required|file|mimes:jpg,jpeg,png,mp4,mov,mkv,flv,avi,wmv|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $media = $this->mediaRepository->update(
            $id,
            $request->only('title'),
            $request->file('file'),
            $request->input('type')
        );

        return response()->json([
            'id' => $media->id,
            'title' => $media->title,
            'type' => $media->type,
            'url' => Storage::url($media->path),
            'thumbnail_url' => $media->thumbnail_path ? Storage::url($media->thumbnail_path) : null,
            'status' => $media->status,
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
        $this->mediaRepository->delete($id);

        return response()->json(null, 204);
    }
}
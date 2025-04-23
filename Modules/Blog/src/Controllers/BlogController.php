<?php

namespace Modules\Blog\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Blog\src\Repositories\BlogRepository;
use Illuminate\Support\Facades\Storage;

class BlogController extends Controller
{
    protected $blogRepository;

    public function __construct(BlogRepository $blogRepository)
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
        $this->blogRepository = $blogRepository;
    }

    private function transformBlog($blog)
    {
        return [
            'id' => $blog->id,
            'title' => $blog->title,
            'content' => $blog->content,
            'media' => $blog->media->map(fn ($mediaItem) => [
                'id' => $mediaItem->id,
                'title' => $mediaItem->title,
                'type' => $mediaItem->type,
                'url' => Storage::url($mediaItem->path),
                'thumbnail' => $mediaItem->thumbnail_path
                    ? Storage::url($mediaItem->thumbnail_path)
                    : Storage::url($mediaItem->path),
            ]),
        ];
    }

    public function index(Request $request)
    {
        $perPage = min(max((int)$request->query('perPage', 10), 1), 100);
        $blogs = $this->blogRepository->getAll($perPage);

        return response()->json([
            'data' => $blogs->map(fn ($blog) => $this->transformBlog($blog)),
            'current_page' => $blogs->currentPage(),
            'per_page' => $blogs->perPage(),
            'total' => $blogs->total(),
            'last_page' => $blogs->lastPage(),
        ], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'media_ids' => 'nullable|array',
            'media_ids.*' => 'exists:media1,id',
        ]);

        $blog = $this->blogRepository->create($validated);

        return response()->json($this->transformBlog($blog), 201);
    }

    public function show($id)
    {
        $blog = $this->blogRepository->getById($id);

        return response()->json($this->transformBlog($blog), 200);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'media_ids' => 'nullable|array',
            'media_ids.*' => 'exists:media1,id',
        ]);

        $blog = $this->blogRepository->update($id, $validated);

        return response()->json($this->transformBlog($blog), 200);
    }

    public function destroy($id)
    {
        $this->blogRepository->delete($id);
        return response()->json(['message' => 'Blog deleted successfully'], 200);
    }
}
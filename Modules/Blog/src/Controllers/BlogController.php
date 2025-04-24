<?php

namespace Modules\Blog\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Blog\src\Repositories\BlogRepositoryInterface;

class BlogController extends Controller
{
    protected $blogRepository;

    public function __construct(BlogRepositoryInterface $blogRepository)
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
        $this->blogRepository = $blogRepository;
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
        ]);
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

    private function transformBlog($blog)
    {
        return [
            'id' => $blog->id,
            'title' => $blog->title, // Uses accessor from Blog model
            'content' => $blog->content, // Uses accessor from Blog model
            'media' => $blog->media, // Automatically formatted by Media1 accessors
        ];
    }
}
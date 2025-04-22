<?php

namespace Modules\Blog\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Blog\src\Models\Blog;
use Illuminate\Support\Facades\Storage;
use Modules\Blog\src\Repositories\BlogRepositoryInterface;

class BlogController extends Controller
{
    protected $blogs;

    public function __construct(BlogRepositoryInterface $blogs)
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
        $this->blogs = $blogs;
    }

<<<<<<< HEAD
    public function index(Request $request)
    {
        $perPage = min(max((int)$request->query('perPage', 10), 1), 100);
        $blogs = $this->blogs->allPaginated($perPage);

        $transformed = $blogs->map(fn($item) => $this->transform($item));

        return response()->json([
            'data' => $transformed,
            'current_page' => $blogs->currentPage(),
            'per_page' => $blogs->perPage(),
            'total' => $blogs->total(),
            'last_page' => $blogs->lastPage(),
        ]);
=======
    public function index()
    {
        $blogs = Blog::with('thumbnail')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'content' => $item->content,
                'thumbnail_id' => $item->thumbnail_id,
                'thumbnail' => $item->thumbnail ? [
                    'id' => $item->thumbnail->id,
                    'title' => $item->thumbnail->title,
                    'type' => $item->thumbnail->type,
                    'url' => Storage::url($item->thumbnail->path),
                    'thumbnail' => $item->thumbnail->thumbnail_path
                        ? Storage::url($item->thumbnail->thumbnail_path)
                        : Storage::url($item->thumbnail->path),
                ] : null,
            ];
        });

        return response()->json($blogs, 200);
>>>>>>> parent of daaceb5 (master)
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'thumbnail_id' => 'nullable|exists:media,id',
        ]);

        $blog = $this->blogs->create($validated)->load('thumbnail');
        return response()->json($this->transform($blog), 201);
    }

    public function show($id)
    {
        $blog = $this->blogs->find($id);
        return response()->json($this->transform($blog));
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'thumbnail_id' => 'nullable|exists:media,id',
        ]);

        $blog = $this->blogs->find($id);
        $updated = $this->blogs->update($blog, $validated)->load('thumbnail');

        return response()->json($this->transform($updated));
    }

    public function destroy($id)
    {
        $blog = $this->blogs->find($id);
        $this->blogs->delete($blog);
        return response()->json(['message' => 'Blog deleted successfully']);
    }

    private function transform($item)
    {
        return [
            'id' => $item->id,
            'title' => $item->title,
            'content' => $item->content,
            'thumbnail_id' => $item->thumbnail_id,
            'thumbnail' => $item->thumbnail ? [
                'id' => $item->thumbnail->id,
                'title' => $item->thumbnail->title,
                'type' => $item->thumbnail->type,
                'url' => \Storage::url($item->thumbnail->path),
                'thumbnail' => $item->thumbnail->thumbnail_path
                    ? \Storage::url($item->thumbnail->thumbnail_path)
                    : \Storage::url($item->thumbnail->path),
            ] : null,
        ];
    }
}

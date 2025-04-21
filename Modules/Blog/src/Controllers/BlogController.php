<?php

namespace Modules\Blog\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Blog\src\Models\Blog;
use Illuminate\Support\Facades\Storage;

class BlogController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

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
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'thumbnail_id' => 'nullable|exists:media,id',
        ]);

        $blog = Blog::create($validated);

        $blog->load('thumbnail');
        $response = [
            'id' => $blog->id,
            'title' => $blog->title,
            'content' => $blog->content,
            'thumbnail_id' => $blog->thumbnail_id,
            'thumbnail' => $blog->thumbnail ? [
                'id' => $blog->thumbnail->id,
                'title' => $blog->thumbnail->title,
                'type' => $blog->thumbnail->type,
                'url' => Storage::url($blog->thumbnail->path),
                'thumbnail' => $blog->thumbnail->thumbnail_path
                    ? Storage::url($blog->thumbnail->thumbnail_path)
                    : Storage::url($blog->thumbnail->path),
            ] : null,
        ];

        return response()->json($response, 201);
    }

    public function show($id)
    {
        $blog = Blog::with('thumbnail')->findOrFail($id);

        $response = [
            'id' => $blog->id,
            'title' => $blog->title,
            'content' => $blog->content,
            'thumbnail_id' => $blog->thumbnail_id,
            'thumbnail' => $blog->thumbnail ? [
                'id' => $blog->thumbnail->id,
                'title' => $blog->thumbnail->title,
                'type' => $blog->thumbnail->type,
                'url' => Storage::url($blog->thumbnail->path),
                'thumbnail' => $blog->thumbnail->thumbnail_path
                    ? Storage::url($blog->thumbnail->thumbnail_path)
                    : Storage::url($blog->thumbnail->path),
            ] : null,
        ];

        return response()->json($response, 200);
    }

    public function update(Request $request, $id)
    {
        $blog = Blog::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'thumbnail_id' => 'nullable|exists:media,id',
        ]);

        $blog->update($validated);

        $blog->load('thumbnail');
        $response = [
            'id' => $blog->id,
            'title' => $blog->title,
            'content' => $blog->content,
            'thumbnail_id' => $blog->thumbnail_id,
            'thumbnail' => $blog->thumbnail ? [
                'id' => $blog->thumbnail->id,
                'title' => $blog->thumbnail->title,
                'type' => $blog->thumbnail->type,
                'url' => Storage::url($blog->thumbnail->path),
                'thumbnail' => $blog->thumbnail->thumbnail_path
                    ? Storage::url($blog->thumbnail->thumbnail_path)
                    : Storage::url($blog->thumbnail->path),
            ] : null,
        ];

        return response()->json($response, 200);
    }

    public function destroy($id)
    {
        $blog = Blog::findOrFail($id);
        $blog->delete();
        return response()->json(['message' => 'Blog deleted successfully'], 200);
    }
}
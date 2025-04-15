<?php

namespace Modules\Blog\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Blog\src\Models\Blog;

class BlogController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

    public function index()
    {
        $blogs = Blog::all();
        return response()->json($blogs, 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $blog = Blog::create($validated);
        return response()->json($blog, 201);
    }

    public function show($id)
    {
        $blog = Blog::findOrFail($id);
        return response()->json($blog, 200);
    }

    public function update(Request $request, $id)
    {
        $blog = Blog::findOrFail($id);
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $blog->update($validated);
        return response()->json($blog, 200);
    }

    public function destroy($id)
    {
        $blog = Blog::findOrFail($id);
        $blog->delete();
        return response()->json(['message' => 'Blog deleted successfully'], 200);
    }
}
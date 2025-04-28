<?php

namespace Modules\Blog\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Blog\src\Repositories\BlogRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class BlogController extends Controller
{
    private $blogRepository;

    public function __construct(BlogRepositoryInterface $blogRepository)
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
        $this->blogRepository = $blogRepository;
    }

    private function getRequestedFields(Request $request): array
    {
        $fields = $request->query('fields', '');
        $allowedFields = ['id', 'title', 'content', 'media'];
        $requestedFields = $fields ? array_filter(explode(',', $fields)) : [];
        return array_intersect($requestedFields, $allowedFields);
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int)$request->query('perPage', 10), 1), 100);
        $fields = $this->getRequestedFields($request);

        $columns = $fields && !in_array('media', $fields)
            ? array_intersect($fields, ['id', 'title', 'content'])
            : ['id', 'title', 'content'];

        // Fetch blogs sorted by created_at in descending order
        $blogs = $this->blogRepository->getAll(
            $perPage,
            $columns,
            in_array('media', $fields),
            ['created_at' => 'desc']
        );

        $data = $blogs->getCollection()->toArray();

        return response()->json([
            'data' => $data,
            'current_page' => $blogs->currentPage(),
            'per_page' => $blogs->perPage(),
            'total' => $blogs->total(),
            'last_page' => $blogs->lastPage(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'media_ids' => 'nullable|array',
            'media_ids.*' => 'exists:media1,id',
        ]);

        $blog = $this->blogRepository->create($validated);
        $fields = $this->getRequestedFields($request);

        $blogArray = [
            'id' => $blog->id,
            'title' => $blog->title,
            'content' => $blog->content,
        ];

        if (in_array('media', $fields) && $blog->media) {
            $blogArray['media'] = $blog->media->toArray();
        }

        return response()->json(
            empty($fields) ? $blogArray : array_intersect_key($blogArray, array_flip($fields)),
            201
        );
    }

    public function show($id): JsonResponse
    {
        try {
            $fields = $this->getRequestedFields(request());
            $columns = $fields && !in_array('media', $fields)
                ? array_intersect($fields, ['id', 'title', 'content'])
                : ['id', 'title', 'content'];

            $blog = $this->blogRepository->getById($id, $columns, in_array('media', $fields));

            $blogArray = [
                'id' => $blog->id,
                'title' => $blog->title,
                'content' => $blog->content,
            ];

            if (in_array('media', $fields) && $blog->media) {
                $blogArray['media'] = $blog->media->toArray();
            }

            return response()->json(
                empty($fields) ? $blogArray : array_intersect_key($blogArray, array_flip($fields))
            );
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'media_ids' => 'nullable|array',
                'media_ids.*' => 'exists:media1,id',
            ]);

            $blog = $this->blogRepository->update($id, $validated);
            $fields = $this->getRequestedFields($request);

            $blogArray = [
                'id' => $blog->id,
                'title' => $blog->title,
                'content' => $blog->content,
            ];

            if (in_array('media', $fields) && $blog->media) {
                $blogArray['media'] = $blog->media->toArray();
            }

            return response()->json(
                empty($fields) ? $blogArray : array_intersect_key($blogArray, array_flip($fields))
            );
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $this->blogRepository->delete($id);
            return response()->json(['message' => 'Blog deleted successfully'], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }
}
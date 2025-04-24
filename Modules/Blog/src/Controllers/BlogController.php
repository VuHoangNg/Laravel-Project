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
    private $id;
    private $title;
    private $content;
    private $media;

    public function __construct(BlogRepositoryInterface $blogRepository)
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
        $this->setBlogRepository($blogRepository);
    }

    public function getBlogRepository(): BlogRepositoryInterface
    {
        return $this->blogRepository;
    }

    public function setBlogRepository(BlogRepositoryInterface $blogRepository): void
    {
        if (!$blogRepository instanceof BlogRepositoryInterface) {
            throw new \InvalidArgumentException('The blogRepository must implement BlogRepositoryInterface.');
        }
        $this->blogRepository = $blogRepository;
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

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(?string $content): void
    {
        $this->content = $content;
    }

    public function getMedia(): ?array
    {
        return $this->media;
    }

    public function setMedia(?array $media): void
    {
        $this->media = $media;
    }

    private function getRequestedFields(Request $request): array
    {
        $fields = $request->query('fields', '');
        $allowedFields = ['id', 'title', 'content', 'media'];
        $requestedFields = $fields ? array_filter(explode(',', $fields)) : [];
        return array_intersect($requestedFields, $allowedFields);
    }

    private function toArray(array $fields = []): array
    {
        $data = [
            'id' => $this->getId(),
            'title' => $this->getTitle(),
            'content' => $this->getContent(),
            'media' => $this->getMedia(),
        ];

        return empty($fields) ? $data : array_intersect_key($data, array_flip($fields));
    }

    private function setFromModel(object $blog): void
    {
        $this->setId($blog->id);
        $this->setTitle($blog->title);
        $this->setContent($blog->content);
        $this->setMedia($blog->media->map(function ($media) {
            return [
                'id' => $media->id,
                'title' => $media->title,
                'url' => $media->path ? \Illuminate\Support\Facades\Storage::url($media->path) : null,
                'thumbnail_url' => $media->thumbnail_path ? \Illuminate\Support\Facades\Storage::url($media->thumbnail_path) : null,
                'status' => $media->status,
            ];
        })->toArray());
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int)$request->query('perPage', 10), 1), 100);
        $fields = $this->getRequestedFields($request);

        $blogs = $this->getBlogRepository()->getAll($perPage);

        $data = [];
        foreach ($blogs->items() as $blog) {
            $this->setFromModel($blog);
            $data[] = $this->toArray($fields);
        }

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

        $blog = $this->getBlogRepository()->create($validated);
        $this->setFromModel($blog);

        return response()->json($this->toArray($this->getRequestedFields($request)), 201);
    }

    public function show($id): JsonResponse
    {
        try {
            $blog = $this->getBlogRepository()->getById($id);
            $this->setFromModel($blog);

            return response()->json($this->toArray($this->getRequestedFields(request())));
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

            $blog = $this->getBlogRepository()->update($id, $validated);
            $this->setFromModel($blog);

            return response()->json($this->toArray($this->getRequestedFields($request)));
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $this->getBlogRepository()->delete($id);
            return response()->json(['message' => 'Blog deleted successfully'], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }
}
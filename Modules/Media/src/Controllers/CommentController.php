<?php

namespace Modules\Media\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Modules\Media\src\Repositories\CommentRepositoryInterface;
use Modules\Core\src\Repositories\NotificationRepositoryInterface;
use Modules\Media\src\Resources\CommentResource;
use Modules\Auth\src\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use UnauthorizedException;
use Illuminate\Support\Facades\Storage;

class CommentController extends Controller
{
    protected $commentRepository;
    protected $notificationRepository;

    public function __construct(
        CommentRepositoryInterface $commentRepository,
        NotificationRepositoryInterface $notificationRepository
    ) {
        $this->commentRepository = $commentRepository;
        $this->notificationRepository = $notificationRepository;
        $this->middleware('auth:sanctum')->only([
            'store_comment',
            'get_comments',
            'update_comment',
            'destroy_comment',
            'get_comment_by_id',
        ]);
    }

    public function store_comment(Request $request): JsonResponse
    {
        $user = $request->user();
        $rateLimitKey = 'comment:' . $user->id;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 10)) {
            return response()->json(['message' => 'Too many comment attempts'], 429);
        }
        RateLimiter::hit($rateLimitKey, 60);

        try {
            $validated = $request->validate([
                'text' => 'required|string|max:1000',
                'media1_id' => 'required|exists:media1,id',
                'timestamp' => 'nullable|numeric|min:0',
                'parent_id' => 'nullable|exists:comments,id',
            ]);

            $comment = $this->commentRepository->create($validated, $user);
            $this->notificationRepository->createForComment($comment, $user, $validated['parent_id'] ?? null);

            return response()->json([
                'id' => $comment->id,
                'text' => $comment->text,
                'timestamp' => $comment->timestamp,
                'formatted_timestamp' => $comment->timestamp ? gmdate('i:s', (int)$comment->timestamp) : null,
                'parent_id' => $comment->parent_id,
                'user' => $this->userToArray($comment->user),
                'message' => 'Comment created successfully',
            ], 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function get_comments(Request $request, $mediaId): JsonResponse
    {
        try {
            $request->merge(['media1_id' => $mediaId]);
            $validated = $request->validate([
                'media1_id' => 'required|exists:media1,id',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
            ]);

            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 5);
            $comments = $this->commentRepository->getByMediaId($mediaId, $page, $perPage);

            return response()->json([
                'data' => CommentResource::collection($comments->items()),
                'total' => $comments->total(),
                'current_page' => $comments->currentPage(),
                'per_page' => $comments->perPage(),
                'last_page' => $comments->lastPage(),
                'message' => 'Comments retrieved successfully',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function get_comment_by_id(Request $request, $id): JsonResponse
    {
        try {
            $comment = $this->commentRepository->findById($id);

            if (!$comment) {
                return response()->json(['message' => 'Comment not found'], 404);
            }

            $response = [
                'id' => $comment->id,
                'text' => $comment->text,
                'timestamp' => $comment->timestamp,
                'formatted_timestamp' => $comment->timestamp ? gmdate('i:s', (int)$comment->timestamp) : null,
                'parent_id' => $comment->parent_id,
                'user' => $this->userToArray($comment->user),
            ];

            if ($comment->parent) {
                $response['parent'] = [
                    'id' => $comment->parent->id,
                    'text' => $comment->parent->text,
                    'timestamp' => $comment->parent->timestamp,
                    'formatted_timestamp' => $comment->parent->timestamp ? gmdate('i:s', (int)$comment->parent->timestamp) : null,
                    'parent_id' => $comment->parent->parent_id,
                    'user' => $this->userToArray($comment->parent->user),
                ];
            }

            return response()->json([
                'data' => $response,
                'message' => 'Comment retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function update_comment(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'text' => 'required|string|max:1000',
                'timestamp' => 'nullable|numeric|min:0',
            ]);

            $comment = $this->commentRepository->update($id, $validated, $request->user());

            if (!$comment) {
                return response()->json(['message' => 'Comment not found'], 404);
            }

            return response()->json([
                'id' => $comment->id,
                'text' => $comment->text,
                'timestamp' => $comment->timestamp,
                'formatted_timestamp' => $comment->timestamp ? gmdate('i:s', (int)$comment->timestamp) : null,
                'user' => $this->userToArray($comment->user),
                'message' => 'Comment updated successfully',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (UnauthorizedException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function destroy_comment(Request $request, $id): JsonResponse
    {
        try {
            $success = $this->commentRepository->delete($id, $request->user());

            if (!$success) {
                return response()->json(['message' => 'Comment not found'], 404);
            }

            return response()->json(['message' => 'Comment deleted successfully']);
        } catch (UnauthorizedException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        }
    }

    private function userToArray(User $user, array $fields = []): array
    {
        $data = [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar ? Storage::url($user->avatar) : null,
        ];

        return empty($fields) ? $data : array_intersect_key($data, array_flip($fields));
    }
}
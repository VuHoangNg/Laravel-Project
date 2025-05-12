<?php

namespace Modules\Core\src\Controllers;

use Illuminate\Contracts\Support\Renderable;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Modules\Core\src\Repositories\CommentRepositoryInterface;
use Modules\Core\src\Repositories\NotificationRepositoryInterface;
use Modules\Core\src\Resources\CommentResource;
use Modules\Auth\src\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use UnauthorizedException;
use Illuminate\Support\Facades\Storage;

class CoreController extends Controller
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
            'storeComment',
            'getComments',
            'updateComment',
            'destroyComment',
            'getNotifications',
            'markNotificationAsRead',
            'getCommentById',
        ]);
    }

    public function index()
    {
        return view('core::index');
    }

    public function storeComment(Request $request): JsonResponse
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

    public function getComments(Request $request, $mediaId): JsonResponse
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

    public function getCommentById(Request $request, $id): JsonResponse
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

    public function updateComment(Request $request, $id): JsonResponse
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

    public function destroyComment(Request $request, $id): JsonResponse
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

    public function getNotifications(Request $request): JsonResponse
    {
        $perPage = $request->query('per_page', 20);
        $notifications = $this->notificationRepository->getForUser($request->user(), $perPage);
        return response()->json([
            'data' => $notifications->items(),
            'total' => $notifications->total(),
            'unread_count' => $notifications->unreadCount,
            'current_page' => $notifications->currentPage(),
            'last_page' => $notifications->lastPage(),
            'message' => 'Notifications retrieved successfully',
        ]);
    }

    public function markNotificationAsRead(Request $request, $id): JsonResponse
    {
        try {
            $notification = $this->notificationRepository->markAsRead($id, $request->user());

            if (!$notification) {
                return response()->json(['message' => 'Notification not found'], 404);
            }

            return response()->json([
                'id' => $notification->id,
                'is_read' => $notification->is_read,
                'message' => 'Notification marked as read',
            ]);
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
<?php

namespace Modules\Core\src\Controllers;

use Illuminate\Contracts\Support\Renderable;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Modules\Core\src\Models\Comment;
use Modules\Media\src\Models\Media1;
use Modules\Core\src\Models\Notification;
use Modules\Auth\src\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\RateLimiter;
use App\Events\NewCommentNotification;

class CoreController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->only([
            'storeComment',
            'getComments',
            'updateComment',
            'destroyComment',
            'getNotifications',
            'markNotificationAsRead',
        ]);
    }

    /**
     * Display a listing of the resource.
     * @return Renderable
     */
    public function index()
    {
        return view('core::index');
    }

    /**
     * Show the form for creating a new resource.
     * @return Renderable
     */
    public function create()
    {
        return view('core::create');
    }

    /**
     * Store a newly created resource in storage.
     * @param Request $request
     * @return Renderable
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Show the specified resource.
     * @param int $id
     * @return Renderable
     */
    public function show($id)
    {
        return view('core::show');
    }

    /**
     * Show the form for editing the specified resource.
     * @param int $id
     * @return Renderable
     */
    public function edit($id)
    {
        return view('core::edit');
    }

    /**
     * Update the specified resource in storage.
     * @param Request $request
     * @param int $id
     * @return Renderable
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     * @param int $id
     * @return Renderable
     */
    public function destroy($id)
    {
        //
    }

    /**
     * Store a new comment.
     * @param Request $request
     * @return JsonResponse
     */
    public function storeComment(Request $request): JsonResponse
    {
        $user = $request->user();
        $rateLimitKey = 'comment:' . $user->id;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 10)) {
            return response()->json(['message' => 'Too many comment attempts'], 429);
        }
        RateLimiter::hit($rateLimitKey, 60);

        $validated = $request->validate([
            'text' => 'required|string|max:1000',
            'media1_id' => 'required|exists:media1,id',
            'timestamp' => 'nullable|numeric|min:0',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $parentId = $validated['parent_id'] ?? null;

        // Check parent_id belongs to same media
        if ($parentId) {
            $parent = Comment::find($parentId);
            if (!$parent || $parent->media1_id != $validated['media1_id']) {
                Log::error('Invalid parent comment', [
                    'parent_id' => $parentId,
                    'media1_id' => $validated['media1_id'],
                    'parent_exists' => $parent ? true : false,
                    'parent_media1_id' => $parent ? $parent->media1_id : null,
                ]);
                return response()->json(['message' => 'Invalid parent comment for this media'], 422);
            }
        }

        $comment = Comment::create([
            'text' => trim($validated['text']),
            'timestamp' => $validated['timestamp'] ?? null,
            'user_id' => $user->id,
            'media1_id' => $validated['media1_id'],
            'parent_id' => $parentId,
        ]);

        Log::info('Comment created', [
            'comment_id' => $comment->id,
            'user_id' => $user->id,
            'media1_id' => $validated['media1_id'],
            'parent_id' => $parentId,
        ]);

        // Create notifications
        $this->createNotifications($comment, $user, $parentId);

        $comment->load('user');

        return response()->json([
            'id' => $comment->id,
            'text' => $comment->text,
            'timestamp' => $comment->timestamp,
            'formatted_timestamp' => $comment->timestamp ? gmdate('i:s', (int)$comment->timestamp) : null,
            'parent_id' => $comment->parent_id,
            'user' => $this->userToArray($comment->user),
            'message' => 'Comment created successfully',
        ], 201);
    }

    /**
     * Create notifications for a new comment.
     * @param Comment $comment
     * @param User $currentUser
     * @param mixed $parentId
     * @return void
     */
    private function createNotifications(Comment $comment, User $currentUser, $parentId)
    {
        $media = Media1::find($comment->media1_id);
        if (!$media) {
            Log::error('Media not found for notification', ['media1_id' => $comment->media1_id]);
            return;
        }

        $notifications = [];

        // Notify parent comment owner (if this is a reply)
        if ($parentId) {
            $parentComment = Comment::find($parentId);
            if ($parentComment && $parentComment->user_id != $currentUser->id) {
                $notification = Notification::create([
                    'user_id' => $parentComment->user_id,
                    'triggered_by_id' => $currentUser->id,
                    'media1_id' => $comment->media1_id,
                    'comment_id' => $comment->id,
                    'type' => 'reply',
                    'message' => "{$currentUser->username} replied to your comment on {$media->title}",
                    'is_read' => false,
                ]);
                $notifications[] = $notification;
                Log::info('Notification created for reply', [
                    'notification_id' => $notification->id,
                    'user_id' => $parentComment->user_id,
                    'triggered_by_id' => $currentUser->id,
                ]);
            } else {
                Log::warning('No notification created for reply', [
                    'parent_id' => $parentId,
                    'parent_exists' => $parentComment ? true : false,
                    'same_user' => $parentComment ? ($parentComment->user_id == $currentUser->id) : false,
                ]);
            }
        }

        // Notify other users who commented on the same media
        $otherCommenters = Comment::where('media1_id', $comment->media1_id)
            ->where('user_id', '!=', $currentUser->id)
            ->whereNull('parent_id') // Optionally limit to top-level comments
            ->distinct()
            ->pluck('user_id')
            ->toArray();

        foreach ($otherCommenters as $userId) {
            if ($parentId && $parentComment && $userId == $parentComment->user_id) {
                continue; // Skip if already notified as parent
            }
            $notification = Notification::create([
                'user_id' => $userId,
                'triggered_by_id' => $currentUser->id,
                'media1_id' => $comment->media1_id,
                'comment_id' => $comment->id,
                'type' => 'media_comment',
                'message' => "{$currentUser->username} commented on {$media->title}",
                'is_read' => false,
            ]);
            $notifications[] = $notification;
            Log::info('Notification created for media comment', [
                'notification_id' => $notification->id,
                'user_id' => $userId,
                'triggered_by_id' => $currentUser->id,
            ]);
        }

        // Broadcast notifications
        foreach ($notifications as $notification) {
            try {
                event(new NewCommentNotification($notification));
                Log::info('Notification event broadcasted', [
                    'notification_id' => $notification->id,
                    'user_id' => $notification->user_id,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to broadcast notification', [
                    'notification_id' => $notification->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Get comments for a specific media.
     * @param Request $request
     * @param int $mediaId
     * @return JsonResponse
     */
    public function getComments(Request $request, $mediaId): JsonResponse
    {
        $request->merge(['media1_id' => $mediaId]);
        $validated = $request->validate([
            'media1_id' => 'required|exists:media1,id',
        ]);

        $comments = Comment::where('media1_id', $validated['media1_id'])
            ->whereNull('parent_id')
            ->with([
                'user' => function ($query) {
                    $query->select('id', 'username', 'name', 'email', 'avatar');
                },
                'replies.user',
                'replies.replies.user',
            ])
            ->orderBy('timestamp', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        $format = function ($comment) use (&$format) {
            return [
                'id' => $comment->id,
                'text' => $comment->text,
                'timestamp' => $comment->timestamp,
                'formatted_timestamp' => $comment->timestamp ? gmdate('i:s', (int)$comment->timestamp) : null,
                'parent_id' => $comment->parent_id,
                'user' => [
                    'id' => $comment->user->id,
                    'name' => $comment->user->name,
                    'username' => $comment->user->username,
                    'email' => $comment->user->email,
                    'avatar_url' => $comment->user->avatar ? Storage::url($comment->user->avatar) : null,
                ],
                'replies' => $comment->replies->map($format)->values(),
            ];
        };

        $data = $comments->map($format)->values();

        return response()->json([
            'data' => $data,
            'message' => 'Comments retrieved successfully',
        ]);
    }

    /**
     * Update a comment.
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateComment(Request $request, $id): JsonResponse
    {
        try {
            $comment = Comment::findOrFail($id);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Comment not found'], 404);
        }

        $user = $request->user();
        if ($comment->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized to update this comment'], 403);
        }

        $validated = $request->validate([
            'text' => 'required|string|max:1000',
            'timestamp' => 'nullable|numeric|min:0',
        ]);

        $comment->update([
            'text' => trim($validated['text']),
            'timestamp' => $validated['timestamp'] ?? $comment->timestamp,
        ]);

        $comment->load('user');

        if (!$comment->user instanceof User) {
            $comment->user = User::find($comment->user_id);
            if (!$comment->user) {
                return response()->json(['message' => 'Comment user not found'], 404);
            }
        }

        return response()->json([
            'id' => $comment->id,
            'text' => $comment->text,
            'timestamp' => $comment->timestamp,
            'formatted_timestamp' => $comment->timestamp ? gmdate('i:s', (int)$comment->timestamp) : null,
            'user' => $this->userToArray($comment->user),
            'message' => 'Comment updated successfully',
        ]);
    }

    /**
     * Delete a comment.
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function destroyComment(Request $request, $id): JsonResponse
    {
        try {
            $comment = Comment::findOrFail($id);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Comment not found'], 404);
        }

        $user = $request->user();
        if ($comment->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized to delete this comment'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }

    /**
     * Get notifications for the authenticated user.
     * @param Request $request
     * @return JsonResponse
     */
    public function getNotifications(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->query('per_page', 20); // Default to 20 per page
        $notifications = Notification::where('user_id', $user->id)
            ->select('id', 'user_id', 'triggered_by_id', 'media1_id', 'comment_id', 'type', 'message', 'is_read', 'created_at')
            ->with([
                'triggeredBy:id,username,name,avatar',
                'media:id,title'
            ])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        Log::info('Notifications fetched', [
            'user_id' => $user->id,
            'notification_count' => $notifications->total(),
            'page' => $notifications->currentPage(),
        ]);

        return response()->json([
            'data' => $notifications->items(),
            'total' => $notifications->total(),
            'current_page' => $notifications->currentPage(),
            'last_page' => $notifications->lastPage(),
            'message' => 'Notifications retrieved successfully',
        ]);
    }

    /**
     * Mark a notification as read.
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function markNotificationAsRead(Request $request, $id): JsonResponse
    {
        try {
            $notification = Notification::findOrFail($id);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $user = $request->user();
        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized to mark this notification'], 403);
        }

        $notification->update(['is_read' => true]);

        Log::info('Notification marked as read', [
            'notification_id' => $notification->id,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'id' => $notification->id,
            'is_read' => $notification->is_read,
            'message' => 'Notification marked as read',
        ]);
    }

    /**
     * Convert a user to an array with avatar URL.
     * @param User $user
     * @param array $fields
     * @return array
     */
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
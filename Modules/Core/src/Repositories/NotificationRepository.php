<?php

namespace Modules\Core\src\Repositories;

use Illuminate\Support\Facades\Log;
use Modules\Media\src\Models\Comment;
use Modules\Media\src\Models\Media1;
use Modules\Auth\src\Models\User;
use Modules\Core\src\Models\Notification;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Events\NewCommentNotification;

class NotificationRepository implements NotificationRepositoryInterface
{
    public function createForComment(Comment $comment, User $currentUser, ?int $parentId): void
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

    public function getForUser(User $user, int $perPage): LengthAwarePaginator
    {
        $notifications = Notification::where('user_id', $user->id)
            ->select('id', 'user_id', 'triggered_by_id', 'media1_id', 'comment_id', 'type', 'message', 'is_read', 'created_at')
            ->with([
                'triggeredBy:id,username,name,avatar',
                'media:id,title'
            ])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
        $unreadCount = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();
        $notifications->unreadCount = $unreadCount;
        return $notifications;
    }

    public function markAsRead(int $id, User $user): ?Notification
    {
        $notification = Notification::find($id);
        if (!$notification) {
            return null;
        }

        if ($notification->user_id !== $user->id) {
            throw new \UnauthorizedException('Unauthorized to mark this notification');
        }

        $notification->update(['is_read' => true]);

        Log::info('Notification marked as read', [
            'notification_id' => $notification->id,
            'user_id' => $user->id,
        ]);

        return $notification;
    }
}
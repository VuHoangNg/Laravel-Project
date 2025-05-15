<?php

namespace Modules\Core\src\Repositories;

use Illuminate\Support\Facades\Log;
use Modules\Media\src\Models\Comment;
use Modules\Media\src\Models\Media1;
use Modules\Auth\src\Models\User;
use Modules\Core\src\Models\Notification; // Ensure this import is present
use Modules\Script\src\Models\Script;
use Modules\Script\src\Models\FeedBack;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Events\NewCommentNotification;
use App\Events\NewFeedbackNotification;

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

        $otherCommenters = Comment::where('media1_id', $comment->media1_id)
            ->where('user_id', '!=', $currentUser->id)
            ->whereNull('parent_id')
            ->distinct()
            ->pluck('user_id')
            ->toArray();

        foreach ($otherCommenters as $userId) {
            if ($parentId && $parentComment && $userId == $parentComment->user_id) {
                continue;
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
            ->select('id', 'user_id', 'triggered_by_id', 'media1_id', 'comment_id', 'script_id', 'feedback_id', 'type', 'message', 'is_read', 'created_at')
            ->with([
                'triggeredBy:id,username,name,avatar',
                'media:id,title',
                'script' => function ($query) {
                    $query->select('scripts.id', 'scripts.media1_id')
                         ->with(['media1' => function ($query) {
                             $query->select('id', 'title');
                         }]);
                },
                'feedback:id,script_id,text,user_id',
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

public function createForFeedBack(FeedBack $feedback, User $currentUser, ?int $parentId): void
    {
        $script = Script::with('media1')->find($feedback->script_id);
        if (!$script || !$script->media1) {
            Log::error('Script or Media1 not found for notification', [
                'script_id' => $feedback->script_id,
                'media1_exists' => $script ? ($script->media1 ? true : false) : false,
            ]);
            return;
        }

        $media1_id = $script->media1->id;

        $notifications = [];

        if ($parentId) {
            $parentFeedback = FeedBack::find($parentId);
            if ($parentFeedback && $parentFeedback->user_id != $currentUser->id) {
                $notification = Notification::create([
                    'user_id' => $parentFeedback->user_id,
                    'triggered_by_id' => $currentUser->id,
                    'script_id' => $feedback->script_id,
                    'feedback_id' => $feedback->id,
                    'media1_id' => $media1_id,
                    'comment_id' => null,
                    'type' => 'feedback_reply',
                    'message' => "{$currentUser->username} replied to your feedback on {$script->media1->title}",
                    'is_read' => false,
                ]);
                $notifications[] = $notification;
                Log::info('Notification created for feedback reply', [
                    'notification_id' => $notification->id,
                    'user_id' => $parentFeedback->user_id,
                    'triggered_by_id' => $currentUser->id,
                    'media1_id' => $media1_id,
                ]);
            } else {
                Log::warning('No notification created for feedback reply', [
                    'parent_id' => $parentId,
                    'parent_exists' => $parentFeedback ? true : false,
                    'same_user' => $parentFeedback ? ($parentFeedback->user_id == $currentUser->id) : false,
                ]);
            }
        }

        $otherFeedbackUsers = FeedBack::where('script_id', $feedback->script_id)
            ->where('user_id', '!=', $currentUser->id)
            ->whereNull('parent_id')
            ->distinct()
            ->pluck('user_id')
            ->toArray();

        foreach ($otherFeedbackUsers as $userId) {
            if ($parentId && $parentFeedback && $userId == $parentFeedback->user_id) {
                continue;
            }
            $notification = Notification::create([
                'user_id' => $userId,
                'triggered_by_id' => $currentUser->id,
                'script_id' => $feedback->script_id,
                'feedback_id' => $feedback->id,
                'media1_id' => $media1_id,
                'comment_id' => null, // Explicitly set to null
                'type' => 'script_feedback',
                'message' => "{$currentUser->username} added feedback on {$script->media1->title}",
                'is_read' => false,
            ]);
            $notifications[] = $notification;
            Log::info('Notification created for script feedback', [
                'notification_id' => $notification->id,
                'user_id' => $userId,
                'triggered_by_id' => $currentUser->id,
                'media1_id' => $media1_id,
            ]);
        }

        foreach ($notifications as $notification) {
            try {
                event(new NewFeedbackNotification($notification));
                Log::info('Feedback notification event broadcasted', [
                    'notification_id' => $notification->id,
                    'user_id' => $notification->user_id,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to broadcast feedback notification', [
                    'notification_id' => $notification->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
<?php

namespace Modules\Core\src\Repositories;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Auth\src\Models\User;
use Modules\Media\src\Models\Comment;
use Modules\Script\src\Models\FeedBack;
use Modules\Core\src\Models\Notification;

interface NotificationRepositoryInterface
{
    public function createForComment(Comment $comment, User $currentUser, ?int $parentId): void;

    public function createForFeedBack(FeedBack $feedback, User $currentUser, ?int $parentId): void;

    public function getForUser(User $user, int $perPage): LengthAwarePaginator;

    public function markAsRead(int $id, User $user): ?Notification;
}
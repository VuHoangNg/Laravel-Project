<?php

namespace Modules\Core\src\Repositories;

use Illuminate\Support\Facades\Log;
use Modules\Core\src\Models\Comment;
use Modules\Media\src\Models\Media1;
use Modules\Auth\src\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Storage;

class CommentRepository implements CommentRepositoryInterface
{
    public function create(array $data, User $user): Comment
    {
        $parentId = $data['parent_id'] ?? null;

        // Check parent_id belongs to same media
        if ($parentId) {
            $parent = Comment::find($parentId);
            if (!$parent || $parent->media1_id != $data['media1_id']) {
                Log::error('Invalid parent comment', [
                    'parent_id' => $parentId,
                    'media1_id' => $data['media1_id'],
                    'parent_exists' => $parent ? true : false,
                    'parent_media1_id' => $parent ? $parent->media1_id : null,
                ]);
                throw new \InvalidArgumentException('Invalid parent comment for this media');
            }
        }

        $comment = Comment::create([
            'text' => trim($data['text']),
            'timestamp' => $data['timestamp'] ?? null,
            'user_id' => $user->id,
            'media1_id' => $data['media1_id'],
            'parent_id' => $parentId,
        ]);

        Log::info('Comment created', [
            'comment_id' => $comment->id,
            'user_id' => $user->id,
            'media1_id' => $data['media1_id'],
            'parent_id' => $parentId,
        ]);

        $comment->load('user');

        return $comment;
    }

    public function getByMediaId(int $mediaId): \Illuminate\Database\Eloquent\Collection
    {
        return Comment::where('media1_id', $mediaId)
            ->whereNull('parent_id')
            ->with([
                'user' => function ($query) {
                    $query->select('id', 'username', 'name', 'email', 'avatar');
                },
                'replies.user',
            ])
            ->orderBy('timestamp', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function update(int $id, array $data, User $user): ?Comment
    {
        $comment = Comment::find($id);
        if (!$comment) {
            return null;
        }

        if ($comment->user_id !== $user->id) {
            throw new \UnauthorizedException('Unauthorized to update this comment');
        }

        $comment->update([
            'text' => trim($data['text']),
            'timestamp' => $data['timestamp'] ?? $comment->timestamp,
        ]);

        $comment->load('user');

        if (!$comment->user instanceof User) {
            $comment->user = User::find($comment->user_id);
            if (!$comment->user) {
                throw new ModelNotFoundException('Comment user not found');
            }
        }

        return $comment;
    }

    public function delete(int $id, User $user): bool
    {
        $comment = Comment::find($id);
        if (!$comment) {
            return false;
        }

        if ($comment->user_id !== $user->id) {
            throw new \UnauthorizedException('Unauthorized to delete this comment');
        }

        return $comment->delete();
    }
}
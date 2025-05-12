<?php

namespace Modules\Core\src\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Core\src\Models\Comment;
use Modules\Auth\src\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface CommentRepositoryInterface
{
    public function create(array $data, User $user): Comment;
    public function getByMediaId(int $mediaId, int $page, int $perPage): LengthAwarePaginator;
    public function update(int $id, array $data, User $user): ?Comment;
    public function delete(int $id, User $user): bool;
    public function findById(int $id): ?Comment;
}
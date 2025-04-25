<?php

namespace Modules\Blog\src\Repositories;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Blog\src\Models\Blog;

interface BlogRepositoryInterface
{
    public function getAll(int $perPage, array $columns = ['*'], bool $withMedia = false, array $orderBy = []): LengthAwarePaginator;
    public function getById(int $id, array $columns = ['*'], bool $withMedia = false): ?Blog;
    public function create(array $data): Blog;
    public function update(int $id, array $data): ?Blog;
    public function delete(int $id): bool;
}
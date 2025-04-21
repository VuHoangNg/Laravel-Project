<?php

namespace Modules\Blog\src\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Blog\src\Models\Blog;

interface BlogRepositoryInterface
{
    public function allPaginated(int $perPage): LengthAwarePaginator;

    public function find(int $id): Blog;

    public function create(array $data): Blog;

    public function update(Blog $blog, array $data): Blog;

    public function delete(Blog $blog): void;
}

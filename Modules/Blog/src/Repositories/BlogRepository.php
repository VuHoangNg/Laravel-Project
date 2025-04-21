<?php

namespace Modules\Blog\src\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Blog\src\Models\Blog;

class BlogRepository implements BlogRepositoryInterface
{
    public function allPaginated(int $perPage): LengthAwarePaginator
    {
        return Blog::with('thumbnail')->paginate($perPage);
    }

    public function find(int $id): Blog
    {
        return Blog::with('thumbnail')->findOrFail($id);
    }

    public function create(array $data): Blog
    {
        return Blog::create($data);
    }

    public function update(Blog $blog, array $data): Blog
    {
        $blog->update($data);
        return $blog;
    }

    public function delete(Blog $blog): void
    {
        $blog->delete();
    }
}

<?php

namespace Modules\Blog\src\Repositories;

use Modules\Blog\src\Repositories\BlogRepositoryInterface;
use Modules\Blog\src\Models\Blog;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class BlogRepository implements BlogRepositoryInterface
{
    public function getAll(int $perPage)
    {
        return Blog::with('media')->paginate($perPage);
    }

    public function getById(int $id): ?Blog
    {
        $blog = Blog::with('media')->find($id);
        if (!$blog) {
            throw new ModelNotFoundException("Blog with ID {$id} not found.");
        }
        return $blog;
    }

    public function create(array $data): Blog
    {
        $blog = Blog::create([
            'title' => $data['title'],
            'content' => $data['content'],
        ]);

        if (!empty($data['media_ids'])) {
            $blog->media()->sync($data['media_ids']);
        }

        return $blog;
    }

    public function update(int $id, array $data): ?Blog
    {
        $blog = Blog::find($id);
        if (!$blog) {
            throw new ModelNotFoundException("Blog with ID {$id} not found.");
        }
        $blog->update([
            'title' => $data['title'],
            'content' => $data['content'],
        ]);

        if (isset($data['media_ids'])) {
            $blog->media()->sync($data['media_ids']);
        }

        return $blog;
    }

    public function delete(int $id): bool
    {
        $blog = Blog::find($id);
        if (!$blog) {
            throw new ModelNotFoundException("Blog with ID {$id} not found.");
        }
        $blog->media()->detach();
        return $blog->delete();
    }
}
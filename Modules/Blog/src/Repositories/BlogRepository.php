<?php

namespace Modules\Blog\src\Repositories;

use Modules\Blog\src\Repositories\BlogRepositoryInterface;
use Modules\Blog\src\Models\Blog;

class BlogRepository implements BlogRepositoryInterface
{
    public function getAll(int $perPage)
    {
        return Blog::with('media')->paginate($perPage);
    }

    public function getById(int $id)
    {
        return Blog::with('media')->findOrFail($id);
    }

    public function create(array $data)
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

    public function update(int $id, array $data)
    {
        $blog = Blog::findOrFail($id);
        $blog->update([
            'title' => $data['title'],
            'content' => $data['content'],
        ]);

        if (isset($data['media_ids'])) {
            $blog->media()->sync($data['media_ids']);
        }

        return $blog;
    }

    public function delete(int $id)
    {
        $blog = Blog::findOrFail($id);
        $blog->media()->detach();
        $blog->delete();
        return true;
    }
}
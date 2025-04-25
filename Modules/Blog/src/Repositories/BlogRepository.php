<?php

namespace Modules\Blog\src\Repositories;

use Modules\Blog\src\Repositories\BlogRepositoryInterface;
use Modules\Blog\src\Models\Blog;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Pagination\LengthAwarePaginator;

class BlogRepository implements BlogRepositoryInterface
{
    public function getAll(int $perPage, array $columns = ['*'], bool $withMedia = false, array $orderBy = []): LengthAwarePaginator
    {
        $query = Blog::select($columns);
        if ($withMedia) {
            $query->with(['media' => function ($query) {
                $query->select('media1.id', 'media1.title', 'media1.path', 'media1.thumbnail_path', 'media1.status');
            }]);
        }
        // Apply sorting: default to created_at desc if no orderBy provided
        $orderBy = $orderBy ?: ['created_at' => 'desc'];
        foreach ($orderBy as $column => $direction) {
            $query->orderBy($column, $direction);
        }
        return $query->paginate($perPage);
    }

    public function getById(int $id, array $columns = ['*'], bool $withMedia = true): ?Blog
    {
        $query = Blog::select($columns);
        if ($withMedia) {
            $query->with(['media' => function ($query) {
                $query->select('media1.id', 'media1.title', 'media1.path', 'media1.thumbnail_path', 'media1.status');
            }]);
        }
        $blog = $query->find($id);
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

        // Load media for response
        $blog->load(['media' => function ($query) {
            $query->select('media1.id', 'media1.title', 'media1.path', 'media1.thumbnail_path', 'media1.status');
        }]);

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

        // Load media for response
        $blog->load(['media' => function ($query) {
            $query->select('media1.id', 'media1.title', 'media1.path', 'media1.thumbnail_path', 'media1.status');
        }]);

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
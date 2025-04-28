<?php

namespace Modules\Blog\src\Repositories;

use Modules\Blog\src\Repositories\BlogRepositoryInterface;
use Modules\Blog\src\Models\Blog;
use Modules\Media\src\Models\Media1;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Pagination\LengthAwarePaginator;

class BlogRepository implements BlogRepositoryInterface
{
    public function getAll(int $perPage, array $columns = ['*'], bool $withMedia = false, array $orderBy = []): LengthAwarePaginator
    {
        $query = Blog::select($columns);

        if ($withMedia) {
            $query->with(['media' => function ($query) {
                $query->select(['media1.id', 'media1.title', 'media1.path', 'media1.thumbnail_path', 'media1.blog_id','media1.type']);
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
        $query = Blog::where('id', $id)->select($columns);

        if ($withMedia) {
            $query->with(['media' => function ($query) {
                $query->select(['media1.id', 'media1.title', 'media1.path', 'media1.thumbnail_path', 'media1.blog_id' , 'media1.type']);
            }]);
        }

        $blog = $query->first();

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
            // Assign media items to this blog
            Media1::whereIn('id', $data['media_ids'])->update(['blog_id' => $blog->id]);
        }

        // Load media for response
        $blog->load(['media:id,title,path,thumbnail_path,blog_id,type']);

        return $blog;
    }

    public function update(int $id, array $data): ?Blog
    {
        $blog = Blog::where('id', $id)->first();

        if (!$blog) {
            throw new ModelNotFoundException("Blog with ID {$id} not found.");
        }

        $blog->update([
            'title' => $data['title'],
            'content' => $data['content'],
        ]);

        if (isset($data['media_ids'])) {
            // Remove existing media relationships
            Media1::where('blog_id', $blog->id)->update(['blog_id' => null]);

            // Assign new media items
            Media1::whereIn('id', $data['media_ids'])->update(['blog_id' => $blog->id]);
        }

        // Load media for response
        $blog->load(['media:id,title,path,thumbnail_path,blog_id']);

        return $blog;
    }

    public function delete(int $id): bool
    {
        $blog = Blog::where('id', $id)->first();

        if (!$blog) {
            throw new ModelNotFoundException("Blog with ID {$id} not found.");
        }

        // Unlink associated media
        Media1::where('blog_id', $id)->update(['blog_id' => null]);

        return $blog->delete();
    }
}
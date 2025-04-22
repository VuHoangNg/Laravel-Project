<?php

namespace Modules\Media\src\Repositories;

use Modules\Media\src\Models\Media1;
use Modules\Media\src\Repositories\MediaRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class MediaRepository implements MediaRepositoryInterface
{
    protected $model;

    public function __construct(Media1 $model)
    {
        $this->model = $model;
    }

    public function getPaginated(int $perPage, int $page, array $columns = ['*']): LengthAwarePaginator
    {
        return $this->model->newQuery()->select($columns)->paginate($perPage, ['*'], 'page', $page);
    }

    public function find($id, array $columns = ['*']): Media1
    {
        return $this->model->newQuery()->select($columns)->findOrFail($id);
    }

    public function create(array $data): Media1
    {
        return $this->model->create($data);
    }

    public function update($id, array $data): Media1
    {
        $media = $this->find($id);
        $media->update($data);
        return $media->fresh();
    }

    public function delete($id): bool
    {
        $media = $this->find($id);
        return $media->delete();
    }
}
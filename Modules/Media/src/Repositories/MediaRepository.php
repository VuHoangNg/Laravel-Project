<?php

namespace Modules\Media\src\Repositories;

use Modules\Media\src\Models\Media1;
use Modules\Media\src\Repositories\MediaRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class MediaRepository implements MediaRepositoryInterface
{
    private $model;

    public function __construct(Media1 $model)
    {
        $this->setModel($model);
    }

    public function getModel(): Media1
    {
        return $this->model;
    }

    public function setModel(Media1 $model): void
    {
        if (!$model instanceof Media1) {
            throw new \InvalidArgumentException('The model must be an instance of Media1.');
        }
        $this->model = $model;
    }

    public function getPaginated(int $perPage, int $page, array $columns = ['*']): LengthAwarePaginator
    {
        return $this->getModel()->newQuery()->select($columns)->paginate($perPage, ['*'], 'page', $page);
    }

    public function find($id, array $columns = ['*']): ?Media1
    {
        $media = $this->getModel()->newQuery()->select($columns)->find($id);
        if (!$media) {
            throw new ModelNotFoundException("Media with ID {$id} not found.");
        }
        return $media;
    }

    public function create(array $data): Media1
    {
        return $this->getModel()->create($data);
    }

    public function update($id, array $data): ?Media1
    {
        $media = $this->getModel()->newQuery()->find($id);
        if (!$media) {
            throw new ModelNotFoundException("Media with ID {$id} not found.");
        }
        $media->update($data);
        return $media->fresh();
    }

    public function delete($id): bool
    {
        $media = $this->getModel()->newQuery()->find($id);
        if (!$media) {
            throw new ModelNotFoundException("Media with ID {$id} not found.");
        }
        return $media->delete();
    }
}
<?php

namespace Modules\Media\src\Repositories;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Media\src\Models\Media1;

interface MediaRepositoryInterface
{
    public function getPaginated(int $perPage, int $page, array $columns = ['*']): LengthAwarePaginator;

    public function find($id, array $columns = ['*']): Media1;

    public function create(array $data): Media1;

    public function update($id, array $data): Media1;

    public function delete($id): bool;
}
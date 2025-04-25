<?php

namespace Modules\Media\src\Repositories;

use Modules\Media\src\Models\Media1;
use Illuminate\Pagination\LengthAwarePaginator;

interface MediaRepositoryInterface
{
    public function getPaginated(int $perPage, int $page, array $columns = ['*'], array $orderBy = []): LengthAwarePaginator;
    public function find($id, array $columns = ['*']): ?Media1;
    public function create(array $data): Media1;
    public function update($id, array $data): ?Media1;
    public function delete($id): bool;
}
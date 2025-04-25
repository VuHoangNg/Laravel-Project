<?php

namespace Modules\User\src\Repositories;

use Modules\Auth\src\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    public function getAll(int $perPage, array $columns = ['*'], array $orderBy = []): LengthAwarePaginator;
    public function getById(int $id, array $columns = ['*']): ?User;
    public function create(array $data): User;
    public function update(int $id, array $data): ?User;
    public function delete(int $id): bool;
}
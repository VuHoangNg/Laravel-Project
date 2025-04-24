<?php

namespace Modules\User\src\Repositories;

use Modules\Auth\src\Models\User;

interface UserRepositoryInterface
{
    public function getAll($perPage): \Illuminate\Contracts\Pagination\LengthAwarePaginator;
    public function getById($id): User;
    public function create(array $data): User;
    public function update($id, array $data): User;
    public function delete($id): bool;
}
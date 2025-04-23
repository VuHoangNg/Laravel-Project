<?php

namespace Modules\Blog\src\Repositories;

interface BlogRepositoryInterface
{
    public function getAll(int $perPage);
    public function getById(int $id);
    public function create(array $data);
    public function update(int $id, array $data);
    public function delete(int $id);
}
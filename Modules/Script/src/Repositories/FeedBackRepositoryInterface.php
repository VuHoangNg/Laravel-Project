<?php

namespace Modules\Script\src\Repositories;

use Modules\Auth\src\Models\User;

interface FeedBackRepositoryInterface
{
    public function create(array $data, User $user);

    public function getByScriptId(int $scriptId, int $page, int $perPage);

    public function findById(int $id);

    public function getFeedbackWithParentAndSiblings(int $id);

    public function update(int $id, array $data, User $user);

    public function delete(int $id, User $user): bool;
}
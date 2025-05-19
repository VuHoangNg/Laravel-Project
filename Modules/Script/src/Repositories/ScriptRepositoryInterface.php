<?php

namespace Modules\Script\src\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Script\src\Models\Script;
use Modules\Script\src\Exports\ScriptsExport;

interface ScriptRepositoryInterface
{
    public function getByMedia1Id(int $media1Id): Collection;

    public function create(array $data): Script;

    public function findById(int $id, int $media1Id): ?Script;

    public function update(int $id, int $media1Id, array $data): ?Script;

    public function delete(int $id, int $media1Id): bool;

    public function import(int $media1Id, $file): void;

    public function export(int $media1Id): ScriptsExport;
}
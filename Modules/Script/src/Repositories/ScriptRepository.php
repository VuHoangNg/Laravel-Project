<?php

namespace Modules\Script\src\Repositories;

use Modules\Script\src\Models\Script;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Modules\Media\src\Models\Media1;
use Modules\Script\src\Imports\ScriptsImport;
use Modules\Script\src\Exports\ScriptsExport;
use Maatwebsite\Excel\Facades\Excel;

class ScriptRepository implements ScriptRepositoryInterface
{
    protected $model;

    public function __construct(Script $model)
    {
        $this->model = $model;
    }

    public function getByMedia1Id(int $media1Id): Collection
    {
        return $this->model->where('media1_id', $media1Id)->get();
    }

    public function create(array $data): Script
    {
        if (!Media1::where('id', $data['media1_id'])->exists()) {
            throw new ModelNotFoundException('Media1 not found');
        }

        return $this->model->create([
            'media1_id' => $data['media1_id'],
            'part' => $data['part'],
            'est_time' => $data['est_time'],
            'direction' => $data['direction'],
            'detail' => $data['detail'],
            'note' => $data['note'] ?? null,
        ]);
    }

    public function findById(int $id, int $media1Id): ?Script
    {
        return $this->model->where('media1_id', $media1Id)->find($id);
    }

    public function update(int $id, int $media1Id, array $data): ?Script
    {
        $script = $this->findById($id, $media1Id);

        if (!$script) {
            return null;
        }

        $script->update([
            'part' => $data['part'],
            'est_time' => $data['est_time'],
            'direction' => $data['direction'],
            'detail' => $data['detail'],
            'note' => $data['note'] ?? null,
        ]);

        return $script;
    }

    public function delete(int $id, int $media1Id): bool
    {
        $script = $this->findById($id, $media1Id);

        if (!$script) {
            return false;
        }

        return $script->delete();
    }

    public function import(int $media1Id, $file): void
    {
        if (!Media1::where('id', $media1Id)->exists()) {
            throw new ModelNotFoundException('Media1 not found');
        }

        // Delete existing scripts
        $this->model->where('media1_id', $media1Id)->delete();

        // Import new scripts from file
        Excel::import(new ScriptsImport($media1Id), $file);
    }

    public function export(int $media1Id): ScriptsExport
    {
        return new ScriptsExport($media1Id);
    }
}
<?php

namespace Modules\Script\src\Repositories;

use Modules\Script\src\Models\Script;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Modules\Media\src\Models\Media1;
class ScriptRepository implements ScriptRepositoryInterface
{
    protected $model;

    public function __construct(Script $model)
    {
        $this->model = $model;
    }

    /**
     * Get all scripts for a given media1_id.
     */
    public function getByMedia1Id(int $media1Id): Collection
    {
        return $this->model->where('media1_id', $media1Id)->get();
    }

    /**
     * Create a new script.
     */
    public function create(array $data): Script
    {
        // Validate media1_id exists
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

    /**
     * Find a script by ID and media1_id.
     */
    public function findById(int $id, int $media1Id): ?Script
    {
        return $this->model->where('media1_id', $media1Id)->find($id);
    }

    /**
     * Update a script.
     */
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

    /**
     * Delete a script.
     */
    public function delete(int $id, int $media1Id): bool
    {
        $script = $this->findById($id, $media1Id);

        if (!$script) {
            return false;
        }

        return $script->delete();
    }

    /**
     * Import scripts, replacing existing ones for a media1_id.
     */
    public function import(int $media1Id, array $scripts): void
    {
        // Validate media1_id exists
        if (!Media1::where('id', $media1Id)->exists()) {
            throw new ModelNotFoundException('Media1 not found');
        }

        // Delete existing scripts
        $this->model->where('media1_id', $media1Id)->delete();

        // Create new scripts
        foreach ($scripts as $item) {
            $this->model->create([
                'media1_id' => $media1Id,
                'part' => $item['part'],
                'est_time' => $item['est_time'],
                'direction' => $item['direction'],
                'detail' => $item['detail'],
                'note' => $item['note'] ?? null,
            ]);
        }
    }

    /**
     * Export scripts for a media1_id.
     */
    public function export(int $media1Id): Collection
    {
        return $this->model->where('media1_id', $media1Id)
            ->get(['part', 'est_time', 'direction', 'detail', 'note']);
    }
}
<?php

namespace Modules\Script\src\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Script\src\Models\Script;

interface ScriptRepositoryInterface
{
    /**
     * Get all scripts for a given media1_id.
     *
     * @param int $media1Id
     * @return Collection
     */
    public function getByMedia1Id(int $media1Id): Collection;

    /**
     * Create a new script.
     *
     * @param array $data Script data (media1_id, part, est_time, direction, detail, note)
     * @return Script
     */
    public function create(array $data): Script;

    /**
     * Find a script by ID and media1_id.
     *
     * @param int $id
     * @param int $media1Id
     * @return Script|null
     */
    public function findById(int $id, int $media1Id): ?Script;

    /**
     * Update a script.
     *
     * @param int $id
     * @param int $media1Id
     * @param array $data Script data (part, est_time, direction, detail, note)
     * @return Script|null
     */
    public function update(int $id, int $media1Id, array $data): ?Script;

    /**
     * Delete a script.
     *
     * @param int $id
     * @param int $media1Id
     * @return bool
     */
    public function delete(int $id, int $media1Id): bool;

    /**
     * Import scripts, replacing existing ones for a media1_id.
     *
     * @param int $media1Id
     * @param array $scripts Array of script data
     * @return void
     */
    public function import(int $media1Id, array $scripts): void;

    /**
     * Export scripts for a media1_id.
     *
     * @param int $media1Id
     * @return Collection
     */
    public function export(int $media1Id): Collection;
}
<?php

namespace Modules\Media\src\Repositories;

use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Media\src\Models\Media;

interface MediaRepositoryInterface
{
    /**
     * Get a paginated list of media.
     *
     * @param int $perPage
     * @param int $page
     * @return LengthAwarePaginator
     */
    public function getPaginated(int $perPage, int $page): LengthAwarePaginator;

    /**
     * Create a new media record.
     *
     * @param array $data
     * @param UploadedFile|null $file
     * @param string $type
     * @return Media
     */
    public function create(array $data, ?UploadedFile $file, string $type): Media;

    /**
     * Find a media record by ID.
     *
     * @param int $id
     * @return Media
     */
    public function find(int $id): Media;

    /**
     * Update a media record.
     *
     * @param int $id
     * @param array $data
     * @param UploadedFile|null $file
     * @param string $type
     * @return Media
     */
    public function update(int $id, array $data, ?UploadedFile $file, string $type): Media;

    /**
     * Delete a media record.
     *
     * @param int $id
     * @return void
     */
    public function delete(int $id): void;

    /**
     * Update the status of a media record.
     *
     * @param int $id
     * @param string $status
     * @return void
     */
    public function updateStatus(int $id, string $status): void;
}
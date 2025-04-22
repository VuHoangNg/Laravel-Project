<?php

namespace Modules\Media\src\Repositories;

use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Media\src\Jobs\ProcessVideoToHls;
use Modules\Media\src\Models\Media;

class MediaRepository implements MediaRepositoryInterface
{
    /**
     * Get a paginated list of media.
     *
     * @param int $perPage
     * @param int $page
     * @return LengthAwarePaginator
     */
    public function getPaginated(int $perPage, int $page): LengthAwarePaginator
    {
        $perPage = min(max($perPage, 1), 100);
        return Media::paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Create a new media record.
     *
     * @param array $data
     * @param UploadedFile|null $file
     * @param string $type
     * @return Media
     */
    public function create(array $data, ?UploadedFile $file, string $type): Media
    {
        $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
        $path = 'media/' . $type . 's/' . $filename;
        $thumbnailPath = null;

        if ($type === 'video') {
            $hlsPath = 'media/videos/' . Str::random(40) . '/playlist.m3u8';
            $thumbnailPath = 'media/thumbnails/' . Str::random(40) . '.jpg';
            $path = $hlsPath;
        }

        // Create media record
        $media = Media::create([
            'title' => $data['title'],
            'type' => $type,
            'path' => $path,
            'thumbnail_path' => $thumbnailPath,
            'status' => $type === 'video' ? 'pending' : 'completed',
        ]);

        if ($type === 'video') {
            // Store original video temporarily
            $tempPath = $file->storeAs('temp', $filename, 'local');

            // Dispatch job with Media ID and thumbnail path
            ProcessVideoToHls::dispatch(
                storage_path('app/' . $tempPath),
                storage_path('app/public/' . dirname($path)),
                $media->id,
                storage_path('app/public/' . $thumbnailPath)
            )->afterCommit();
        } else {
            // Store image
            $file->storeAs('public', $path);
        }

        return $media;
    }

    /**
     * Find a media record by ID.
     *
     * @param int $id
     * @return Media
     */
    public function find(int $id): Media
    {
        return Media::findOrFail($id);
    }

    /**
     * Update a media record.
     *
     * @param int $id
     * @param array $data
     * @param UploadedFile|null $file
     * @param string $type
     * @return Media
     */
    public function update(int $id, array $data, ?UploadedFile $file, string $type): Media
    {
        $media = Media::findOrFail($id);

        $updateData = [
            'title' => $data['title'],
            'type' => $type,
            'status' => $type === 'video' ? 'pending' : 'completed',
        ];

        if ($file) {
            // Delete old file
            Storage::disk('public')->delete($media->path);
            if ($media->type === 'video') {
                Storage::disk('public')->deleteDirectory(dirname($media->path));
                if ($media->thumbnail_path) {
                    Storage::disk('public')->delete($media->thumbnail_path);
                }
            }

            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
            $path = 'media/' . $type . 's/' . $filename;
            $thumbnailPath = null;

            if ($type === 'video') {
                $tempPath = $file->storeAs('temp', $filename, 'local');
                $hlsPath = 'media/videos/' . Str::random(40) . '/playlist.m3u8';
                $thumbnailPath = 'media/thumbnails/' . Str::random(40) . '.jpg';

                // Dispatch job with Media ID and thumbnail path
                ProcessVideoToHls::dispatch(
                    storage_path('app/' . $tempPath),
                    storage_path('app/public/' . dirname($hlsPath)),
                    $media->id,
                    storage_path('app/public/' . $thumbnailPath)
                )->afterCommit();

                $path = $hlsPath;
            } else {
                $file->storeAs('public', $path);
            }

            $updateData['path'] = $path;
            $updateData['thumbnail_path'] = $thumbnailPath;
        }

        $media->update($updateData);

        return $media;
    }

    /**
     * Delete a media record.
     *
     * @param int $id
     * @return void
     */
    public function delete(int $id): void
    {
        $media = Media::findOrFail($id);

        // Delete the file
        Storage::disk('public')->delete($media->path);
        if ($media->type === 'video') {
            Storage::disk('public')->deleteDirectory(dirname($media->path));
            if ($media->thumbnail_path) {
                Storage::disk('public')->delete($media->thumbnail_path);
            }
        }

        $media->delete();
    }

    /**
     * Update the status of a media record.
     *
     * @param int $id
     * @param string $status
     * @return void
     */
    public function updateStatus(int $id, string $status): void
    {
        $media = Media::findOrFail($id);
        $media->update(['status' => $status]);
    }
}
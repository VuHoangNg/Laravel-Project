<?php

namespace Modules\Blog\src\Imports;

use Modules\Blog\src\Models\Report;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Illuminate\Support\Facades\Log;

class ReportsImport implements ToModel, WithHeadingRow, WithValidation
{
    protected $blogId;

    public function __construct($blogId)
    {
        $this->blogId = (int) $blogId;
    }

    public function model(array $row)
    {
        Log::info('Importing row for blog_id ' . $this->blogId . ': ', $row);

        return new Report([
            'campaign_id' => (int) ($row['campaign_id'] ?? 0),
            'date' => $row['date'] ?? null,
            'influencer_id' => (int) ($row['influencer_id'] ?? 0),
            'post_id' => $this->blogId,
            'activity' => $row['activity'] ?? 'Short Video || ',
            'comments' => (int) ($row['comments'] ?? 0),
            'items_sold' => (int) ($row['items_sold'] ?? 0),
            'likes' => (int) ($row['likes'] ?? 0),
            'platform_id' => (int) ($row['platform_id'] ?? 0),
            'saves' => (int) ($row['saves'] ?? 0),
            'shares' => (int) ($row['shares'] ?? 0),
            'views' => (int) ($row['views'] ?? 0),
            'watched_full_video' => (float) ($row['watched_full_video'] ?? 0),
        ]);
    }

    public function rules(): array
    {
        return [
            'campaign_id' => 'required|integer',
            'date' => 'required|date_format:Y-m-d',
            'influencer_id' => 'required|integer',
            'activity' => 'required|string',
            'comments' => 'required|integer|min:0',
            'items_sold' => 'required|integer|min:0',
            'likes' => 'required|integer|min:0',
            'platform_id' => 'required|integer',
            'saves' => 'required|integer|min:0',
            'shares' => 'required|integer|min:0',
            'views' => 'required|integer|min:0',
            'watched_full_video' => 'nullable|numeric|min:0|max:100',
        ];
    }

    public function customValidationAttributes()
    {
        return [
            'watched_full_video' => 'WATCHED_FULL_VIDEO_(%)',
        ];
    }

    public function batchSize(): int
    {
        return 1000;
    }

    public function chunkSize(): int
    {
        return 1000;
    }
}
<?php

namespace Modules\Blog\src\Exports;

use Modules\Blog\src\Models\Report;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class ReportsExport implements FromCollection, WithHeadings, WithMapping, WithColumnFormatting
{
    protected $blogId;

    public function __construct($blogId)
    {
        $this->blogId = (int) $blogId;
    }

    public function collection()
    {
        return Report::where('post_id', $this->blogId)->get();
    }

    public function headings(): array
    {
        return [
            'CAMPAIGN_ID',
            'DATE',
            'INFLUENCER_ID',
            'POST_ID',
            'ACTIVITY',
            'AVG_WATCH_TIME(S)',
            'COMMENTS',
            'ITEMS_SOLD',
            'LIKES',
            'PLATFORM_ID',
            'SAVES',
            'SHARES',
            'VIEWS',
            'WATCHED_FULL_VIDEO (%)',
        ];
    }

    public function map($report): array
    {
        return [
            $this->safeInt($report->campaign_id),
            $report->date ? \Carbon\Carbon::parse($report->date)->format('Y-m-d') : '1970-01-01',
            $this->safeInt($report->influencer_id),
            $this->safeInt($report->post_id),
            $report->activity ?? 'Unknown',
            $this->safeFloat($report->avg_watch_time),
            $this->safeInt($report->comments),
            $this->safeInt($report->items_sold),
            $this->safeInt($report->likes),
            $this->safeInt($report->platform_id),
            $this->safeInt($report->saves),
            $this->safeInt($report->shares),
            $this->safeInt($report->views),
            $this->safeFloat($report->watched_full_video),
        ];
    }



    public function columnFormats(): array
    {
        return [
            'B' => NumberFormat::FORMAT_DATE_YYYYMMDD2, // Ensure date is shown as 2024-04-25 format
        ];
    }

    private function safeInt($value): string
    {
        return is_numeric($value) ? (string)(int)$value : '0';
    }

    private function safeFloat($value): string
    {
        return is_numeric($value) ? number_format((float)$value, 2, '.', '') : '0.00';
    }
}

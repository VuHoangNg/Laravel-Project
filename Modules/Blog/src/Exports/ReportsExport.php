<?php

namespace Modules\Blog\src\Exports;

use Modules\Blog\src\Models\Report;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use Carbon\Carbon;

class ReportsExport implements FromCollection, WithHeadings, WithMapping, WithColumnFormatting
{
    protected $blogId;
    protected $nearestAvgWatchTime;

    public function __construct($blogId)
    {
        $this->blogId = (int) $blogId;
        $this->nearestAvgWatchTime = $this->calculateNearestAvgWatchTime();
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
            'WATCHED_FULL_VIDEO_(%)',
        ];
    }

    public function map($report): array
    {
        return [
            $this->safeInt($report->campaign_id),
            $report->date ? Carbon::parse($report->date)->format('Y-m-d') : '1970-01-01',
            $this->safeInt($report->influencer_id),
            $this->safeInt($report->post_id),
            $report->activity ?? 'Unknown',
            $this->safeFloat($this->nearestAvgWatchTime), // Use nearest day's calculated value for all rows
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
            'B' => NumberFormat::FORMAT_DATE_YYYYMMDD2, // DATE column (Y-m-d)
            'F' => NumberFormat::FORMAT_NUMBER_00, // AVG_WATCH_TIME(S) (2 decimal places)
            'N' => NumberFormat::FORMAT_NUMBER_00, // WATCHED_FULL_VIDEO (%) (2 decimal places)
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

    private function calculateNearestAvgWatchTime(): float
    {
        $currentDate = Carbon::today()->toDateString(); // 2025-05-21
        $reports = Report::where('post_id', $this->blogId)->get();

        $nearestReport = null;
        $minDateDiff = PHP_INT_MAX;

        // Find the nearest day's report
        foreach ($reports as $report) {
            if ($report->date) {
                $reportDate = Carbon::parse($report->date);
                $dateDiff = abs(strtotime($currentDate) - $reportDate->timestamp);
                if ($dateDiff < $minDateDiff) {
                    $minDateDiff = $dateDiff;
                    $nearestReport = $report;
                }
            }
        }

        // Calculate avg_watch_time for the nearest day's data
        if ($nearestReport) {
            $likes = (int) ($nearestReport->likes ?? 0);
            $comments = (int) ($nearestReport->comments ?? 0);
            $shares = (int) ($nearestReport->shares ?? 0);
            $saves = (int) ($nearestReport->saves ?? 0);
            $views = (int) ($nearestReport->views ?? 0);
            return $views > 0 ? ($likes + $comments + $shares + $saves) / $views : 0;
        }

        return 0; // Default if no reports exist
    }
}
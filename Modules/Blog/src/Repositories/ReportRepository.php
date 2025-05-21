<?php

namespace Modules\Blog\src\Repositories;

use Modules\Blog\src\Models\Report;
use Modules\Blog\src\Models\Blog;
use Modules\Blog\src\Imports\ReportsImport;
use Modules\Blog\src\Exports\ReportsExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;
use MongoDB\Driver\Session;
use Exception;

class ReportRepository implements ReportRepositoryInterface
{
    /**
     * Retrieve report data for a specific blog ID.
     *
     * @param int $blogId
     * @return array
     */
    public function getReportData(int $blogId): array
    {
        $blog = Blog::find($blogId);
        if (!$blog) {
            throw new Exception('Blog not found', 404);
        }

        $reports = Report::raw(function ($collection) use ($blogId) {
            return $collection->aggregate([
                [
                    '$match' => [
                        'post_id' => $blogId,
                        'date' => ['$ne' => null]
                    ]
                ],
                [
                    '$project' => [
                        'date' => 1,
                        'comments' => 1,
                        'likes' => 1,
                        'saves' => 1,
                        'shares' => 1,
                        'views' => 1,
                        'watched_full_video' => 1,
                        'post_id' => 1
                    ]
                ]
            ]);
        });

        // Convert reports to array for logging without map
        $logReports = [];
        foreach ($reports->toArray() as $report) {
            $logReports[] = json_decode(json_encode($report), true);
        }
        Log::info('Raw Reports from rp.reports for blog_id ' . $blogId . ': ', $logReports);

        // Find nearest report to current date
        $currentDate = Carbon::now()->toDateString();
        $nearestReport = null;
        $minDateDiff = PHP_INT_MAX;

        foreach ($reports as $report) {
            $reportDate = new Carbon($report->date);
            $dateDiff = abs(strtotime($currentDate) - $reportDate->timestamp);
            if ($dateDiff < $minDateDiff) {
                $minDateDiff = $dateDiff;
                $nearestReport = $report;
            }
        }

        // Calculate avgWatchTime
        $likes = $nearestReport ? (int) ($nearestReport->likes ?? 0) : 0;
        $comments = $nearestReport ? (int) ($nearestReport->comments ?? 0) : 0;
        $shares = $nearestReport ? (int) ($nearestReport->shares ?? 0) : 0;
        $saves = $nearestReport ? (int) ($nearestReport->saves ?? 0) : 0;
        $views = $nearestReport ? (int) ($nearestReport->views ?? 0) : 0;
        $avgWatchTime = $views > 0 ? ($likes + $comments + $shares + $saves) / $views : 0;

        // Prepare chart data without map
        $dates = [];
        $likesData = [];
        $viewsData = [];
        foreach ($reports as $report) {
            $dates[] = Carbon::parse($report->date)->format('Y-m-d');
            $likesData[] = $report->likes ?? 0;
            $viewsData[] = $report->views ?? 0;
        }

        $data = [
            'avgWatchTime' => $avgWatchTime,
            'comments' => $nearestReport ? ($nearestReport->comments ?? 0) : 0,
            'likes' => $nearestReport ? ($nearestReport->likes ?? 0) : 0,
            'saves' => $nearestReport ? ($nearestReport->saves ?? 0) : 0,
            'shares' => $nearestReport ? ($nearestReport->shares ?? 0) : 0,
            'views' => $nearestReport ? ($nearestReport->views ?? 0) : 0,
            'watchedFullVideo' => $nearestReport ? ($nearestReport->watched_full_video ?? 0) : 0,
            'chartData' => [
                'dates' => $dates,
                'likes' => $likesData,
                'views' => $viewsData,
            ],
            'nearestDate' => $nearestReport ? Carbon::parse($nearestReport->date)->format('Y-m-d') : null
        ];

        Log::info('Report Data from rp database for blog_id ' . $blogId . ' (nearest to ' . $currentDate . '): ', $data);
        return $data;
    }

    /**
     * Import reports from an uploaded file for a specific blog ID.
     *
     * @param int $blogId
     * @param Request $request
     * @return array
     */
    public function importReports(int $blogId, Request $request): array
    {
        $blog = Blog::find($blogId);
        if (!$blog) {
            return ['error' => 'Blog not found', 'status' => 404];
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,xls,xlsx|max:2048',
        ]);

        $file = $request->file('file');

        try {
            $connection = DB::connection('mongodb');
            $mongoClient = $connection->getMongoClient();
            $session = $mongoClient->startSession();

            $session->startTransaction();

            try {
                Report::raw(function ($collection) use ($blogId, $session) {
                    $collection->deleteMany(
                        ['post_id' => $blogId],
                        ['session' => $session]
                    );
                });

                Excel::import(new ReportsImport($blogId), $file, null, \Maatwebsite\Excel\Excel::XLSX);

                $session->commitTransaction();
                Log::info('Reports imported successfully for blog_id ' . $blogId . ', old data replaced');
                return ['message' => 'Reports imported successfully, old data replaced', 'status' => 200];
            } catch (Exception $e) {
                $session->abortTransaction();
                throw $e;
            } finally {
                $session->endSession();
            }
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            $errors = [];
            foreach ($failures as $failure) {
                $errors[] = [
                    'row' => $failure->row(),
                    'attribute' => $failure->attribute(),
                    'errors' => $failure->errors(),
                    'values' => $failure->values(),
                ];
            }
            Log::error('Import validation failed for blog_id ' . $blogId . ': ', $errors);
            return ['error' => 'Import failed due to validation errors', 'details' => $errors, 'status' => 400];
        } catch (Exception $e) {
            Log::error('Import failed for blog_id ' . $blogId . ': ' . $e->getMessage());
            return ['error' => 'Import failed: ' . $e->getMessage(), 'status' => 400];
        }
    }

    /**
     * Export reports for a specific blog ID as an Excel file.
     *
     * @param int $blogId
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function exportReports(int $blogId)
    {
        $blog = Blog::find($blogId);
        if (!$blog) {
            throw new Exception('Blog not found', 404);
        }

        return Excel::download(new ReportsExport($blogId), 'reports-' . $blogId . '.xlsx', \Maatwebsite\Excel\Excel::XLSX);
    }
}
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
     * Retrieve report data for a specific blog ID, with separate date ranges for likes and views charts.
     *
     * @param int $blogId
     * @param string|null $likesDateFrom
     * @param string|null $likesDateTo
     * @param string|null $viewsDateFrom
     * @param string|null $viewsDateTo
     * @return array
     */
    public function getReportData(
        int $blogId,
        ?string $likesDateFrom = null,
        ?string $likesDateTo = null,
        ?string $viewsDateFrom = null,
        ?string $viewsDateTo = null
    ): array {
        $blog = Blog::find($blogId);
        if (!$blog) {
            throw new Exception('Blog not found', 404);
        }

        // Build MongoDB match query for all reports
        $baseMatchQuery = [
            'post_id' => $blogId,
            'date' => ['$ne' => null]
        ];

        // Match query for likes chart
        $likesMatchQuery = $baseMatchQuery;
        if ($likesDateFrom && $likesDateTo) {
            $likesMatchQuery['date'] = [
                '$gte' => $likesDateFrom,
                '$lte' => $likesDateTo
            ];
        }

        // Match query for views chart
        $viewsMatchQuery = $baseMatchQuery;
        if ($viewsDateFrom && $viewsDateTo) {
            $viewsMatchQuery['date'] = [
                '$gte' => $viewsDateFrom,
                '$lte' => $viewsDateTo
            ];
        }

        // Match query for statistics (intersection of both ranges)
        $statsMatchQuery = $baseMatchQuery;
        if ($likesDateFrom && $likesDateTo && $viewsDateFrom && $viewsDateTo) {
            // Use the most restrictive range (latest start, earliest end)
            $statsMatchQuery['date'] = [
                '$gte' => max($likesDateFrom, $viewsDateFrom),
                '$lte' => min($likesDateTo, $viewsDateTo)
            ];
        } elseif ($likesDateFrom && $likesDateTo) {
            $statsMatchQuery['date'] = [
                '$gte' => $likesDateFrom,
                '$lte' => $likesDateTo
            ];
        } elseif ($viewsDateFrom && $viewsDateTo) {
            $statsMatchQuery['date'] = [
                '$gte' => $viewsDateFrom,
                '$lte' => $viewsDateTo
            ];
        }

        // Fetch reports for likes chart
        $likesReports = Report::raw(function ($collection) use ($likesMatchQuery) {
            return $collection->aggregate([
                ['$match' => $likesMatchQuery],
                ['$project' => ['date' => 1, 'likes' => 1]]
            ]);
        });

        // Fetch reports for views chart
        $viewsReports = Report::raw(function ($collection) use ($viewsMatchQuery) {
            return $collection->aggregate([
                ['$match' => $viewsMatchQuery],
                ['$project' => ['date' => 1, 'views' => 1]]
            ]);
        });

        // Fetch reports for statistics
        $statsReports = Report::raw(function ($collection) use ($statsMatchQuery) {
            return $collection->aggregate([
                [
                    '$match' => $statsMatchQuery
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

        // Find nearest report for statistics
        $currentDate = Carbon::today('Asia/Bangkok')->toDateString();
        $nearestReport = null;
        $minDateDiff = PHP_INT_MAX;

        foreach ($statsReports as $report) {
            $reportDate = $report->date;
            $dateDiff = abs(strtotime($currentDate) - strtotime($reportDate));
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

        // Prepare chart data for likes
        $likesDates = [];
        $likesData = [];
        foreach ($likesReports as $report) {
            $likesDates[] = Carbon::parse($report->date)->format('Y-m-d');
            $likesData[] = $report->likes ?? 0;
        }

        // Prepare chart data for views
        $viewsDates = [];
        $viewsData = [];
        foreach ($viewsReports as $report) {
            $viewsDates[] = Carbon::parse($report->date)->format('Y-m-d');
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
                'likes' => [
                    'dates' => $likesDates,
                    'data' => $likesData
                ],
                'views' => [
                    'dates' => $viewsDates,
                    'data' => $viewsData
                ]
            ],
            'likesDateFrom' => $likesDateFrom,
            'likesDateTo' => $likesDateTo,
            'viewsDateFrom' => $viewsDateFrom,
            'viewsDateTo' => $viewsDateTo,
            'nearestDate' => $nearestReport ? Carbon::parse($nearestReport->date)->format('Y-m-d') : null
        ];

        Log::info("Report Data for blog_id {$blogId} (likesDateFrom: {$likesDateFrom}, likesDateTo: {$likesDateTo}, viewsDateFrom: {$viewsDateFrom}, viewsDateTo: {$viewsDateTo}, nearestDate: {$data['nearestDate']}): ", $data);
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
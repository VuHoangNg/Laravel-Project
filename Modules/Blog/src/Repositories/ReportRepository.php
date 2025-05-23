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
use Exception;

class ReportRepository implements ReportRepositoryInterface
{
    /**
     * Retrieve statistics data for a specific blog ID, based on the nearest date.
     *
     * @param int $blogId
     * @return array
     */
    public function getStatisticsData(int $blogId): array
    {
        $blog = Blog::find($blogId);
        if (!$blog) {
            throw new Exception('Blog not found', 404);
        }

        // Build MongoDB match query for all reports
        $matchQuery = [
            'post_id' => $blogId,
            'date' => ['$ne' => null]
        ];

        // Fetch reports for statistics
        $statsReports = Report::raw(function ($collection) use ($matchQuery) {
            return $collection->aggregate([
                ['$match' => $matchQuery],
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

        return [
            'avgWatchTime' => $avgWatchTime,
            'comments' => $nearestReport ? ($nearestReport->comments ?? 0) : 0,
            'likes' => $nearestReport ? ($nearestReport->likes ?? 0) : 0,
            'saves' => $nearestReport ? ($nearestReport->saves ?? 0) : 0,
            'shares' => $nearestReport ? ($nearestReport->shares ?? 0) : 0,
            'views' => $nearestReport ? ($nearestReport->views ?? 0) : 0,
            'watchedFullVideo' => $nearestReport ? ($nearestReport->watched_full_video ?? 0) : 0,
            'nearestDate' => $nearestReport ? Carbon::parse($nearestReport->date)->format('Y-m-d') : null
        ];
    }

    /**
     * Retrieve likes chart data for a specific blog ID with optional date range.
     *
     * @param int $blogId
     * @param string|null $likesDateFrom
     * @param string|null $likesDateTo
     * @return array
     */
    public function getLikesChartData(
        int $blogId,
        ?string $likesDateFrom = null,
        ?string $likesDateTo = null
    ): array {
        $blog = Blog::find($blogId);
        if (!$blog) {
            throw new Exception('Blog not found', 404);
        }

        // Build MongoDB match query
        $matchQuery = [
            'post_id' => $blogId,
            'date' => ['$ne' => null]
        ];
        if ($likesDateFrom && $likesDateTo) {
            $matchQuery['date'] = [
                '$gte' => $likesDateFrom,
                '$lte' => $likesDateTo
            ];
        }

        // Fetch reports for likes chart
        $likesReports = Report::raw(function ($collection) use ($matchQuery) {
            return $collection->aggregate([
                ['$match' => $matchQuery],
                ['$project' => ['date' => 1, 'likes' => 1]]
            ]);
        });

        // Prepare chart data for likes
        $likesDates = [];
        $likesData = [];
        foreach ($likesReports as $report) {
            $likesDates[] = Carbon::parse($report->date)->format('Y-m-d');
            $likesData[] = $report->likes ?? 0;
        }

        return [
            'likes' => [
                'dates' => $likesDates,
                'data' => $likesData
            ],
            'likesDateFrom' => $likesDateFrom,
            'likesDateTo' => $likesDateTo
        ];
    }

    /**
     * Retrieve views chart data for a specific blog ID with optional date range.
     *
     * @param int $blogId
     * @param string|null $viewsDateFrom
     * @param string|null $viewsDateTo
     * @return array
     */
    public function getViewsChartData(
        int $blogId,
        ?string $viewsDateFrom = null,
        ?string $viewsDateTo = null
    ): array {
        $blog = Blog::find($blogId);
        if (!$blog) {
            throw new Exception('Blog not found', 404);
        }

        // Build MongoDB match query
        $matchQuery = [
            'post_id' => $blogId,
            'date' => ['$ne' => null]
        ];
        if ($viewsDateFrom && $viewsDateTo) {
            $matchQuery['date'] = [
                '$gte' => $viewsDateFrom,
                '$lte' => $viewsDateTo
            ];
        }

        // Fetch reports for views chart
        $viewsReports = Report::raw(function ($collection) use ($matchQuery) {
            return $collection->aggregate([
                ['$match' => $matchQuery],
                ['$project' => ['date' => 1, 'views' => 1]]
            ]);
        });

        // Prepare chart data for views
        $viewsDates = [];
        $viewsData = [];
        foreach ($viewsReports as $report) {
            $viewsDates[] = Carbon::parse($report->date)->format('Y-m-d');
            $viewsData[] = $report->views ?? 0;
        }

        return [
            'views' => [
                'dates' => $viewsDates,
                'data' => $viewsData
            ],
            'viewsDateFrom' => $viewsDateFrom,
            'viewsDateTo' => $viewsDateTo
        ];
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
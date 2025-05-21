<?php

namespace Modules\Blog\src\Controllers;

use App\Http\Controllers\Controller;
use Modules\Blog\src\Models\Report;
use Modules\Blog\src\Models\Blog;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Blog\src\Imports\ReportsImport;
use Modules\Blog\src\Exports\ReportsExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Jenssegers\Mongodb\Connection;
use MongoDB\Driver\Session;

class ReportController extends Controller
{
    public function index($blogId)
    {
        $blog = Blog::find($blogId);
        if (!$blog) {
            return response()->json(['error' => 'Blog not found'], 404);
        }

        $blogId = (int) $blogId;

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

        // Convert BSONDocument objects to plain arrays for logging
        $logReports = array_map(function ($report) {
            return json_decode(json_encode($report), true);
        }, $reports->toArray());
        \Log::info('Raw Reports from rp.reports for blog_id ' . $blogId . ': ', $logReports);

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

        // Calculate avgWatchTime using (likes + comments + shares + saves) / views for nearest report
        $likes = $nearestReport ? (int) ($nearestReport->likes ?? 0) : 0;
        $comments = $nearestReport ? (int) ($nearestReport->comments ?? 0) : 0;
        $shares = $nearestReport ? (int) ($nearestReport->shares ?? 0) : 0;
        $saves = $nearestReport ? (int) ($nearestReport->saves ?? 0) : 0;
        $views = $nearestReport ? (int) ($nearestReport->views ?? 0) : 0;
        $avgWatchTime = $views > 0 ? ($likes + $comments + $shares + $saves) / $views : 0;

        $data = [
            'avgWatchTime' => $avgWatchTime,
            'comments' => $nearestReport ? ($nearestReport->comments ?? 0) : 0,
            'likes' => $nearestReport ? ($nearestReport->likes ?? 0) : 0,
            'saves' => $nearestReport ? ($nearestReport->saves ?? 0) : 0,
            'shares' => $nearestReport ? ($nearestReport->shares ?? 0) : 0,
            'views' => $nearestReport ? ($nearestReport->views ?? 0) : 0,
            'watchedFullVideo' => $nearestReport ? (float) ($nearestReport->watched_full_video ?? 0) : 0,
            'chartData' => [
                'dates' => $reports->pluck('date')->map(function ($date) {
                    return Carbon::parse($date)->format('Y-m-d');
                })->all(),
                'likes' => $reports->pluck('likes')->all(),
                'views' => $reports->pluck('views')->all(),
            ],
            'nearestDate' => $nearestReport ? Carbon::parse($nearestReport->date)->format('Y-m-d') : null
        ];

        \Log::info('Report Data from rp database for blog_id ' . $blogId . ' (nearest to ' . $currentDate . '): ', $data);
        return response()->json($data);
    }

    public function import($blogId, Request $request)
    {
        $blog = Blog::find($blogId);
        if (!$blog) {
            return response()->json(['error' => 'Blog not found'], 404);
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
                        ['post_id' => (int) $blogId],
                        ['session' => $session]
                    );
                });

                Excel::import(new ReportsImport((int) $blogId), $file, null, \Maatwebsite\Excel\Excel::XLSX);

                $session->commitTransaction();
                \Log::info('Reports imported successfully for blog_id ' . $blogId . ', old data replaced');
                return response()->json(['message' => 'Reports imported successfully, old data replaced'], 200);
            } catch (\Exception $e) {
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
            \Log::error('Import validation failed for blog_id ' . $blogId . ': ', $errors);
            return response()->json(['error' => 'Import failed due to validation errors', 'details' => $errors], 400);
        } catch (\Exception $e) {
            \Log::error('Import failed for blog_id ' . $blogId . ': ' . $e->getMessage());
            return response()->json(['error' => 'Import failed: ' . $e->getMessage()], 400);
        }
    }

    public function export($blogId)
    {
        $blog = Blog::find($blogId);
        if (!$blog) {
            return response()->json(['error' => 'Blog not found'], 404);
        }

        return Excel::download(new ReportsExport($blogId), 'reports-' . $blogId . '.xlsx', \Maatwebsite\Excel\Excel::XLSX);
    }
}
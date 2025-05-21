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

class ReportController extends Controller
{
    public function index($blogId)
    {
        // Validate that the blog_id exists in the MySQL blogs table
        $blog = Blog::find($blogId);
        if (!$blog) {
            return response()->json(['error' => 'Blog not found'], 404);
        }

        // Convert blogId to integer for MongoDB query
        $blogId = (int) $blogId;

        // Use raw MongoDB aggregation to select fields
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
                        'watchedFullVideo' => 1,
                        'post_id' => 1
                    ]
                ]
            ]);
        });
        \Log::info('Raw Reports from rp.reports for blog_id ' . $blogId . ': ', $reports->toArray());

        // Initialize totals
        $totalLikes = 0;
        $totalComments = 0;
        $totalShares = 0;
        $totalSaves = 0;
        $totalViews = 0;

        // Sum the fields across all reports
        foreach ($reports as $report) {
            $totalLikes += (int) ($report->likes ?? 0);
            $totalComments += (int) ($report->comments ?? 0);
            $totalShares += (int) ($report->shares ?? 0);
            $totalSaves += (int) ($report->saves ?? 0);
            $totalViews += (int) ($report->views ?? 0);
        }

        // Compute avgWatchTime as (total_likes + total_comments + total_shares + total_saves) / total_views
        $avgWatchTime = $totalViews > 0 ? ($totalLikes + $totalComments + $totalShares + $totalSaves) / $totalViews : 0;

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

        $data = [
            'avgWatchTime' => $avgWatchTime,
            'comments' => $nearestReport ? ($nearestReport->comments ?? 0) : 0,
            'likes' => $nearestReport ? ($nearestReport->likes ?? 0) : 0,
            'saves' => $nearestReport ? ($nearestReport->saves ?? 0) : 0,
            'shares' => $nearestReport ? ($nearestReport->shares ?? 0) : 0,
            'views' => $nearestReport ? ($nearestReport->views ?? 0) : 0,
            'watchedFullVideo' => $nearestReport ? ($nearestReport->watchedFullVideo ?? 0) : 0,
            'chartData' => [
                'dates' => $reports->pluck('date')->all(),
                'likes' => $reports->pluck('likes')->all(),
                'views' => $reports->pluck('views')->all(),
            ],
            'nearestDate' => $nearestReport ? $nearestReport->date : null
        ];

        \Log::info('Report Data from rp database for blog_id ' . $blogId . ' (nearest to ' . $currentDate . '): ', $data);
        return response()->json($data);
    }

    public function import($blogId, Request $request)
    {
        // Validate that the blog_id exists in the MySQL blogs table
        $blog = Blog::find($blogId);
        if (!$blog) {
            return response()->json(['error' => 'Blog not found'], 404);
        }

        // Validate the uploaded file
        $request->validate([
            'file' => 'required|file|mimes:csv,xls,xlsx|max:2048',
        ]);

        $file = $request->file('file');

        try {
            Excel::import(new ReportsImport($blogId), $file);
            return response()->json(['message' => 'Reports imported successfully'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Import failed: ' . $e->getMessage()], 400);
        }
    }

    public function export($blogId)
    {
        // Validate that the blog_id exists in the MySQL blogs table
        $blog = Blog::find($blogId);
        if (!$blog) {
            return response()->json(['error' => 'Blog not found'], 404);
        }

        return Excel::download(new ReportsExport($blogId), 'reports-' . $blogId . '.xlsx', \Maatwebsite\Excel\Excel::XLSX);
    }
}
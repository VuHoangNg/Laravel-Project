<?php

namespace Modules\Core\src\Controllers;

use App\Http\Controllers\Controller;
use Modules\Core\src\Models\Report;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index()
    {
        $reports = Report::all();
        \Log::info('Raw Reports from rp.reports: ', $reports->toArray());

        $data = [
            'avgWatchTime' => 0, // Default to 0 since avg_watch_time is not in the data; consider adding logic if watch time data is available
            'comments' => $reports->sum('comments') ?? 0,
            'likes' => $reports->sum('likes') ?? 0,
            'saves' => $reports->sum('saves') ?? 0,
            'shares' => $reports->sum('shares') ?? 0,
            'views' => $reports->sum('views') ?? 0,
            'watchedFullVideo' => 0, // Default to 0 since watched_full_video is not in the data; consider adding logic if percentage data is available
            'chartData' => [
                'dates' => $reports->pluck('date')->map(function ($date) {
                    return $date ? $date->toDateString() : null;
                })->filter()->values()->all(),
                'likes' => $reports->pluck('likes')->all(),
                'views' => $reports->pluck('views')->all(),
            ]
        ];
        \Log::info('Report Data from rp database: ', $data);
        return response()->json($data);
    }
}

<?php

namespace Modules\Blog\src\Controllers;

use App\Http\Controllers\Controller;
use Modules\Blog\src\Repositories\ReportRepositoryInterface;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    protected $reportRepository;

    public function __construct(ReportRepositoryInterface $reportRepository)
    {
        $this->reportRepository = $reportRepository;
    }

    /**
     * Get statistics data for a specific blog, including nearest date metrics.
     */
    public function getStatistics(Request $request, $blogId)
    {
        try {
            $data = $this->reportRepository->getStatisticsData((int) $blogId);
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], $e->getCode() ?: 400);
        }
    }

    /**
     * Get likes chart data for a specific blog with optional date range.
     */
    public function getLikesChart(Request $request, $blogId)
    {
        try {
            $likesDateFrom = $request->query('likesDateFrom');
            $likesDateTo = $request->query('likesDateTo');
            $data = $this->reportRepository->getLikesChartData(
                (int) $blogId,
                $likesDateFrom,
                $likesDateTo
            );
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], $e->getCode() ?: 400);
        }
    }

    /**
     * Get views chart data for a specific blog with optional date range.
     */
    public function getViewsChart(Request $request, $blogId)
    {
        try {
            $viewsDateFrom = $request->query('viewsDateFrom');
            $viewsDateTo = $request->query('viewsDateTo');
            $data = $this->reportRepository->getViewsChartData(
                (int) $blogId,
                $viewsDateFrom,
                $viewsDateTo
            );
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], $e->getCode() ?: 400);
        }
    }

    public function import($blogId, Request $request)
    {
        $result = $this->reportRepository->importReports((int) $blogId, $request);
        return response()->json($result, $result['status']);
    }

    public function export($blogId)
    {
        try {
            return $this->reportRepository->exportReports((int) $blogId);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], $e->getCode() ?: 400);
        }
    }
}
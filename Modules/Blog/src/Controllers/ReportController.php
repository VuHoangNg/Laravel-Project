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

    public function index($blogId)
    {
        try {
            $data = $this->reportRepository->getReportData((int) $blogId);
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
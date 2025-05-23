<?php

namespace Modules\Blog\src\Repositories;

use Illuminate\Http\Request;

interface ReportRepositoryInterface
{
    public function getStatisticsData(int $blogId): array;
    public function getLikesChartData(
        int $blogId,
        ?string $likesDateFrom = null,
        ?string $likesDateTo = null
    ): array;
    public function getViewsChartData(
        int $blogId,
        ?string $viewsDateFrom = null,
        ?string $viewsDateTo = null
    ): array;
    public function importReports(int $blogId, Request $request): array;
    public function exportReports(int $blogId);
}
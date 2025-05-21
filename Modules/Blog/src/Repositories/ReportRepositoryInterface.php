<?php

namespace Modules\Blog\src\Repositories;

use Illuminate\Http\Request;
use Illuminate\Support\Collection;

interface ReportRepositoryInterface
{
    public function getReportData(int $blogId): array;
    public function importReports(int $blogId, Request $request): array;
    public function exportReports(int $blogId);
}
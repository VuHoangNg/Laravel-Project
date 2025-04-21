<?php

namespace Modules\Media\src\Repositories;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

interface MediaRepositoryInterface
{
    public function index(Request $request): JsonResponse;

    public function store(Request $request): JsonResponse;

    public function show(int $id): JsonResponse;

    public function update(Request $request, int $id): JsonResponse;

    public function destroy(int $id): JsonResponse;
}

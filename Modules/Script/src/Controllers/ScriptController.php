<?php

namespace Modules\Script\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Modules\Script\src\Repositories\ScriptRepositoryInterface;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Modules\Script\src\Resources\ScriptResource;
use Maatwebsite\Excel\Facades\Excel;

class ScriptController extends Controller
{
    protected $scriptRepository;

    public function __construct(ScriptRepositoryInterface $scriptRepository)
    {
        $this->scriptRepository = $scriptRepository;
        $this->middleware('auth:sanctum')->only([
            'create_script',
            'update_script',
            'destroy_script',
            'import_scripts',
            'export_scripts',
        ]);
    }

    public function get_scripts(Request $request, $media1_id): JsonResponse
    {
        try {
            $scripts = $this->scriptRepository->getByMedia1Id($media1_id);
            return response()->json(['data' => ScriptResource::collection($scripts)], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch scripts'], 500);
        }
    }

    public function create_script(Request $request, $media1_id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'media1_id' => 'required|exists:media1,id',
                'part' => 'required|string|max:255',
                'est_time' => 'required|string|max:10',
                'direction' => 'required|string',
                'detail' => 'required|string',
                'note' => 'nullable|string',
            ]);

            $script = $this->scriptRepository->create($validated);

            return response()->json(['data' => new ScriptResource($script), 'message' => 'Script created successfully'], 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Media1 not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create script'], 500);
        }
    }

    public function get_script_by_id($media1_id, $id): JsonResponse
    {
        try {
            $script = $this->scriptRepository->findById($id, $media1_id);
            if (!$script) {
                throw new ModelNotFoundException('Script not found');
            }
            return response()->json(['data' => new ScriptResource($script), 'message' => 'Script retrieved successfully'], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Script not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to retrieve script'], 500);
        }
    }

    public function update_script(Request $request, $media1_id, $id): JsonResponse
    {
        try {
            if ($request->method() === 'GET' && $request->query('edit')) {
                $script = $this->scriptRepository->findById($id, $media1_id);
                if (!$script) {
                    throw new ModelNotFoundException('Script not found');
                }
                return response()->json(['data' => new ScriptResource($script), 'message' => 'Script retrieved for editing'], 200);
            }

            if ($request->method() === 'PUT') {
                $validated = $request->validate([
                    'part' => 'required|string|max:255',
                    'est_time' => 'required|string|max:10',
                    'direction' => 'required|string',
                    'detail' => 'required|string',
                    'note' => 'nullable|string',
                ]);

                $script = $this->scriptRepository->update($id, $media1_id, $validated);
                if (!$script) {
                    throw new ModelNotFoundException('Script not found');
                }

                return response()->json(['data' => new ScriptResource($script), 'message' => 'Script updated successfully'], 200);
            }

            return response()->json(['message' => 'Invalid request method'], 400);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Script not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update script'], 500);
        }
    }

    public function destroy_script($media1_id, $id): JsonResponse
    {
        try {
            $success = $this->scriptRepository->delete($id, $media1_id);
            if (!$success) {
                throw new ModelNotFoundException('Script not found');
            }
            return response()->json(['message' => 'Script deleted successfully'], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Script not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete script'], 500);
        }
    }

    public function import_scripts(Request $request, $media1_id): JsonResponse
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:xlsx,csv|max:2048', // Max 2MB
            ]);

            $file = $request->file('file');

            $this->scriptRepository->import($media1_id, $file);

            return response()->json(['message' => 'Scripts imported successfully'], 200);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Media1 not found'], 404);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Import scripts failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to import scripts: ' . $e->getMessage()], 500);
        }
    }

    public function export_scripts($media1_id)
    {
        try {
            $export = $this->scriptRepository->export($media1_id);
            $date = now()->format('Y-m-d');
            return Excel::download($export, "scripts_{$date}.xlsx");
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to export scripts'], 500);
        }
    }
}
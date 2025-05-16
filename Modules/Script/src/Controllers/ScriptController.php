<?php

namespace Modules\Script\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Modules\Script\src\Models\Script;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Modules\Script\src\Resources\ScriptResource;

class ScriptController extends Controller
{
    public function __construct()
    {
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
            $scripts = Script::where('media1_id', $media1_id)->get();
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

            $script = Script::create($validated);

            return response()->json(['data' => new ScriptResource($script), 'message' => 'Script created successfully'], 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create script'], 500);
        }
    }

    public function get_script_by_id($media1_id, $id): JsonResponse
    {
        try {
            $script = Script::where('media1_id', $media1_id)->findOrFail($id);
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
            $script = Script::where('media1_id', $media1_id)->findOrFail($id);

            if ($request->method() === 'GET' && $request->query('edit')) {
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

                $script->update($validated);

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
            $script = Script::where('media1_id', $media1_id)->findOrFail($id);
            $script->delete();
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
            $data = $request->json()->all();

            if (!is_array($data) || empty($data)) {
                return response()->json(['message' => 'No scripts provided for import'], 422);
            }

            // Delete all existing scripts for the given media1_id
            Script::where('media1_id', $media1_id)->delete();

            foreach ($data as $index => $item) {
                // Ensure media1_id is included in the item, overriding any provided value
                $item['media1_id'] = $media1_id;

                // Validate each item
                $validator = \Illuminate\Support\Facades\Validator::make($item, [
                    'media1_id' => 'required|exists:media1,id',
                    'part' => 'required|string|max:255',
                    'est_time' => 'required|string|max:10',
                    'direction' => 'required|string',
                    'detail' => 'required|string',
                    'note' => 'nullable|string',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'message' => 'Validation failed for script at index ' . $index,
                        'errors' => $validator->errors(),
                    ], 422);
                }

                // Create a new script
                Script::create([
                    'media1_id' => $item['media1_id'],
                    'part' => $item['part'],
                    'est_time' => $item['est_time'],
                    'direction' => $item['direction'],
                    'detail' => $item['detail'],
                    'note' => $item['note'] ?? null,
                ]);
            }

            return response()->json(['message' => 'Scripts imported successfully'], 200);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Import scripts failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to import scripts: ' . $e->getMessage()], 500);
        }
    }

    public function export_scripts($media1_id): JsonResponse
    {
        try {
            $scripts = Script::where('media1_id', $media1_id)->get(['part', 'est_time', 'direction', 'detail', 'note']);
            return response()->json(['data' => $scripts], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to export scripts'], 500);
        }
    }
}
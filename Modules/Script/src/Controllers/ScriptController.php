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
        ]);
    }

    /**
     * Display a listing of the resource for a specific media1_id.
     * @param Request $request
     * @param int $media1_id
     * @return JsonResponse
     */
    public function get_scripts(Request $request, $media1_id): JsonResponse
    {
        try {
            $scripts = Script::where('media1_id', $media1_id)->get();
            return response()->json([
                'data' => ScriptResource::collection($scripts),
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch scripts'], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     * @param Request $request
     * @param int $media1_id
     * @return JsonResponse
     */
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

            return response()->json([
                'data' => new ScriptResource($script),
                'message' => 'Script created successfully',
            ], 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create script'], 500);
        }
    }

    /**
     * Show the specified resource.
     * @param int $media1_id
     * @param int $id
     * @return JsonResponse
     */
    public function get_script_by_id($media1_id, $id): JsonResponse
    {
        try {
            $script = Script::where('media1_id', $media1_id)->findOrFail($id);
            return response()->json([
                'data' => new ScriptResource($script),
                'message' => 'Script retrieved successfully',
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Script not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to retrieve script'], 500);
        }
    }

    /**
     * Update or retrieve the specified resource for editing.
     * If request method is GET with 'edit' query param, return script for editing.
     * If request method is PUT, update the script.
     * @param Request $request
     * @param int $media1_id
     * @param int $id
     * @return JsonResponse
     */
    public function update_script(Request $request, $media1_id, $id): JsonResponse
    {
        try {
            $script = Script::where('media1_id', $media1_id)->findOrFail($id);

            if ($request->method() === 'GET' && $request->query('edit')) {
                return response()->json([
                    'data' => new ScriptResource($script),
                    'message' => 'Script retrieved for editing',
                ], 200);
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

                return response()->json([
                    'data' => new ScriptResource($script),
                    'message' => 'Script updated successfully',
                ], 200);
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

    /**
     * Remove the specified resource from storage.
     * @param int $media1_id
     * @param int $id
     * @return JsonResponse
     */
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
}
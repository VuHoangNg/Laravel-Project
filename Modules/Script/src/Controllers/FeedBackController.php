<?php

namespace Modules\Script\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Modules\Script\src\Repositories\FeedBackRepositoryInterface;
use Modules\Core\src\Repositories\NotificationRepositoryInterface;
use Modules\Script\src\Resources\FeedBackResource;
use Modules\Auth\src\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use UnauthorizedException;
use Illuminate\Support\Facades\Storage;

class FeedBackController extends Controller
{
    protected $feedBackRepository;
    protected $notificationRepository;

    public function __construct(
        FeedBackRepositoryInterface $feedBackRepository,
        NotificationRepositoryInterface $notificationRepository
    ) {
        $this->feedBackRepository = $feedBackRepository;
        $this->notificationRepository = $notificationRepository;
        $this->middleware('auth:sanctum')->only([
            'store_feedback',
            'get_feedbacks',
            'update_feedback',
            'destroy_feedback',
            'get_feedback_by_id',
        ]);
    }

    public function store_feedback(Request $request): JsonResponse
    {
        $user = $request->user();
        $rateLimitKey = 'feedback:' . $user->id;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 10)) {
            return response()->json(['message' => 'Too many feedback attempts'], 429);
        }
        RateLimiter::hit($rateLimitKey, 60);

        try {
            $validated = $request->validate([
                'text' => 'required|string|max:1000',
                'script_id' => 'required|exists:scripts,id',
                'timestamp' => 'nullable|numeric|min:0',
                'parent_id' => 'nullable|exists:feedbacks,id',
            ]);

            // Check for two-level nesting
            if (!empty($validated['parent_id'])) {
                $parent = $this->feedBackRepository->findById($validated['parent_id']);
                if ($parent && $parent->parent_id) {
                    return response()->json(['message' => 'Feedback nesting limited to two levels'], 422);
                }
            }

            // Create the feedback
            $feedback = $this->feedBackRepository->create($validated, $user);

            // Create notification if this is a reply
            $this->notificationRepository->createForFeedBack($feedback, $user, $validated['parent_id'] ?? null);

            return response()->json([
                'data' => new FeedBackResource($feedback),
                'message' => 'Feedback created successfully',
            ], 201);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Script or parent feedback not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create feedback: ' . $e->getMessage()], 500);
        }
    }

    public function get_feedbacks(Request $request, $script_id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
            ]);

            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 5);
            $feedbacks = $this->feedBackRepository->getByScriptId($script_id, $page, $perPage);

            return response()->json([
                'data' => FeedBackResource::collection($feedbacks->items()),
                'total' => $feedbacks->total(),
                'current_page' => $feedbacks->currentPage(),
                'per_page' => $feedbacks->perPage(),
                'last_page' => $feedbacks->lastPage(),
                'message' => 'Feedbacks retrieved successfully',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function get_feedback_by_id(Request $request, $id): JsonResponse
    {
        try {
            $feedbackData = $this->feedBackRepository->getFeedbackWithParentAndSiblings($id);

            return response()->json([
                'data' => $feedbackData,
                'message' => 'Feedback with parent and siblings retrieved successfully',
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function update_feedback(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'text' => 'required|string|max:1000',
                'timestamp' => 'nullable|numeric|min:0',
            ]);

            $feedback = $this->feedBackRepository->update($id, $validated, $request->user());

            if (!$feedback) {
                return response()->json(['message' => 'Feedback not found'], 404);
            }

            return response()->json([
                'data' => new FeedBackResource($feedback),
                'message' => 'Feedback updated successfully',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (UnauthorizedException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function destroy_feedback(Request $request, $id): JsonResponse
    {
        try {
            $success = $this->feedBackRepository->delete($id, $request->user());

            if (!$success) {
                return response()->json(['message' => 'Feedback not found'], 404);
            }

            return response()->json(['message' => 'Feedback deleted successfully']);
        } catch (UnauthorizedException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        }
    }

    private function userToArray(User $user, array $fields = []): array
    {
        $data = [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar ? Storage::url($user->avatar) : null,
        ];

        return empty($fields) ? $data : array_intersect_key($data, array_flip($fields));
    }
}
<?php

namespace Modules\User\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\User\src\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    private $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
        $this->userRepository = $userRepository;
    }

    private function getRequestedFields(Request $request): array
    {
        $fields = $request->query('fields', '');
        $allowedFields = ['id', 'username', 'name', 'email', 'avatar_url'];
        $requestedFields = $fields ? array_filter(explode(',', $fields)) : [];
        return array_intersect($requestedFields, $allowedFields);
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int)$request->query('per_page', 10), 1), 100);
        $fields = $this->getRequestedFields($request);

        $columnMap = [
            'id' => 'id',
            'username' => 'username',
            'name' => 'name',
            'email' => 'email',
            'avatar_url' => 'avatar',
        ];
        $columns = $fields ? array_values(array_intersect_key($columnMap, array_flip($fields))) : ['id', 'username', 'name', 'email', 'avatar'];

        // Fetch users sorted by created_at in descending order
        $users = $this->userRepository->getAll($perPage, $columns, ['created_at' => 'desc']);

        // Transform paginated collection using foreach
        $data = [];
        foreach ($users->getCollection() as $user) {
            $userArray = [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar ? Storage::url($user->avatar) : null,
            ];
            $data[] = empty($fields) ? $userArray : array_intersect_key($userArray, array_flip($fields));
        }

        return response()->json([
            'data' => $data,
            'current_page' => $users->currentPage(),
            'last_page' => $users->lastPage(),
            'per_page' => $users->perPage(),
            'total' => $users->total(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $this->userRepository->create($validated);
        $userArray = [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar ? Storage::url($user->avatar) : null,
        ];
        $fields = $this->getRequestedFields($request);

        return response()->json([
            'message' => 'User created successfully',
            'user' => empty($fields) ? $userArray : array_intersect_key($userArray, array_flip($fields)),
        ], 201);
    }

    public function show($id): JsonResponse
    {
        try {
            $fields = $this->getRequestedFields(request());
            $columns = $fields ? array_values(array_intersect_key([
                'id' => 'id',
                'username' => 'username',
                'name' => 'name',
                'email' => 'email',
                'avatar_url' => 'avatar',
            ], array_flip($fields))) : ['id', 'username', 'name', 'email', 'avatar'];

            $user = $this->userRepository->getById($id, $columns);
            $userArray = [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar ? Storage::url($user->avatar) : null,
            ];

            return response()->json([
                'user' => empty($fields) ? $userArray : array_intersect_key($userArray, array_flip($fields)),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'username' => 'required|string|max:255|unique:users,username,' . $id,
                'email' => 'required|string|email|max:255|unique:users,email,' . $id,
                'password' => 'nullable|string|min:8|confirmed',
                'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            $user = $this->userRepository->update($id, $validated);
            $userArray = [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar ? Storage::url($user->avatar) : null,
            ];
            $fields = $this->getRequestedFields($request);

            return response()->json([
                'message' => 'User updated successfully',
                'user' => empty($fields) ? $userArray : array_intersect_key($userArray, array_flip($fields)),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $deleted = $this->userRepository->delete($id);

            if (!$deleted) {
                return response()->json(['message' => 'You cannot delete your own account'], 403);
            }

            return response()->json(['message' => 'User deleted successfully']);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }
}
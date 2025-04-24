<?php

namespace Modules\User\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\User\src\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class UserController extends Controller
{
    private $userRepository;
    private $id;
    private $username;
    private $name;
    private $email;
    private $password;
    private $avatarUrl;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
        $this->setUserRepository($userRepository);
    }

    public function getUserRepository(): UserRepositoryInterface
    {
        return $this->userRepository;
    }

    public function setUserRepository(UserRepositoryInterface $userRepository): void
    {
        if (!$userRepository instanceof UserRepositoryInterface) {
            throw new \InvalidArgumentException('The userRepository must implement UserRepositoryInterface.');
        }
        $this->userRepository = $userRepository;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(?int $id): void
    {
        $this->id = $id;
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(?string $username): void
    {
        $this->username = $username ? trim($username) : null;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): void
    {
        $this->name = $name ? ucfirst(trim($name)) : null;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): void
    {
        $this->email = $email ? strtolower(trim($email)) : null;
    }

    public function setPassword(?string $password): void
    {
        $this->password = $password ? \Illuminate\Support\Facades\Hash::make(trim($password)) : null;
    }

    public function getAvatarUrl(): ?string
    {
        return $this->avatarUrl;
    }

    public function setAvatarUrl(?string $avatarPath): void
    {
        $this->avatarUrl = $avatarPath ? \Illuminate\Support\Facades\Storage::url($avatarPath) : null;
    }

    private function getRequestedFields(Request $request): array
    {
        $fields = $request->query('fields', '');
        $allowedFields = ['id', 'username', 'name', 'email', 'avatar_url'];
        $requestedFields = $fields ? array_filter(explode(',', $fields)) : [];
        return array_intersect($requestedFields, $allowedFields);
    }

    private function toArray(array $fields = []): array
    {
        $data = [
            'id' => $this->getId(),
            'username' => $this->getUsername(),
            'name' => $this->getName(),
            'email' => $this->getEmail(),
            'avatar_url' => $this->getAvatarUrl(),
        ];

        return empty($fields) ? $data : array_intersect_key($data, array_flip($fields));
    }

    private function setFromModel(\Modules\Auth\src\Models\User $user): void
    {
        $this->setId($user->id);
        $this->setUsername($user->username);
        $this->setName($user->name);
        $this->setEmail($user->email);
        $this->setAvatarUrl($user->avatar);
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

        $users = $this->getUserRepository()->getAll($perPage, $columns);

        $data = [];
        foreach ($users->items() as $user) {
            $this->setFromModel($user);
            $data[] = $this->toArray($fields);
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

        $user = $this->getUserRepository()->create($validated);
        $this->setFromModel($user);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $this->toArray($this->getRequestedFields($request))
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

            $user = $this->getUserRepository()->getById($id, $columns);
            $this->setFromModel($user);

            return response()->json(['user' => $this->toArray($fields)]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
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

            $user = $this->getUserRepository()->update($id, $validated);
            $this->setFromModel($user);

            return response()->json([
                'message' => 'User updated successfully',
                'user' => $this->toArray($this->getRequestedFields($request))
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $deleted = $this->getUserRepository()->delete($id);

            if (!$deleted) {
                return response()->json(['message' => 'You cannot delete your own account'], 403);
            }

            return response()->json(['message' => 'User deleted successfully']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }
}
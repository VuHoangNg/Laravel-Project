<?php

namespace Modules\Auth\src\Controllers;

use Illuminate\Contracts\Support\Renderable;
use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Modules\Auth\src\Models\User;
use Illuminate\Support\Facades\Cookie;
use App\Mail\WelcomeEmail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class AuthController extends Controller
{
    private $id;
    private $username;
    private $name;
    private $email;
    private $password;
    private $avatarUrl;

    public function __construct()
    {
        $this->middleware('auth:sanctum')->only(['logout', 'getUser', 'updateAvatar']);
    }

    public function index(): Renderable
    {
        return view('auth::index');
    }

    public function create(): Renderable
    {
        return view('auth::create');
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }

    public function show($id): Renderable
    {
        return view('auth::show');
    }

    public function edit($id): Renderable
    {
        return view('auth::edit');
    }

    public function update(Request $request, $id): JsonResponse
    {
        return response()->json(['message' => 'Not implemented'], 501);
    }

    public function destroy($id): JsonResponse
    {
        return response()->json(['message' => 'Not implemented'], 501);
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
        $this->password = $password ? Hash::make(trim($password)) : null;
    }

    public function getAvatarUrl(): ?string
    {
        return $this->avatarUrl;
    }

    public function setAvatarUrl(?string $avatarPath): void
    {
        $this->avatarUrl = $avatarPath ? Storage::url($avatarPath) : null;
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

    private function setFromModel(User $user): void
    {
        $this->setId($user->id);
        $this->setUsername($user->username);
        $this->setName($user->name);
        $this->setEmail($user->email);
        $this->setAvatarUrl($user->avatar);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = User::where('username', $request->username)->first();

        if ($user && Hash::check($request->password, $user->password)) {
            $token = $user->createToken('auth_token')->plainTextToken;

            $this->setFromModel($user);

            $fields = $this->getRequestedFields($request);
            $responseData = $this->toArray($fields);
            if (empty($fields) || in_array('token', $fields)) {
                $responseData['token'] = $token;
            }
            $responseData['message'] = 'Login successful';

            return response()->json($responseData)
                ->withCookie(Cookie::forever('username', $this->getUsername()))
                ->withCookie(Cookie::forever('email', $this->getEmail()))
                ->withCookie(Cookie::forever('token', $token));
        }

        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout successful'])
            ->withCookie(Cookie::forget('username'))
            ->withCookie(Cookie::forget('email'))
            ->withCookie(Cookie::forget('token'));
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $this->setName($validated['name']),
            'username' => $this->setUsername($validated['username']),
            'email' => $this->setEmail($validated['email']),
            'password' => $this->setPassword($validated['password']),
        ]);

        $this->setFromModel($user);

        event(new Registered($user));

        return response()->json(array_merge(
            $this->toArray($this->getRequestedFields($request)),
            ['message' => 'Account created successfully. Please check your email for verification.']
        ), 201);
    }

    public function getUser(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $this->setFromModel($user);
            return response()->json($this->toArray($this->getRequestedFields($request)));
        }
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    public function verifyEmail($id, $hash)
    {
        try {
            $user = User::find($id);
            if (!$user) {
                throw new ModelNotFoundException("User with ID {$id} not found.");
            }

            if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
                return response()->json(['message' => 'Invalid verification link'], 400);
            }

            if (!$user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
            }

            return redirect('/auth/email-verified');
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();

        $avatarPath = $this->setAvatarPath($request, $user);
        $user->avatar = $avatarPath;
        $user->save();

        $this->setFromModel($user);

        return response()->json(array_merge(
            $this->toArray($this->getRequestedFields($request)),
            ['message' => 'Avatar updated successfully']
        ));
    }

    private function setAvatarPath(Request $request, User $user): ?string
    {
        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            return $request->file('avatar')->store('avatars', 'public');
        }
        return $user->avatar;
    }
}
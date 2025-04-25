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
use Modules\Auth\src\Jobs\SendVerifyEmail;

class AuthController extends Controller
{
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

    private function getRequestedFields(Request $request): array
    {
        $fields = $request->query('fields', '');
        $allowedFields = ['id', 'username', 'name', 'email', 'avatar_url'];
        $requestedFields = $fields ? array_filter(explode(',', $fields)) : [];
        return array_intersect($requestedFields, $allowedFields);
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

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = User::where('username', $request->username)->first();

        if ($user && Hash::check($request->password, $user->password)) {
            $token = $user->createToken('auth_token')->plainTextToken;

            $fields = $this->getRequestedFields($request);
            $responseData = $this->userToArray($user, $fields);
            if (empty($fields) || in_array('token', $fields)) {
                $responseData['token'] = $token;
            }
            $responseData['message'] = 'Login successful';

            return response()->json($responseData)
                ->withCookie(Cookie::forever('username', $user->username))
                ->withCookie(Cookie::forever('email', $user->email))
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
            'name' => ucfirst(trim($validated['name'])),
            'username' => trim($validated['username']),
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make(trim($validated['password'])),
        ]);

        event(new Registered($user));

        // Generate verification URL for frontend route
        $verificationUrl = url('/auth/verify-email/' . $user->id . '/' . sha1($user->getEmailForVerification()));

        // Dispatch SendVerifyEmail job
        SendVerifyEmail::dispatch($user, $verificationUrl);

        return response()->json(array_merge(
            $this->userToArray($user, $this->getRequestedFields($request)),
            ['message' => 'Account created successfully. Please check your email for verification.']
        ), 201);
    }

    public function getUser(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            return response()->json($this->userToArray($user, $this->getRequestedFields($request)));
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

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $user->avatar = $request->file('avatar')->store('avatars', 'public');
            $user->save();
        }

        return response()->json(array_merge(
            $this->userToArray($user, $this->getRequestedFields($request)),
            ['message' => 'Avatar updated successfully']
        ));
    }
}
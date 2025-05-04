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
use Illuminate\Support\Facades\RateLimiter;
use App\Models\Comment;
use Modules\Media\src\Models\Media1;

class AuthController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->only([
            'logout',
            'getUser',
            'updateAvatar',
            'storeComment',
            'getComments',
            'updateComment',
            'destroyComment'
        ]);
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
                ->withCookie(Cookie::forever('username', $user->username, null, null, false, true)) // HttpOnly true for security
                ->withCookie(Cookie::forever('email', $user->email, null, null, false, true)) // HttpOnly true for security
                ->withCookie(Cookie::forever('token', $token, null, null, false, true)) // HttpOnly true for security
                ->withCookie(Cookie::forever('id', $user->id, null, null, false, false)); // HttpOnly false to allow JS access
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
        if (RateLimiter::tooManyAttempts('register:'.$request->ip(), 5)) {
            return response()->json(['message' => 'Too many registration attempts'], 429);
        }
        RateLimiter::hit('register:'.$request->ip(), 60);

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

        $verificationUrl = url('/auth/verify-email/' . $user->id . '/' . sha1($user->getEmailForVerification()));
        SendVerifyEmail::dispatch($user, $verificationUrl)->onQueue('emails');

        return response()->json(array_merge(
            $this->userToArray($user, $this->getRequestedFields($request)),
            ['message' => 'Account created successfully. Please check your email for verification.']
        ), 201);
    }

    public function getUser(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            if (!$user instanceof User) {
                $user = User::find($user->id);
                if (!$user) {
                    return response()->json(['message' => 'User not found'], 404);
                }
            }
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

    public function storeComment(Request $request): JsonResponse
    {
        $user = $request->user();
        $rateLimitKey = 'comment:'.$user->id;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 10)) {
            return response()->json(['message' => 'Too many comment attempts'], 429);
        }
        RateLimiter::hit($rateLimitKey, 60);

        $validated = $request->validate([
            'text' => 'required|string|max:1000',
            'media1_id' => 'required|exists:media1,id',
            'timestamp' => 'nullable|numeric|min:0',
        ]);

        $comment = Comment::create([
            'text' => trim($validated['text']),
            'timestamp' => $validated['timestamp'] ?? null,
            'user_id' => $user->id,
            'media1_id' => $validated['media1_id'],
        ]);

        $comment->load('user');

        // Ensure the comment's user is the correct model
        if (!$comment->user instanceof User) {
            $comment->user = User::find($comment->user_id);
            if (!$comment->user) {
                return response()->json(['message' => 'Comment user not found'], 404);
            }
        }

        return response()->json([
            'id' => $comment->id,
            'text' => $comment->text,
            'timestamp' => $comment->timestamp,
            'formatted_timestamp' => $comment->timestamp ? gmdate('i:s', (int)$comment->timestamp) : null,
            'user' => $this->userToArray($comment->user),
            'message' => 'Comment created successfully',
        ], 201);
    }

    public function getComments(Request $request, $mediaId): JsonResponse
    {
        $request->merge(['media1_id' => $mediaId]);
        $validated = $request->validate([
            'media1_id' => 'required|exists:media1,id',
        ]);

        $perPage = $request->query('per_page', 10);
        $comments = Comment::where('media1_id', $validated['media1_id'])
            ->with(['user' => function ($query) {
                $query->select('id', 'username', 'name', 'email', 'avatar');
            }])
            ->orderBy('timestamp', 'asc')
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);

        $data = $comments->map(function ($comment) {
            // Ensure the comment's user is the correct model
            $user = $comment->user instanceof User ? $comment->user : User::find($comment->user_id);
            if (!$user) {
                return null; // Skip comments with invalid users
            }
            return [
                'id' => $comment->id,
                'text' => $comment->text,
                'timestamp' => $comment->timestamp,
                'formatted_timestamp' => $comment->timestamp ? gmdate('i:s', (int)$comment->timestamp) : null,
                'user' => $this->userToArray($user),
            ];
        })->filter()->values();

        return response()->json([
            'data' => $data,
            'current_page' => $comments->currentPage(),
            'per_page' => $comments->perPage(),
            'total' => $comments->total(),
            'last_page' => $comments->lastPage(),
            'message' => 'Comments retrieved successfully',
        ]);
    }

    public function updateComment(Request $request, $id): JsonResponse
    {
        try {
            $comment = Comment::findOrFail($id);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Comment not found'], 404);
        }

        $user = $request->user();
        if ($comment->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized to update this comment'], 403);
        }

        $validated = $request->validate([
            'text' => 'required|string|max:1000',
            'timestamp' => 'nullable|numeric|min:0',
        ]);

        $comment->update([
            'text' => trim($validated['text']),
            'timestamp' => $validated['timestamp'] ?? $comment->timestamp,
        ]);

        $comment->load('user');

        // Ensure the comment's user is the correct model
        if (!$comment->user instanceof User) {
            $comment->user = User::find($comment->user_id);
            if (!$comment->user) {
                return response()->json(['message' => 'Comment user not found'], 404);
            }
        }

        return response()->json([
            'id' => $comment->id,
            'text' => $comment->text,
            'timestamp' => $comment->timestamp,
            'formatted_timestamp' => $comment->timestamp ? gmdate('i:s', (int)$comment->timestamp) : null,
            'user' => $this->userToArray($comment->user),
            'message' => 'Comment updated successfully',
        ]);
    }

    public function destroyComment(Request $request, $id): JsonResponse
    {
        try {
            $comment = Comment::findOrFail($id);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Comment not found'], 404);
        }

        $user = $request->user();
        if ($comment->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized to delete this comment'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }
}
<?php

namespace Modules\Auth\src\Controllers;

use Illuminate\Contracts\Support\Renderable;
use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Modules\Auth\src\Models\User;
use Illuminate\Support\Facades\Cookie;

class AuthController extends Controller
{
    /**
     * Display a listing of the resource.
     * @return Renderable
     */
    public function index()
    {
        return view('auth::index');
    }

    /**
     * Show the form for creating a new resource.
     * @return Renderable
     */
    public function create()
    {
        return view('auth::create');
    }

    /**
     * Store a newly created resource in storage.
     * @param Request $request
     * @return Renderable
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Show the specified resource.
     * @param int $id
     * @return Renderable
     */
    public function show($id)
    {
        return view('auth::show');
    }

    /**
     * Show the form for editing the specified resource.
     * @param int $id
     * @return Renderable
     */
    public function edit($id)
    {
        return view('auth::edit');
    }

    /**
     * Update the specified resource in storage.
     * @param Request $request
     * @param int $id
     * @return Renderable
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     * @param int $id
     * @return Renderable
     */
    public function destroy($id)
    {
        //
    }

    public function login(Request $request)
{
    $request->validate([
        'username' => 'required',
        'password' => 'required',
    ]);

    $user = User::where('username', $request->username)->first();

    if ($user && Hash::check($request->password, $user->password)) {
        // Issue token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'username' => $user->username,
            'email' => $user->email,
            'token' => $token,
            'message' => 'Login successful',
        ])->withCookie(Cookie::forever('username', $user->username))
          ->withCookie(Cookie::forever('email', $user->email))
          ->withCookie(Cookie::forever('token', $token));
    }

    return response()->json([
        'message' => 'Invalid credentials',
    ], 401);
}

        public function logout(Request $request)
        {
            // Revoke the user's current token
            $request->user()->currentAccessToken()->delete();

            // Clear the cookies using Cookie facade
            return response()->json([
                'message' => 'Logout successful'
            ])->withCookie(Cookie::forget('username'))
            ->withCookie(Cookie::forget('email'))
            ->withCookie(Cookie::forget('token'));
        }


        public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'name' => $user->name,
            'message' => 'Account created successfully',
        ], 201);
    }

    public function getUser(Request $request)
{
    // Laravel Sanctum automatically checks the Bearer token
    $user = $request->user();
    if ($user) {
        return response()->json([
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
        ]);
    }
    return response()->json(['message' => 'Unauthorized'], 401);
}
}




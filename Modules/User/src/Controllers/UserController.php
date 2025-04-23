<?php

namespace Modules\User\src\Controllers;

use Illuminate\Contracts\Support\Renderable;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Modules\Auth\src\Models\User;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     * @param Request $request
     * @return Renderable
     */
    public function index(Request $request)
    {
        // Get per_page from query parameter, default to 10
        $perPage = $request->query('per_page', 10);
        
        // Validate per_page to ensure it's a positive integer and within reasonable limits
        $perPage = max(1, min(100, (int)$perPage));

        // Fetch paginated users
        $users = User::paginate($perPage);

        // For API response (React frontend)
        if ($request->expectsJson()) {
            return response()->json([
                'data' => $users->items(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ]);
        }

        // For web view (Blade)
        return view('user::index', compact('users'));
    }

    /**
     * Show the form for creating a new resource.
     * @return Renderable
     */
    public function create()
    {
        return view('user::create');
    }

    /**
     * Store a newly created resource in storage.
     * @param Request $request
     * @return Renderable
     */
    public function store(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Validate avatar
        ]);

        // Handle avatar upload
        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        // Create the user
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'avatar' => $avatarPath,
        ]);

        // For API response (React frontend)
        if ($request->expectsJson()) {
            return response()->json(['message' => 'User created successfully', 'user' => $user], 201);
        }

        // For web view (Blade)
        Session::flash('success', 'User created successfully.');
        return Redirect::route('user.index');
    }

    /**
     * Show the specified resource.
     * @param int $id
     * @return Renderable
     */
    public function show($id)
    {
        // Find the user or fail
        $user = User::findOrFail($id);

        // For API response (React frontend)
        if (request()->expectsJson()) {
            return response()->json(['user' => $user]);
        }

        // For web view (Blade)
        return view('user::show', compact('user'));
    }

    /**
     * Show the form for editing the specified resource.
     * @param int $id
     * @return Renderable
     */
    public function edit($id)
    {
        // Find the user or fail
        $user = User::findOrFail($id);
        return view('user::edit', compact('user'));
    }

    /**
     * Update the specified resource in storage.
     * @param Request $request
     * @param int $id
     * @return Renderable
     */
    public function update(Request $request, $id)
    {
        // Find the user or fail
        $user = User::findOrFail($id);

        // Validate the request
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Validate avatar
        ]);

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        } else {
            $validated['avatar'] = $user->avatar; // Keep existing avatar
        }

        // Update user details
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->avatar = $validated['avatar'];
        if ($request->filled('password')) {
            $user->password = Hash::make($validated['password']);
        }
        $user->save();

        // For API response (React frontend)
        if ($request->expectsJson()) {
            return response()->json(['message' => 'User updated successfully', 'user' => $user]);
        }

        // For web view (Blade)
        Session::flash('success', 'User updated successfully.');
        return Redirect::route('user.index');
    }

    /**
     * Remove the specified resource from storage.
     * @param int $id
     * @return Renderable
     */
    public function destroy($id)
    {
        // Find the user or fail
        $user = User::findOrFail($id);

        // Prevent deleting the currently authenticated user
        if ($user->id === auth()->id()) {
            if (request()->expectsJson()) {
                return response()->json(['message' => 'You cannot delete your own account'], 403);
            }
            Session::flash('error', 'You cannot delete your own account.');
            return Redirect::route('user.index');
        }

        // Delete avatar if exists
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Delete the user
        $user->delete();

        // For API response (React frontend)
        if (request()->expectsJson()) {
            return response()->json(['message' => 'User deleted successfully']);
        }

        // For web view (Blade)
        Session::flash('success', 'User deleted successfully.');
        return Redirect::route('user.index');
    }
}
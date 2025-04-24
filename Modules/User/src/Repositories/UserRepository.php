<?php

namespace Modules\User\src\Repositories;

use Modules\Auth\src\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserRepository implements UserRepositoryInterface
{
    public function getAll($perPage): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return User::paginate($perPage);
    }

    public function getById($id): User
    {
        return User::findOrFail($id);
    }

    public function create(array $data): User
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        if (isset($data['avatar']) && $data['avatar']->isValid()) {
            $data['avatar'] = $data['avatar']->store('avatars', 'public');
        }

        return User::create($data);
    }

    public function update($id, array $data): User
    {
        $user = User::findOrFail($id);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        if (isset($data['avatar']) && $data['avatar']->isValid()) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $data['avatar'] = $data['avatar']->store('avatars', 'public');
        } else {
            $data['avatar'] = $user->avatar;
        }

        $user->update($data);
        return $user;
    }

    public function delete($id): bool
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return false;
        }

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        return $user->delete();
    }
}
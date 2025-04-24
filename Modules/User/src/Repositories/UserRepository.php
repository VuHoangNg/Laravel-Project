<?php

namespace Modules\User\src\Repositories;

use Modules\Auth\src\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Modules\User\src\Repositories\UserRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class UserRepository implements UserRepositoryInterface
{
    public function getAll($perPage, array $columns = ['*']): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return User::select($columns)->paginate($perPage);
    }

    public function getById($id, array $columns = ['*']): ?User
    {
        $user = User::select($columns)->find($id);
        if (!$user) {
            throw new ModelNotFoundException("User with ID {$id} not found.");
        }
        return $user;
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

    public function update($id, array $data): ?User
    {
        $user = User::find($id);
        if (!$user) {
            throw new ModelNotFoundException("User with ID {$id} not found.");
        }

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
        $user = User::find($id);
        if (!$user) {
            throw new ModelNotFoundException("User with ID {$id} not found.");
        }

        if ($user->id === auth()->id()) {
            return false;
        }

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        return $user->delete();
    }
}
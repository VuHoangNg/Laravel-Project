<?php

namespace Modules\User\src\Repositories;

use Modules\Auth\src\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Modules\User\src\Repositories\UserRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserRepository implements UserRepositoryInterface
{
    public function getAll(int $perPage, array $columns = ['*'], array $orderBy = []): LengthAwarePaginator
    {
        $query = User::select($columns);
        // Apply sorting: default to created_at desc if no orderBy provided
        $orderBy = $orderBy ?: ['created_at' => 'desc'];
        foreach ($orderBy as $column => $direction) {
            $query->orderBy($column, $direction);
        }
        return $query->paginate($perPage);
    }

    public function getById(int $id, array $columns = ['*']): ?User
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

    public function update(int $id, array $data): ?User
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

    public function delete(int $id): bool
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
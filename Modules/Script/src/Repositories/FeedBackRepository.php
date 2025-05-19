<?php

namespace Modules\Script\src\Repositories;

use Modules\Script\src\Models\FeedBack;
use Modules\Auth\src\Models\User;
use UnauthorizedException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Storage;

class FeedBackRepository implements FeedBackRepositoryInterface
{
    public function create(array $data, User $user)
    {
        $feedback = new FeedBack($data);
        $feedback->user_id = $user->id;
        $feedback->save();

        return $feedback->fresh()->load('user');
    }

    public function getByScriptId(int $scriptId, int $page, int $perPage)
    {
        return FeedBack::where('script_id', $scriptId)
            ->whereNull('parent_id')
            ->with(['user', 'children.user'])
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function findById(int $id)
    {
        return FeedBack::with(['user', 'parent.user'])->find($id);
    }

    public function getFeedbackWithParentAndSiblings(int $id)
    {
        // Fetch the requested feedback
        $feedback = FeedBack::with(['user', 'children.user'])->find($id);

        if (!$feedback) {
            throw new ModelNotFoundException('Feedback not found');
        }

        $response = [
            'id' => $feedback->id,
            'text' => $feedback->text,
            'timestamp' => $feedback->timestamp,
            'formatted_timestamp' => $feedback->formatted_timestamp,
            'parent_id' => $feedback->parent_id,
            'script_id' => $feedback->script_id,
            'user' => $this->userToArray($feedback->user),
            'created_at' => $feedback->created_at,
            'updated_at' => $feedback->updated_at,
            'children' => $feedback->children ?? [],
        ];

        // If the feedback has a parent, include it
        if ($feedback->parent_id) {
            $parent = FeedBack::with(['user'])->find($feedback->parent_id);
            if ($parent) {
                $response = array_merge([
                    'id' => $parent->id,
                    'text' => $parent->text,
                    'timestamp' => $parent->timestamp,
                    'formatted_timestamp' => $parent->formatted_timestamp,
                    'parent_id' => $parent->parent_id,
                    'script_id' => $parent->script_id,
                    'user' => $this->userToArray($parent->user),
                    'created_at' => $parent->created_at,
                    'updated_at' => $parent->updated_at,
                    'children' => [],
                ], ['children' => [$response]]);

                // Fetch all siblings (other children of the same parent)
                $siblings = FeedBack::where('parent_id', $feedback->parent_id)
                    ->where('id', '!=', $feedback->id)
                    ->with(['user', 'children.user'])
                    ->select([
                        'id',
                        'text',
                        'timestamp',
                        'formatted_timestamp',
                        'parent_id',
                        'script_id',
                        'created_at',
                        'updated_at',
                    ])
                    ->get()
                    ->each(function ($sibling) {
                        $sibling->setAttribute('user', $this->userToArray($sibling->user));
                        $sibling->setAttribute('children', $sibling->children ?? []);
                    })
                    ->toArray();

                $response['children'] = array_merge($response['children'], $siblings);
            }
        } else {
            // If no parent, just include all children
            $response['children'] = $feedback->children ?? [];
        }

        return $response;
    }

    public function update(int $id, array $data, User $user)
    {
        $feedback = FeedBack::find($id);

        if (!$feedback) {
            throw new ModelNotFoundException('Feedback not found');
        }

        if ($feedback->user_id !== $user->id) {
            throw new UnauthorizedException('You are not authorized to update this feedback');
        }

        $feedback->update($data);

        return $feedback->fresh()->load('user');
    }

    public function delete(int $id, User $user): bool
    {
        $feedback = FeedBack::find($id);

        if (!$feedback) {
            return false;
        }

        if ($feedback->user_id !== $user->id) {
            throw new UnauthorizedException('You are not authorized to delete this feedback');
        }

        return $feedback->delete();
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
}
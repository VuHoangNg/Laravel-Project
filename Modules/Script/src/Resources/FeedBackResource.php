<?php

namespace Modules\Script\src\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class FeedBackResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'text' => $this->text,
            'timestamp' => $this->timestamp,
            'formatted_timestamp' => $this->timestamp ? gmdate('i:s', (int)$this->timestamp) : null,
            'parent_id' => $this->parent_id,
            'script_id' => $this->script_id,
            'user' => [
                'id' => $this->user->id,
                'username' => $this->user->username,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'avatar_url' => $this->user->avatar ? Storage::url($this->user->avatar) : null,
            ],
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'children' => FeedBackResource::collection($this->whenLoaded('children')),
        ];
    }
}
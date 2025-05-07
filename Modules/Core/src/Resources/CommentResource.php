<?php

namespace Modules\Core\src\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CommentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'text' => $this->text,
            'timestamp' => $this->timestamp,
            'formatted_timestamp' => $this->timestamp ? gmdate('i:s', (int)$this->timestamp) : null,
            'parent_id' => $this->parent_id,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'username' => $this->user->username,
                'email' => $this->user->email,
                'avatar_url' => $this->user->avatar ? Storage::url($this->user->avatar) : null,
            ],
            'replies' => CommentResource::collection($this->whenLoaded('replies')),
        ];
    }
}
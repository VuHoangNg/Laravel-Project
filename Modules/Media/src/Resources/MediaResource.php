<?php

namespace Modules\Media\src\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class MediaResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'type' => $this->type,
            'path' => $this->path,
            'thumbnail_path' => $this->thumbnail_path,
            'url' => $this->url,
            'thumbnail_url' => $this->thumbnail_url,
            'duration' => $this->duration,
            'status' => $this->status,
        ];
    }
}
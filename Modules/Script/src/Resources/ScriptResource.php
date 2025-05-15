<?php

namespace Modules\Script\src\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ScriptResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'part' => $this->part,
            'est_time' => $this->est_time,
            'direction' => $this->direction,
            'detail' => $this->detail,
            'note' => $this->note,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'media1_id' => $this->media1_id,
        ];
    }
}
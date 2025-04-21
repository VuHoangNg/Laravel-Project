<?php

namespace Modules\Blog\src\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Media\src\Models\Media;

class Blog extends Model
{
    protected $fillable = ['title', 'content', 'thumbnail_id'];

    public function thumbnail()
    {
        return $this->belongsTo(Media::class, 'thumbnail_id');
    }
}
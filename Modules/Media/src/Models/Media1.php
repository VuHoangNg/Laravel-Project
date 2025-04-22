<?php

namespace Modules\Media\src\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Media1 extends Model
{
    protected $table = 'media1'; // Specify the correct table name

    protected $fillable = ['title', 'path', 'thumbnail_path', 'status'];

    protected $appends = ['url', 'thumbnail_url'];

    // Accessor for url
    public function getUrlAttribute()
    {
        return Storage::url($this->path);
    }

    // Accessor for thumbnail_url
    public function getThumbnailUrlAttribute()
    {
        return $this->thumbnail_path ? Storage::url($this->thumbnail_path) : null;
    }
}
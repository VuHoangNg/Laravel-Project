<?php

namespace Modules\Blog\src\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Blog extends Model
{
    protected $fillable = ['title', 'content'];

    public function media(): BelongsToMany
    {
        return $this->belongsToMany(
            \Modules\Media\src\Models\Media1::class,
            'blog_media',
            'blog_id',
            'media_id'
        )->withTimestamps();
    }
}
<?php

namespace Modules\Media\src\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;

class Media1 extends Model
{
    protected $table = 'media1';

    protected $fillable = ['title', 'type', 'path', 'thumbnail_path', 'status'];

    protected $appends = ['url', 'thumbnail_url'];

    public function blogs(): BelongsToMany
    {
        return $this->belongsToMany(
            \Modules\Blog\src\Models\Blog::class,
            'blog_media',
            'media_id',
            'blog_id'
        )->withTimestamps();
    }

    public function getUrlAttribute(): ?string
    {
        // Only return URL if status is 1 (ready) and path is valid
        if ($this->status == 1 && $this->path && Storage::disk('public')->exists($this->path)) {
            return Storage::url($this->path);
        }
        return null;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        // Return thumbnail URL if status is 1 and thumbnail_path exists, otherwise fallback to path
        if ($this->status == 1) {
            if ($this->thumbnail_path && Storage::disk('public')->exists($this->thumbnail_path)) {
                return Storage::url($this->thumbnail_path);
            }
            if ($this->path && Storage::disk('public')->exists($this->path)) {
                return Storage::url($this->path);
            }
        }
        return null;
    }
}
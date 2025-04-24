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

    // Getter for title (Ensures consistent formatting)
    public function getTitleAttribute($value): string
    {
        return ucfirst($value);
    }

    // Setter for title (Trims whitespace before saving)
    public function setTitleAttribute($value)
    {
        $this->attributes['title'] = trim($value);
    }

    // Getter for path (Returns full URL if valid)
    public function getUrlAttribute(): ?string
    {
        if ($this->status == 1 && $this->path && Storage::disk('public')->exists($this->path)) {
            return Storage::url($this->path);
        }
        return null;
    }

    // Getter for thumbnail (Caches the thumbnail URL)
    public function getThumbnailUrlAttribute(): ?string
    {
        $cacheKey = "media_thumbnail_url_{$this->id}";
        return cache()->remember($cacheKey, now()->addMinutes(60), function () {
            if ($this->status == 1) {
                if ($this->thumbnail_path && Storage::disk('public')->exists($this->thumbnail_path)) {
                    return Storage::url($this->thumbnail_path);
                }
                if ($this->path && Storage::disk('public')->exists($this->path)) {
                    return Storage::url($this->path);
                }
            }
            return null;
        });
    }

    // Setter for path (Sanitizes file path before saving)
    public function setPathAttribute($value)
    {
        $this->attributes['path'] = trim($value);
    }

    // Setter for thumbnail path (Sanitizes file path)
    public function setThumbnailPathAttribute($value)
    {
        $this->attributes['thumbnail_path'] = trim($value);
    }
}
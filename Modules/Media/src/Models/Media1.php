<?php

namespace Modules\Media\src\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Modules\Core\src\Models\Comment;
use Modules\Blog\src\Models\Blog;
class Media1 extends Model
{
    protected $table = 'media1';

    protected $fillable = ['title', 'type', 'path', 'thumbnail_path', 'status', 'blog_id' , 'duration',];

    protected $appends = ['url', 'thumbnail_url'];

    public function blog(): BelongsTo
    {
        return $this->belongsTo(Blog::class, 'blog_id');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class, 'media1_id');
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
    public function getUrlAttribute()
    {
        return $this->path ? Storage::url($this->path) : null;
    }

    public function getThumbnailUrlAttribute()
    {
        return $this->thumbnail_path ? Storage::url($this->thumbnail_path) : null;
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
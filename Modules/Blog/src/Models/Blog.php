<?php

namespace Modules\Blog\src\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Blog extends Model
{
    protected $fillable = ['title', 'content'];

    public function media(): HasMany
    {
        return $this->hasMany(\Modules\Media\src\Models\Media1::class, 'blog_id');
    }

    // Getter for title (Capitalizes the title)
    public function getTitleAttribute($value): string
    {
        return ucfirst($value);
    }

    // Setter for title (Trims whitespace before saving)
    public function setTitleAttribute($value)
    {
        $this->attributes['title'] = trim($value);
    }

    // Getter for content (Ensures HTML safe output)
    public function getContentAttribute($value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }

    // Setter for content (Strips unnecessary whitespace)
    public function setContentAttribute($value)
    {
        $this->attributes['content'] = trim($value);
    }
}
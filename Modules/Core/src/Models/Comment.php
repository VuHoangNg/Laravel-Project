<?php

namespace Modules\Core\src\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Auth\src\Models\User;

class Comment extends Model
{
    protected $fillable = [
        'text',
        'timestamp',
        'user_id',
        'media1_id',
        'parent_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function media1()
    {
        return $this->belongsTo(\Modules\Media\src\Models\Media1::class, 'media1_id');
    }

    public function replies()
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }

    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }
}
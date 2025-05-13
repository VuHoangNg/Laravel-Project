<?php

namespace Modules\Core\src\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Auth\src\Models\User;
use Modules\Media\src\Models\Media1;
use Modules\Media\src\Models\Comment;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'triggered_by_id',
        'media1_id',
        'comment_id',
        'type',
        'message',
        'is_read',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function triggeredBy()
    {
        return $this->belongsTo(User::class, 'triggered_by_id');
    }

    public function media()
    {
        return $this->belongsTo(Media1::class, 'media1_id');
    }

    public function comment()
    {
        return $this->belongsTo(Comment::class, 'comment_id');
    }
}
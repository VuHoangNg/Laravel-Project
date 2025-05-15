<?php

namespace Modules\Script\src\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Auth\src\Models\User;

class FeedBack extends Model
{
    protected $table = 'feedbacks';

    protected $fillable = [
        'text',
        'script_id',
        'timestamp',
        'parent_id',
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }
}
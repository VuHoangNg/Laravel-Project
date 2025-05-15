<?php

namespace Modules\Script\src\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Media\src\Models\Media1;

class Script extends Model
{
    protected $table = 'scripts';

    protected $fillable = ['media1_id', 'part', 'est_time', 'direction', 'detail', 'note'];

    public function media1()
    {
        return $this->belongsTo(Media1::class, 'media1_id');
    }
}
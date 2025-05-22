<?php

namespace Modules\Blog\src\Models;

use Jenssegers\Mongodb\Eloquent\Model;

class Report extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'reports';
    protected $database = 'rp';

    protected $fillable = [
        'campaign_id', 'date', 'influencer_id', 'post_id', 'activity',
        'avg_watch_time', 'comments', 'items_sold', 'likes', 'platform_id',
        'saves', 'shares', 'views', 'watched_full_video', 'date_import'
    ];

    protected $casts = [
        'campaign_id' => 'integer',
        'influencer_id' => 'integer',
        'post_id' => 'integer',
        'platform_id' => 'integer',
        'comments' => 'integer',
        'items_sold' => 'integer',
        'likes' => 'integer',
        'saves' => 'integer',
        'shares' => 'integer',
        'views' => 'integer',
        'avg_watch_time' => 'float',
        'watched_full_video' => 'float',
        'date' => 'string',
        'date_import' => 'string',
    ];
}
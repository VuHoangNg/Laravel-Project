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
        'saves', 'shares', 'views', 'watched_full_video'
    ];

    protected $casts = [
        'campaign_id' => 'integer',
        'date' => 'date',
        'influencer_id' => 'integer',
        'post_id' => 'integer',
        'activity' => 'string',
        'avg_watch_time' => 'float',
        'comments' => 'integer',
        'items_sold' => 'integer',
        'likes' => 'integer',
        'platform_id' => 'integer',
        'saves' => 'integer',
        'shares' => 'integer',
        'views' => 'integer',
        'watched_full_video' => 'float'
    ];
}
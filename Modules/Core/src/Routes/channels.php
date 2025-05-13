<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('notifications.{userId}', function ($user, $userId) {
    $match = (int) $user->id === (int) $userId;
    Log::info('Pusher channel authorization', [
        'user_id' => $user->id,
        'channel_user_id' => $userId,
        'match' => $match,
    ]);
    return $match;
});

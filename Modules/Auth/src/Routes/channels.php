<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

Broadcast::channel('user.{id}', function ($user, $id, $channelName) {
    $userId = $user ? (int) $user->id : null;
    $channelId = (int) $id;
    Log::info('Channel authorization attempt', [
        'raw_channel_name' => $channelName,
        'user_id' => $userId,
        'channel_id' => $channelId,
        'match' => $userId === $channelId,
        'token' => request()->header('Authorization') ?? 'No token provided',
    ]);
    return $user && $userId === $channelId;
});
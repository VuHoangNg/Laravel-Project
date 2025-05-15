<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Core\src\Models\Notification;

class NewFeedbackNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;

    public function __construct(Notification $notification)
    {
        $this->notification = $notification->load(['script.media1']);
    }

    public function broadcastOn()
    {
        return new PrivateChannel('notifications.' . $this->notification->user_id);
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->notification->id,
            'user_id' => $this->notification->user_id,
            'triggered_by' => [
                'id' => $this->notification->triggeredBy->id,
                'username' => $this->notification->triggeredBy->username,
                'name' => $this->notification->triggeredBy->name,
                'avatar_url' => $this->notification->triggeredBy->avatar,
            ],
            'script_id' => $this->notification->script_id,
            'feedback_id' => $this->notification->feedback_id,
            'type' => $this->notification->type,
            'message' => $this->notification->message,
            'is_read' => $this->notification->is_read,
            'created_at' => $this->notification->created_at->toISOString(),
            'script' => $this->notification->script ? [
                'id' => $this->notification->script->id,
                'media1_id' => $this->notification->script->media1_id,
                'title' => $this->notification->script->media1->title ?? "Media {$this->notification->script->media1_id}",
            ] : null,
        ];
    }
}
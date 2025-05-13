<?php

namespace Modules\Core\src\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Modules\Core\src\Repositories\NotificationRepositoryInterface;
use UnauthorizedException;

class NotificationController extends Controller
{
    protected $notificationRepository;

    public function __construct(NotificationRepositoryInterface $notificationRepository)
    {
        $this->notificationRepository = $notificationRepository;
        $this->middleware('auth:sanctum')->only([
            'get_notifications',
            'update_notification_as_read',
        ]);
    }

    public function get_notifications(Request $request): JsonResponse
    {
        $perPage = $request->query('per_page', 20);
        $notifications = $this->notificationRepository->getForUser($request->user(), $perPage);
        return response()->json([
            'data' => $notifications->items(),
            'total' => $notifications->total(),
            'unread_count' => $notifications->unreadCount,
            'current_page' => $notifications->currentPage(),
            'last_page' => $notifications->lastPage(),
            'message' => 'Notifications retrieved successfully',
        ]);
    }

    public function update_notification_as_read(Request $request, $id): JsonResponse
    {
        try {
            $notification = $this->notificationRepository->markAsRead($id, $request->user());

            if (!$notification) {
                return response()->json(['message' => 'Notification not found'], 404);
            }

            return response()->json([
                'id' => $notification->id,
                'is_read' => $notification->is_read,
                'message' => 'Notification marked as read',
            ]);
        } catch (UnauthorizedException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        }
    }
}
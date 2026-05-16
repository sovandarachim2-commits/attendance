<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return Notification::where(fn ($query) => $query
            ->whereNull('user_id')
            ->orWhere('user_id', $request->user()->id))
            ->latest()
            ->paginate(20);
    }

    public function markRead(Notification $notification)
    {
        $notification->update(['read_at' => now()]);

        return $notification;
    }
}

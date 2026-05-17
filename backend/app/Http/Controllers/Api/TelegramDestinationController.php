<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Models\TelegramDestination;
use App\Services\TelegramNotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TelegramDestinationController extends Controller
{
    private const EVENTS = [
        'daily_attendance',
        'permission_request',
        'late_attendance',
        'missing_checkout',
        'outdoor_visit',
        'system_alert',
        'other',
    ];

    public function index()
    {
        return TelegramDestination::query()
            ->orderBy('event_key')
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        return TelegramDestination::create($this->validated($request));
    }

    public function update(Request $request, TelegramDestination $telegramDestination)
    {
        $telegramDestination->update($this->validated($request));

        return $telegramDestination->fresh();
    }

    public function destroy(TelegramDestination $telegramDestination)
    {
        $telegramDestination->delete();

        return response()->noContent();
    }

    public function test(TelegramDestination $telegramDestination, TelegramNotificationService $telegram)
    {
        $result = $telegram->sendToDestination(
            $telegramDestination,
            "✅ <b>SalesTrack Test</b>\nThis is a test message from your attendance system.\nDestination: <b>{$telegramDestination->name}</b>"
        );

        if (! $result['ok']) {
            return response()->json(['message' => $result['description']], 422);
        }

        return response()->json(['message' => 'Test message sent successfully.']);
    }

    public function verifyBot(TelegramNotificationService $telegram)
    {
        $result = $telegram->verifyBot();

        if (! $result['ok']) {
            return response()->json(['message' => $result['description']], 422);
        }

        $bot = $result['bot'];
        return response()->json([
            'message' => 'Bot is valid.',
            'bot'     => [
                'id'       => $bot['id'],
                'name'     => $bot['first_name'],
                'username' => '@'.$bot['username'],
            ],
        ]);
    }

    public function saveToken(Request $request, TelegramNotificationService $telegram)
    {
        $data = $request->validate([
            'bot_token' => ['required', 'string', 'min:10', 'max:200'],
        ]);

        SystemSetting::updateOrCreate(
            ['key' => 'telegram_bot_token'],
            ['value' => trim($data['bot_token']), 'group' => 'telegram'],
        );

        $result = $telegram->verifyBot();

        if (! $result['ok']) {
            return response()->json(['message' => 'Token saved but verification failed: '.$result['description']], 422);
        }

        $bot = $result['bot'];
        return response()->json([
            'message' => 'Bot token saved and verified.',
            'bot'     => [
                'id'       => $bot['id'],
                'name'     => $bot['first_name'],
                'username' => '@'.$bot['username'],
            ],
        ]);
    }

    public function getTokenStatus(TelegramNotificationService $telegram)
    {
        $hasDbToken = SystemSetting::where('key', 'telegram_bot_token')
            ->whereNotNull('value')
            ->where('value', '!=', '')
            ->exists();

        $result = $telegram->verifyBot();

        return response()->json([
            'has_token'  => $hasDbToken || config('services.telegram.bot_token'),
            'source'     => $hasDbToken ? 'database' : (config('services.telegram.bot_token') ? 'env' : 'none'),
            'verified'   => $result['ok'],
            'bot'        => $result['ok'] ? $result['bot'] : null,
            'error'      => $result['ok'] ? null : $result['description'],
        ]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'event_key' => ['required', 'string', Rule::in(self::EVENTS)],
            'chat_id' => ['required', 'string', 'max:120'],
            'message_thread_id' => ['nullable', 'integer', 'min:1'],
            'enabled' => ['required', 'boolean'],
        ]);
    }
}

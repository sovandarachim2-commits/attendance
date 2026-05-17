<?php

namespace App\Services;

use App\Models\SystemSetting;
use App\Models\TelegramDestination;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramNotificationService
{
    private function getToken(): ?string
    {
        $dbToken = SystemSetting::where('key', 'telegram_bot_token')->value('value');

        return ($dbToken && trim($dbToken) !== '') ? trim($dbToken) : config('services.telegram.bot_token');
    }

    public function send(string $message, string $eventKey = 'daily_attendance'): void
    {
        $token = $this->getToken();

        if (! $token) {
            return;
        }

        $destinations = TelegramDestination::query()
            ->where('enabled', true)
            ->whereIn('event_key', [$eventKey, 'other'])
            ->get();

        if ($destinations->isEmpty()) {
            $chatId = config('services.telegram.chat_id');

            if (! $chatId) {
                return;
            }

            $destinations = collect([(object) [
                'chat_id' => $chatId,
                'message_thread_id' => null,
            ]]);
        }

        foreach ($destinations as $destination) {
            $this->sendPayload($token, $destination->chat_id, $message, $destination->message_thread_id ?? null);
        }
    }

    public function sendToDestination(TelegramDestination $destination, string $message): array
    {
        $token = $this->getToken();

        if (! $token) {
            return ['ok' => false, 'description' => 'TELEGRAM_BOT_TOKEN is not set in .env'];
        }

        return $this->sendPayload($token, $destination->chat_id, $message, $destination->message_thread_id);
    }

    public function verifyBot(): array
    {
        $token = $this->getToken();

        if (! $token) {
            return ['ok' => false, 'description' => 'TELEGRAM_BOT_TOKEN is not set in .env'];
        }

        try {
            $response = Http::withOptions(['proxy' => false])->timeout(10)->get("https://api.telegram.org/bot{$token}/getMe");
            $body     = $response->json();

            if (! ($body['ok'] ?? false)) {
                return ['ok' => false, 'description' => $body['description'] ?? 'Invalid bot token'];
            }

            return ['ok' => true, 'bot' => $body['result']];
        } catch (\Throwable $e) {
            return ['ok' => false, 'description' => 'Network error: '.$e->getMessage()];
        }
    }

    private function sendPayload(string $token, string $chatId, string $message, ?int $threadId = null): array
    {
        try {
            $payload = [
                'chat_id'    => $chatId,
                'text'       => $message,
                'parse_mode' => 'HTML',
            ];

            if ($threadId) {
                $payload['message_thread_id'] = $threadId;
            }

            $response = Http::withOptions(['proxy' => false])->timeout(10)->post("https://api.telegram.org/bot{$token}/sendMessage", $payload);
            $body     = $response->json();

            if (! ($body['ok'] ?? false)) {
                $desc = $body['description'] ?? 'Unknown Telegram error';
                Log::warning('Telegram send failed', ['chat_id' => $chatId, 'description' => $desc]);
                return ['ok' => false, 'description' => $desc];
            }

            return ['ok' => true];
        } catch (\Throwable $e) {
            Log::warning('Telegram notification exception', ['message' => $e->getMessage()]);
            return ['ok' => false, 'description' => 'Network error: '.$e->getMessage()];
        }
    }
}

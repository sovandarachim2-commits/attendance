<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\Request;

class QrCodeController extends Controller
{
    public function office(Request $request)
    {
        $payload = json_encode([
            'type' => 'office_attendance',
            'branch_id' => $request->integer('branch_id'),
            'nonce' => bin2hex(random_bytes(16)),
            'expires_at' => now()->addMinutes(5)->toIso8601String(),
        ]);

        $result = (new Builder(
            writer: new PngWriter(),
            data: $payload,
            size: 320,
            margin: 12,
        ))->build();

        return response($result->getString(), 200, ['Content-Type' => $result->getMimeType()]);
    }
}

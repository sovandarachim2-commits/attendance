<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\ImageUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    public function index()
    {
        return SystemSetting::all()->pluck('value', 'key');
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'settings'   => ['required', 'array'],
            'settings.*' => ['nullable', 'string', 'max:1000'],
        ]);

        $now = now();

        foreach ($data['settings'] as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'updated_at' => $now],
            );
        }

        return SystemSetting::all()->pluck('value', 'key');
    }

    public function uploadLogo(Request $request, ImageUploadService $images)
    {
        $request->validate([
            'logo' => ['required', 'image', 'max:2048'],
        ]);

        $path = $images->store($request->file('logo'), 'logos');
        $disk = config('filesystems.attendance_disk', 'public');
        $url  = Storage::disk($disk)->url($path);

        SystemSetting::updateOrCreate(
            ['key' => 'company_logo_url'],
            ['value' => $url, 'group' => 'general'],
        );

        return response()->json(['logo_url' => $url]);
    }
}

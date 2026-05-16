<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ImageUploadService
{
    public function store(?UploadedFile $file, string $folder): ?string
    {
        if (! $file) {
            return null;
        }

        return $file->store($folder, config('filesystems.attendance_disk', 'r2'));
    }
}

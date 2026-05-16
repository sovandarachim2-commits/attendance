<?php

namespace App\Services;

class GpsValidationService
{
    public function distanceMeters(float $fromLat, float $fromLng, float $toLat, float $toLng): float
    {
        $earthRadius = 6371000;
        $latDelta = deg2rad($toLat - $fromLat);
        $lngDelta = deg2rad($toLng - $fromLng);
        $a = sin($latDelta / 2) ** 2
            + cos(deg2rad($fromLat)) * cos(deg2rad($toLat)) * sin($lngDelta / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    public function assertWithinRadius(float $lat, float $lng, float $targetLat, float $targetLng, int $radius): array
    {
        $distance = $this->distanceMeters($lat, $lng, $targetLat, $targetLng);

        return [
            'valid' => $distance <= $radius,
            'distance_meters' => round($distance, 2),
            'radius_meters' => $radius,
        ];
    }

    public function suspicious(?float $accuracy, ?float $speed): bool
    {
        return ($accuracy !== null && $accuracy > 150) || ($speed !== null && $speed > 55);
    }
}

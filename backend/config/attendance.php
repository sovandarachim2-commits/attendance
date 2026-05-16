<?php

return [
    'office_start_time' => env('ATTENDANCE_OFFICE_START_TIME', '08:30:00'),
    'missing_checkout_alert_time' => env('ATTENDANCE_MISSING_CHECKOUT_ALERT_TIME', '18:30:00'),
    'default_radius_meters' => env('ATTENDANCE_DEFAULT_RADIUS_METERS', 100),
    'face_verification_enabled' => env('FACE_VERIFICATION_ENABLED', false),
];

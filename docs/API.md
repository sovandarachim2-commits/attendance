# Attendance Sales Tracker API

Base URL: `http://localhost:8000/api`

Authentication uses Laravel Sanctum bearer tokens.

## Public

- `POST /auth/login` returns `{ token, user }`
- `POST /auth/forgot-password` sends a password reset link

## Authenticated

- `GET /auth/me`
- `POST /auth/logout`
- `GET /attendance/today`
- `POST /attendance/check-in`
- `POST /attendance/check-out`
- `GET /customer-visits`
- `POST /customer-visits`
- `PATCH /customer-visits/{customerVisit}/checkout`
- `GET /reports`
- `POST /reports`
- `GET /notifications`
- `PATCH /notifications/{notification}/read`

## Admin / Manager

- `GET /dashboard`
- `GET /attendance`
- `PATCH /attendance/{attendance}/edit`
- `GET|POST|PUT|DELETE /employees`
- `GET /reports/export`
- `GET /qr/office`

## Attendance Payload

`POST /attendance/check-in`

```json
{
  "type": "office",
  "latitude": 13.7563,
  "longitude": 100.5018,
  "accuracy": 12,
  "qr_code": "office_attendance_nonce",
  "notes": "Arrived at head office"
}
```

Use `multipart/form-data` and include `photo` for selfie proof. Outdoor visits require `selfie` and `store_photo`.

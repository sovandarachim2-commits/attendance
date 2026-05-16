# Deployment Guide

For local development, use the root scripts:

```powershell
cd C:\xampp\htdocs\Attadance
.\start-api.ps1
```

```powershell
cd C:\xampp\htdocs\Attadance
.\start-web.ps1
```

## Backend

1. Create MySQL database `attendance_sales`.
2. Copy `backend/.env.example` to `backend/.env` and fill MySQL, R2, mail, and Telegram credentials.
3. Run:

```bash
cd backend
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan config:cache
php artisan route:cache
```

4. Point the web server document root to `backend/public`.

## Frontend

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Set `VITE_API_URL` and `VITE_GOOGLE_MAPS_API_KEY`.
3. Run:

```bash
cd frontend
npm install
npm run build
```

4. Deploy `frontend/dist` to your static host or serve behind Nginx/Apache.

## Cloudflare R2

Use the S3-compatible endpoint:

```env
ATTENDANCE_IMAGE_DISK=r2
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=
```

## Production Notes

- Enable HTTPS for browser GPS and camera APIs.
- Configure queue workers for notifications and exports.
- Use short-lived QR payloads for office check-in.
- Keep `FACE_VERIFICATION_ENABLED=false` until a face provider/model is connected.

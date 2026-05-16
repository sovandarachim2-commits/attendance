# Employee Attendance & Outdoor Sales Tracking

This project is a full-stack web application for a wholesale cosmetics company. It manages employee attendance, GPS-based check-in/check-out, outdoor sales visits, selfie/photo proof, reports, notifications, and admin dashboards.

## Tech Stack

```text
Backend:  Laravel 12, PHP, Sanctum API authentication
Frontend: React, Vite, Tailwind CSS
Database: MySQL
Storage:  Local public disk for development, Cloudflare R2 ready for production
Maps:     Google Maps API ready
```

## Project Structure

```text
Attadance/
  backend/                 Laravel API
    .env                   Backend real config
    .env.example           Backend config template
    app/Models             Database models
    app/Http/Controllers   API controllers
    app/Services           Attendance, GPS, upload, Telegram logic
    app/Repositories       Query helpers
    database/migrations    MySQL table structure
    routes/api.php         API route list

  frontend/                React app
    .env.example           Frontend config template
    src/App.jsx            Main UI and page screens
    src/services/api.js    Axios API client

  database/schema.sql      Reference MySQL schema
  docs/API.md              API endpoint notes
  docs/DEPLOYMENT.md       Deployment guide
  docs/PROJECT_STRUCTURE.md Simple structure guide
  start-api.ps1            Start Laravel server
  start-web.ps1            Start React server
```

## Main Features

- Login and logout with Laravel Sanctum token auth
- Role-ready structure for admin, manager, and employee
- Employee profile data
- Attendance check-in and check-out
- Browser camera selfie capture
- Browser GPS location capture
- Photo upload with attendance
- Duplicate daily check-in prevention
- Late status calculation
- Attendance history
- Admin dashboard API
- Customer visit records
- Outdoor sales route/GPS points
- Reports and CSV export
- Notifications structure
- Attendance edit audit logs
- Cloudflare R2-ready upload config
- Telegram notification service ready
- Face verification-ready field structure

## Run The App

Start **MySQL** in XAMPP first.

Open PowerShell 1 for the backend:

```powershell
cd C:\xampp\htdocs\Attadance
.\start-api.ps1
```

Open PowerShell 2 for the frontend:

```powershell
cd C:\xampp\htdocs\Attadance
.\start-web.ps1
```

Open the app:

```text
http://127.0.0.1:5173
```

Backend API runs here:

```text
http://127.0.0.1:8000/api
```

## Login

Seeded admin account:

```text
Email: admin@example.com
Password: password
```

Use real accounts from the `users` table after you add employees and users.

## Env Files

Keep env files inside their own app folders:

```text
backend/.env       Laravel backend config
frontend/.env      React frontend config, optional
```

Do not move `backend/.env` to the root folder. Laravel reads `.env` from:

```text
C:\xampp\htdocs\Attadance\backend\.env
```

To create frontend env:

```powershell
cd C:\xampp\htdocs\Attadance\frontend
copy .env.example .env
```

Frontend values:

```env
VITE_API_URL=http://127.0.0.1:8000/api
VITE_GOOGLE_MAPS_API_KEY=
```

## Database Setup

Create database:

```powershell
C:\xampp\mysql\bin\mysql.exe -uroot -e "CREATE DATABASE IF NOT EXISTS attendance_sales CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Run migrations and seed:

```powershell
cd C:\xampp\htdocs\Attadance\backend
C:\xampp\php\php.exe artisan migrate --seed
```

Reset database:

```powershell
cd C:\xampp\htdocs\Attadance\backend
C:\xampp\php\php.exe artisan migrate:fresh --seed
```

## Important Backend Files

```text
backend/routes/api.php
```

All API routes.

```text
backend/app/Http/Controllers/Api/AuthController.php
```

Login, logout, current user, forgot password.

```text
backend/app/Http/Controllers/Api/AttendanceController.php
```

Attendance list, today status, check-in, check-out, admin edit.

```text
backend/app/Services/AttendanceService.php
```

Main attendance business logic.

```text
backend/app/Services/GpsValidationService.php
```

GPS distance/radius validation.

```text
backend/app/Services/ImageUploadService.php
```

Selfie and photo upload storage.

```text
backend/database/migrations/
```

Database table definitions.

## Important Frontend Files

```text
frontend/src/App.jsx
```

Main UI screens, dashboard, login, camera modal, attendance buttons.

```text
frontend/src/services/api.js
```

Axios API client and auth/attendance service calls.

## Current API Endpoints

Public:

```text
POST /api/auth/login
POST /api/auth/forgot-password
```

Authenticated:

```text
GET  /api/auth/me
POST /api/auth/logout
GET  /api/dashboard
GET  /api/attendance/today
GET  /api/attendance
POST /api/attendance/check-in
POST /api/attendance/check-out
PATCH /api/attendance/{attendance}/edit
GET  /api/employees
POST /api/employees
GET  /api/customer-visits
POST /api/customer-visits
GET  /api/reports
POST /api/reports
GET  /api/reports/export
GET  /api/notifications
GET  /api/qr/office
```

More details are in:

```text
docs/API.md
```

## Attendance Check-In / Check-Out Flow

1. User clicks `Check In` or `Check Out`.
2. Browser opens camera.
3. Browser asks for GPS permission.
4. User takes selfie.
5. Frontend sends photo, latitude, longitude, accuracy, and notes to Laravel API.
6. Backend saves attendance and GPS location.
7. Dashboard refreshes with real data.

Camera and GPS usually require:

```text
http://127.0.0.1
```

or HTTPS in production.

## Storage

Development currently uses:

```env
ATTENDANCE_IMAGE_DISK=public
```

This makes local camera uploads easier.

Production can use Cloudflare R2:

```env
ATTENDANCE_IMAGE_DISK=r2
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=
```

After changing backend `.env`, run:

```powershell
cd C:\xampp\htdocs\Attadance\backend
C:\xampp\php\php.exe artisan config:clear
```

## Useful Commands

Backend route list:

```powershell
cd C:\xampp\htdocs\Attadance\backend
C:\xampp\php\php.exe artisan route:list
```

Backend syntax/cache clear:

```powershell
cd C:\xampp\htdocs\Attadance\backend
C:\xampp\php\php.exe artisan config:clear
```

Frontend lint:

```powershell
cd C:\xampp\htdocs\Attadance\frontend
npm run lint
```

Frontend build:

```powershell
cd C:\xampp\htdocs\Attadance\frontend
npm run build
```

## What Is Real Now

- Login uses backend API.
- Dashboard reads backend API data.
- Employees page reads backend API data.
- Attendance page reads backend API data.
- Reports page reads backend API data.
- Notifications page reads backend API data.
- Check-in/check-out opens camera and uses GPS.
- CSV export uses authenticated backend API.

## Still To Build Next

- Full employee add/edit form UI
- Full customer visit form UI
- Report submission form UI
- Notification mark-as-read UI
- QR scanner UI
- Admin attendance edit modal
- Google Maps API key setup for live map rendering
- Production Cloudflare R2 credentials

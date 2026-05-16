# Easy Project Structure

```text
Attadance/
  README.md                Start here
  start-api.ps1            Runs Laravel API on port 8000
  start-web.ps1            Runs React app on port 5173

  backend/                 Laravel 12 REST API
    .env                   Backend real settings
    .env.example           Backend settings template
    app/
      Http/Controllers/Api Authentication, dashboard, attendance, visits, reports
      Http/Middleware      Role middleware
      Models               Eloquent domain models
      Repositories         Query/repository layer
      Services             GPS, attendance, image upload, Telegram
    config/attendance.php  Attendance business settings
    database/migrations    MySQL schema migrations
    routes/api.php         REST API routes
  frontend/                React + Vite + Tailwind UI
    .env                   Frontend real settings, create from .env.example
    .env.example           Frontend settings template
    src/App.jsx            SaaS dashboard shell and pages
    src/services/api.js    Axios API client and auth/attendance services

  database/schema.sql      MySQL reference schema
  docs/API.md              Endpoint map and payload notes
  docs/DEPLOYMENT.md       Production deployment guide
```

## Where To Edit

- UI changes: `frontend/src/App.jsx`
- API routes: `backend/routes/api.php`
- Attendance logic: `backend/app/Services/AttendanceService.php`
- GPS rule: `backend/app/Services/GpsValidationService.php`
- Database tables: `backend/database/migrations/`
- Backend env: `backend/.env`
- Frontend env: `frontend/.env`

## Architecture

- Laravel Sanctum protects API routes with bearer tokens.
- Role middleware gates admin and manager-only features.
- Attendance service blocks duplicate check-in, validates office GPS radius, calculates late minutes, stores photos in Cloudflare R2, and records GPS history.
- Admin attendance edits require a reason and create `attendance_logs`.
- Outdoor sales visits store customer/store location, selfie, store photo, duration, and route points.
- Frontend is mobile-first with sidebar navigation, dashboard cards, charts, tables, maps, and dark/light mode.

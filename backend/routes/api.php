<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerVisitController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\IpRestrictionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\PositionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard', DashboardController::class)->middleware('permission:dashboard_access,employee_dashboard_access');

    Route::get('/attendance', [AttendanceController::class, 'index'])->middleware('permission:view_all_attendance,view_own_attendance');
    Route::get('/attendance/today', [AttendanceController::class, 'today'])->middleware('permission:view_own_attendance,view_all_attendance');
    Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn'])->middleware('permission:attendance_check_in,office_check_in');
    Route::post('/attendance/check-out', [AttendanceController::class, 'checkOut'])->middleware('permission:attendance_check_out,office_check_out');
    Route::patch('/attendance/{attendance}/edit', [AttendanceController::class, 'edit'])->middleware('permission:edit_attendance');

    Route::get('/employee-options', [EmployeeController::class, 'options'])->middleware('permission:create_employee,edit_employee,manage_employees');
    Route::get('/employees', [EmployeeController::class, 'index'])->middleware('permission:manage_employees,view_employee_profiles');
    Route::post('/employees', [EmployeeController::class, 'store'])->middleware('permission:create_employee');
    Route::get('/employees/{employee}', [EmployeeController::class, 'show'])->middleware('permission:manage_employees,view_employee_profiles');
    Route::match(['put', 'patch'], '/employees/{employee}', [EmployeeController::class, 'update'])->middleware('permission:edit_employee');
    Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])->middleware('permission:delete_employee');
    Route::apiResource('/departments', DepartmentController::class)->except(['show'])->middleware('permission:manage_departments');
    Route::apiResource('/positions', PositionController::class)->except(['show'])->middleware('permission:manage_positions');
    Route::get('/roles/permissions', [RoleController::class, 'permissions'])->middleware('permission:manage_roles,manage_permissions');
    Route::apiResource('/roles', RoleController::class)->except(['show'])->middleware('permission:manage_roles');
    Route::apiResource('/permissions', PermissionController::class)->except(['show'])->middleware('permission:manage_permissions');

    Route::get('/customer-visits', [CustomerVisitController::class, 'index'])->middleware('permission:view_customer_visits,manage_customer_visits,create_customer_visit');
    Route::post('/customer-visits', [CustomerVisitController::class, 'store'])->middleware('permission:create_customer_visit,manage_customer_visits');
    Route::patch('/customer-visits/{customerVisit}/checkout', [CustomerVisitController::class, 'checkout'])->middleware('permission:edit_customer_visit,manage_customer_visits');

    Route::get('/reports', [ReportController::class, 'index'])->middleware('permission:view_reports,view_own_reports,view_sales_reports,view_attendance_reports');
    Route::post('/reports', [ReportController::class, 'store'])->middleware('permission:submit_daily_report');
    Route::get('/reports/export', [ReportController::class, 'export'])->middleware('permission:export_reports,export_excel_reports,export_sales_reports,export_attendance_reports');

    Route::get('/notifications', [NotificationController::class, 'index'])->middleware('permission:receive_notifications,manage_notifications');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->middleware('permission:receive_notifications,manage_notifications');

    Route::get('/ip-restrictions', [IpRestrictionController::class, 'index'])->middleware('permission:manage_roles');
    Route::post('/ip-restrictions', [IpRestrictionController::class, 'store'])->middleware('permission:manage_roles');
    Route::delete('/ip-restrictions/{ipRestriction}', [IpRestrictionController::class, 'destroy'])->middleware('permission:manage_roles');
});

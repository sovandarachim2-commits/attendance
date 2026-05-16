<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerVisit;
use App\Models\GpsLocation;
use App\Services\ImageUploadService;
use Illuminate\Http\Request;

class CustomerVisitController extends Controller
{
    public function __construct(private ImageUploadService $images) {}

    public function index(Request $request)
    {
        return CustomerVisit::with('employee.department')
            ->when(! $request->user()->hasAnyPermission('view_customer_visits', 'manage_customer_visits'), fn ($query) => $query->where('employee_id', $request->user()->employee_id))
            ->when($request->employee_id, fn ($query, $id) => $query->where('employee_id', $id))
            ->when($request->date, fn ($query, $date) => $query->whereDate('check_in_at', $date))
            ->latest('check_in_at')
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $employee = $request->user()->employee()->firstOrFail();
        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:160'],
            'store_name' => ['nullable', 'string', 'max:160'],
            'contact_person' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string', 'max:2000'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'selfie' => ['required', 'image', 'max:4096'],
            'store_photo' => ['required', 'image', 'max:4096'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $visit = CustomerVisit::create([
            ...$data,
            'employee_id' => $employee->id,
            'check_in_at' => now(),
            'selfie_path' => $this->images->store($request->file('selfie'), 'visits/selfies'),
            'store_photo_path' => $this->images->store($request->file('store_photo'), 'visits/stores'),
        ]);

        GpsLocation::create([
            'employee_id' => $employee->id,
            'customer_visit_id' => $visit->id,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'recorded_at' => now(),
            'source' => 'customer_visit',
        ]);

        return $visit;
    }

    public function checkout(CustomerVisit $customerVisit)
    {
        $customerVisit->update([
            'check_out_at' => now(),
            'duration_minutes' => $customerVisit->check_in_at?->diffInMinutes(now()) ?? 0,
            'status' => 'closed',
        ]);

        return $customerVisit->fresh();
    }
}

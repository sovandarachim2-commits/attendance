<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Position;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PositionController extends Controller
{
    public function index()
    {
        return Position::query()
            ->with('department')
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('positions', 'code')],
            'status' => ['required', 'in:active,inactive'],
        ]);

        return Position::create($data)->load('department');
    }

    public function update(Request $request, Position $position)
    {
        $data = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('positions', 'code')->ignore($position->id)],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $position->update($data);

        return $position->fresh('department');
    }

    public function destroy(Position $position)
    {
        $position->delete();

        return response()->noContent();
    }
}

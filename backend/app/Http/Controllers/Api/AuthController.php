<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $username = $request->input('username');

        $user = User::with(['role.permissions', 'employee.department', 'employee.position', 'employee.branch'])
            ->where('name', $username)
            ->orWhere('email', $username)
            ->first();

        if (! $user || ! Hash::check($request->input('password'), $user->password) || $user->status !== 'active') {
            throw ValidationException::withMessages(['username' => 'Invalid username or password.']);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'token' => $user->createToken('attendance-api')->plainTextToken,
            'user' => $user,
        ]);
    }

    public function me(Request $request)
    {
        return $request->user()->load(['role.permissions', 'employee.department', 'employee.position', 'employee.branch']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        $status = Password::sendResetLink($request->only('email'));

        return response()->json(['status' => __($status)]);
    }
}

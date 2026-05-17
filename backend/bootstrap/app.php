<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureRole::class,
            'permission' => \App\Http\Middleware\EnsurePermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

// Single shared .env at project root (Attadance/.env)
$rootEnvPath = dirname(__DIR__, 2);
if (is_file($rootEnvPath.DIRECTORY_SEPARATOR.'.env') || is_file($rootEnvPath.DIRECTORY_SEPARATOR.'.env.example')) {
    $app->useEnvironmentPath($rootEnvPath);
}

return $app;

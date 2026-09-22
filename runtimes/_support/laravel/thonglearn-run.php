<?php

// ThongLearn: boots this Laravel app, then runs one lesson file inside it.
// Copied into runtimes/laravel by `npm run setup:runtimes`; called by lib/local-runner.ts as
//   php thonglearn-run.php /tmp/…/lesson.php
// The database is SQLite :memory: (set by the runner), migrated fresh on every run.

use Illuminate\Contracts\Console\Kernel as ConsoleKernel;
use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\HttpFoundation\Response;

define('LARAVEL_START', microtime(true));

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$app->make(ConsoleKernel::class)->bootstrap();
Artisan::call('migrate', ['--force' => true]);

/** Send a request through the app's HTTP kernel, the way a browser request would arrive. */
function visit(string $uri, string $method = 'GET', array $data = []): Response
{
    return app(HttpKernel::class)->handle(Request::create($uri, $method, $data));
}

require $argv[1];

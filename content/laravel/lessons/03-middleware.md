---
title: Middleware
section: 1 · The Basics
---

Middleware inspect and filter requests before they reach your route. Picture them as layers the request must pass through: each layer can look at it, change it, or turn it away. Laravel's own `auth` and CSRF checks are middleware.

A middleware is a class with a `handle` method. Call `$next($request)` to let the request through, or return a response to stop it.

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

class EnsureTokenIsValid
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->input('token') !== 'my-secret-token') {
            return redirect('/home');
        }

        return $next($request);
    }
}

Route::get('/secret', fn () => 'Welcome in')->middleware(EnsureTokenIsValid::class);

$blocked = visit('/secret');
echo $blocked->getStatusCode(), ' → ', $blocked->headers->get('Location'), PHP_EOL;
echo visit('/secret?token=my-secret-token')->getContent(), PHP_EOL;
```

In an app, you'd create this class with `php artisan make:middleware EnsureTokenIsValid`, which puts it in `app/Http/Middleware`.

## Before or after

Code above `$next($request)` runs **before** your route. Code after it runs **after**, with the response in hand, so you can change it on its way out.

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

class AddPoweredBy
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);                        // the route runs here
        $response->headers->set('X-Powered-By', 'ThongLearn');

        return $response;
    }
}

Route::get('/about', fn () => 'About us')->middleware(AddPoweredBy::class);

echo visit('/about')->headers->get('X-Powered-By');
```

## Parameters and groups

A middleware can take extra arguments after `$next`. Pass them after a `:`, separated by commas. To share middleware across many routes, wrap them in a **group**; `prefix` adds a URI prefix to each route in it.

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if ($request->header('X-Role') !== $role) {
            abort(403);
        }

        return $next($request);
    }
}

Route::prefix('admin')->middleware(EnsureRole::class.':editor')->group(function () {
    Route::get('/users', fn () => 'All users');   // matches /admin/users
});

echo visit('/admin/users')->getStatusCode(), PHP_EOL;  // 403
```

```php-snippet
// bootstrap/app.php: aliases and global middleware
->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias(['role' => EnsureRole::class]);   // then ->middleware('role:editor')
    $middleware->append(AddPoweredBy::class);            // runs on every request
})
```

> 💡 **Tip:** routes in `routes/web.php` automatically get the `web` middleware group: cookies, the session, CSRF protection and route model binding.

## Challenge

> 🎯 **Challenge:** Finish the `RequireJson` middleware so it returns a `406` response when the request's `Accept` header isn't `application/json`, and lets the request through otherwise. `GET /api/ping` already uses it.

```php starter
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

class RequireJson
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }
}

Route::get('/api/ping', fn () => ['pong' => true])->middleware(RequireJson::class);
```

```php solution
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

class RequireJson
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->header('Accept') !== 'application/json') {
            return response('JSON only', 406);
        }

        return $next($request);
    }
}

Route::get('/api/ping', fn () => ['pong' => true])->middleware(RequireJson::class);
```

```php check
$kernel = app(\Illuminate\Contracts\Http\Kernel::class);
$plain = $kernel->handle(\Illuminate\Http\Request::create('/api/ping', 'GET', [], [], [], ['HTTP_ACCEPT' => 'text/html']));
expect($plain->getStatusCode() === 406, "Without Accept: application/json, expect 406 (got {$plain->getStatusCode()}).");
$json = $kernel->handle(\Illuminate\Http\Request::create('/api/ping', 'GET', [], [], [], ['HTTP_ACCEPT' => 'application/json']));
expect($json->getStatusCode() === 200, "With Accept: application/json, the request should pass (got {$json->getStatusCode()}).");
expect(str_contains($json->getContent(), 'pong'), "The route's response should come through.");
```

**Reference:** [Middleware](https://laravel.com/docs/13.x/middleware) in the Laravel 13 docs.

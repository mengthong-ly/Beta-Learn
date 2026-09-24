---
title: Middleware & the pipeline
section: Guide Book
summary: The onion model, before and after work, parameters and groups, terminable middleware — and the pipeline class that powers it all.
---
Middleware is a layer wrapped around the request. Each layer decides whether to pass the request inward, and gets a chance to change the response on the way back out.

```text
request  ──► [ A ──► [ B ──► [ route ] ──► B ] ──► A ] ──► response
```

## The shape

Every middleware is a class with one method: `handle($request, Closure $next)`.

```php
<?php

use Illuminate\Support\Facades\Route;

class AddHeader
{
    public function handle($request, \Closure $next)
    {
        // before: the request has not reached the route yet
        $response = $next($request);
        // after: the route has run and produced a response
        return $response->header('X-Powered-By-Guide', 'yes');
    }
}

Route::get('/wrapped', fn () => 'the route ran')->middleware(AddHeader::class);

$r = visit('/wrapped');
echo $r->getContent(), ' | header: ', $r->headers->get('X-Powered-By-Guide'), PHP_EOL;
```

## Order is visible

Register several and the nesting becomes obvious.

```php
<?php

use Illuminate\Support\Facades\Route;

class Outer
{
    public function handle($request, \Closure $next)
    {
        echo "  outer: before", PHP_EOL;
        $response = $next($request);
        echo "  outer: after", PHP_EOL;
        return $response;
    }
}

class Inner
{
    public function handle($request, \Closure $next)
    {
        echo "  inner: before", PHP_EOL;
        $response = $next($request);
        echo "  inner: after", PHP_EOL;
        return $response;
    }
}

Route::get('/onion', function () {
    echo "  route body", PHP_EOL;
    return 'done';
})->middleware([Outer::class, Inner::class]);

visit('/onion');
echo 'finished', PHP_EOL;
```

Outer runs first on the way in and **last** on the way out. That symmetry is the whole model.

## Short-circuiting

A middleware that does not call `$next()` stops the request. The route never runs.

```php
<?php

use Illuminate\Support\Facades\Route;

class RequireToken
{
    public function handle($request, \Closure $next)
    {
        if ($request->query('token') !== 'secret') {
            return response('Forbidden', 403);
        }
        return $next($request);
    }
}

Route::get('/private', fn () => 'the good stuff')->middleware(RequireToken::class);

echo visit('/private')->getStatusCode(), PHP_EOL;                 // 403
echo visit('/private?token=secret')->getContent(), PHP_EOL;       // allowed through
```

> 🧭 **Scenario:** An authorisation check written inside every controller action is five lines duplicated fifteen times, and the sixteenth action is the one someone forgets. The same check as middleware applies to a whole route group and cannot be forgotten — that is the security argument for middleware, and it is stronger than the tidiness argument.

## Parameters

Anything after a colon is passed to `handle()` as an extra argument.

```php
<?php

use Illuminate\Support\Facades\Route;

class RequireRole
{
    public function handle($request, \Closure $next, string ...$roles)
    {
        $role = $request->query('role', 'guest');
        if (! in_array($role, $roles, true)) {
            return response("need one of: " . implode(', ', $roles), 403);
        }
        return $next($request);
    }
}

Route::get('/admin', fn () => 'admin area')
    ->middleware(RequireRole::class . ':admin,owner');

echo visit('/admin?role=guest')->getContent(), PHP_EOL;
echo visit('/admin?role=admin')->getContent(), PHP_EOL;
```

This is the mechanism behind `auth:sanctum`, `throttle:60,1` and `can:update,post`.

## Aliases and groups

In `bootstrap/app.php` you give middleware short names and bundle them into groups.

```php-snippet
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => RequireRole::class,
    ]);

    $middleware->appendToGroup('web', [
        AddHeader::class,
    ]);

    $middleware->prepend(TrustProxies::class);   // global, before everything
})
```

`web` and `api` are the two built-in groups. `web` adds sessions, cookies and CSRF; `api` is deliberately stateless.

> 🔍 **Behind the scenes: `Pipeline` is fifteen lines**
>
> The onion is built by `Illuminate\Pipeline\Pipeline`, which folds the middleware list into nested closures with `array_reduce` — each one capturing the next. The result is a single callable: call it with the request and every layer runs in order. It is the same pattern as function composition, and you can use it yourself for any "pass this through a series of steps" problem, not just HTTP.

```php
<?php

use Illuminate\Pipeline\Pipeline;

$result = app(Pipeline::class)
    ->send('  hello world  ')
    ->through([
        fn ($text, $next) => $next(trim($text)),
        fn ($text, $next) => $next(ucwords($text)),
        fn ($text, $next) => $next(str_replace(' ', '-', $text)),
    ])
    ->thenReturn();

echo $result, PHP_EOL;
```

## Terminable middleware

A `terminate()` method runs **after** the response has been sent to the browser — the right place for slow, non-essential work.

```php
<?php

use Illuminate\Support\Facades\Route;

class LogRequest
{
    public function handle($request, \Closure $next)
    {
        return $next($request);
    }

    public function terminate($request, $response): void
    {
        echo "  terminate: logged {$request->path()} → {$response->getStatusCode()}", PHP_EOL;
    }
}

Route::get('/logged', fn () => 'response body')->middleware(LogRequest::class);

echo visit('/logged')->getContent(), PHP_EOL;
```

> ⚠️ `terminate()` only runs after a *sent* response, and only under a SAPI that supports it (FastCGI). It is not a queue: work that must happen should be a queued job, not a terminate hook.

## Excluding a middleware

```php
<?php

use Illuminate\Support\Facades\Route;

class Blocker
{
    public function handle($request, \Closure $next)
    {
        return response('blocked by group middleware', 403);
    }
}

Route::middleware([Blocker::class])->group(function () {
    Route::get('/blocked', fn () => 'never reached');

    Route::get('/allowed', fn () => 'made it through')
        ->withoutMiddleware([Blocker::class]);
});

echo visit('/blocked')->getContent(), PHP_EOL;
echo visit('/allowed')->getContent(), PHP_EOL;
```

`withoutMiddleware()` only removes *route* middleware — global middleware cannot be skipped this way.

**Reference:** [Middleware](https://laravel.com/docs/13.x/middleware) in the Laravel documentation.

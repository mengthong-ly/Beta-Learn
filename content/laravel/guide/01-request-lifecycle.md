---
title: How a request becomes a response
section: Guide Book
summary: The journey from `public/index.php` to the bytes a browser receives — and the one object that makes it all fit together.
---
Every Laravel request follows the same path. Knowing it turns "where do I put this?" into a question with an obvious answer.

```text
public/index.php
      │
      ▼
bootstrap/app.php ──► the Application (the service container)
      │
      ▼
HTTP kernel
      │
      ├─► global middleware        (trim strings, handle CORS…)
      │
      ▼
   Router  ──► matches a route
      │
      ├─► route middleware         (auth, throttle, your own)
      │
      ▼
 Controller / closure ──► returns a value
      │
      ▼
   Response ──► middleware again, outward this time
      │
      ▼
      bytes on the wire
```

## One object at the centre

`bootstrap/app.php` builds an `Application` — a **service container** that knows how to construct everything else. Every part of the framework is resolved from it.

```php
<?php

echo 'Laravel ', app()->version(), PHP_EOL;
echo 'environment: ', app()->environment(), PHP_EOL;
echo 'router: ', get_class(app('router')), PHP_EOL;
echo 'config repo: ', get_class(app('config')), PHP_EOL;
echo 'running in console: ', var_export(app()->runningInConsole(), true), PHP_EOL;
```

The `app()` helper *is* the container. Everything else in this chapter is a thing the container hands out.

## Routes are registered, then matched

Route registration builds a table. Nothing is executed until a request arrives and the router finds a match.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/hello', fn () => 'Hello!');
Route::post('/hello', fn () => 'Posted!');

echo visit('/hello')->getContent(), PHP_EOL;
echo visit('/missing')->getStatusCode(), PHP_EOL;   // 404 — no route matched
```

> 🔍 **Behind the scenes: why route registration is cheap but not free**
>
> Every route you define becomes a `Route` object in a `RouteCollection`, built on *every single request*. For a large application that is thousands of objects constructed before the router has even looked at the URL. `php artisan route:cache` serialises the compiled collection to disk so the framework loads one file instead of running your route files — which is why the cache must be rebuilt after any route change, and why closures cannot be cached (a closure cannot be serialised).

## Whatever you return becomes a response

The framework converts your return value. A string becomes a `200 text/html`; an array or a `JsonResource` becomes JSON; a `Response` object is used as-is.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/string', fn () => 'plain text');
Route::get('/array', fn () => ['name' => 'Ada', 'age' => 36]);
Route::get('/custom', fn () => response('made by hand', 201)->header('X-Course', 'ThongLearn'));

$r = visit('/string');
echo $r->getStatusCode(), ' ', $r->headers->get('content-type'), PHP_EOL;

$j = visit('/array');
echo $j->headers->get('content-type'), ' → ', $j->getContent(), PHP_EOL;

$c = visit('/custom');
echo $c->getStatusCode(), ' ', $c->headers->get('X-Course'), ' → ', $c->getContent(), PHP_EOL;
```

## Middleware wraps the whole thing

Middleware is an onion. Each layer sees the request on the way in and the response on the way out.

```php
<?php

use Illuminate\Support\Facades\Route;

class Stopwatch
{
    public function handle($request, \Closure $next)
    {
        // before: on the way in
        $response = $next($request);
        // after: on the way out
        return $response->header('X-Handled', 'yes');
    }
}

Route::get('/timed', fn () => 'work done')->middleware(Stopwatch::class);

$r = visit('/timed');
echo $r->getContent(), ' | X-Handled: ', $r->headers->get('X-Handled'), PHP_EOL;
```

> 🧭 **Scenario:** You need to log how long each request took. A `before` hook cannot know the duration and an `after` hook cannot know the start — but a middleware sees both sides of `$next($request)`, so it is the only place that can. That "both sides" property is why so much of Laravel lives in middleware.

## Errors become responses too

An uncaught exception does not kill the request. The exception handler converts it — to a 500, or to whatever the exception says it is.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/missing-model', fn () => abort(404, 'No such thing'));
Route::get('/not-allowed', fn () => abort(403, 'Nope'));
Route::get('/gone', fn () => abort(410));

foreach (['/missing-model', '/not-allowed', '/gone'] as $uri) {
    echo $uri, ' → ', visit($uri)->getStatusCode(), PHP_EOL;
}
```

Exceptions implementing `HttpExceptionInterface` — which is what `abort()` throws — carry their own status code. Everything else becomes a **500** and is written to the log with a full stack trace.

## Then the process ends

Like any PHP application, Laravel is **shared-nothing**: once the response is sent, the container, every service in it and every loaded model are discarded. The next request builds them all again.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/counter', function () {
    static $count = 0;          // survives within ONE process...
    return 'count: ' . ++$count;
});

echo visit('/counter')->getContent(), PHP_EOL;
echo visit('/counter')->getContent(), PHP_EOL;
echo '…but a real request boundary resets everything', PHP_EOL;
```

> 💡 **Tip:** This is why "just cache it in a static property" is not a caching strategy. Anything that must outlive a request goes in the cache, the session or the database. The exception is a long-running worker — Octane, queues — where the container *does* persist, and where static state becomes a genuine source of cross-request bugs.

## In this course

Your code runs inside a real Laravel 13 application in your browser, with an in-memory SQLite database. `visit('/uri')` sends a request through the full stack above and hands you the `Response`.

**Reference:** [Request Lifecycle](https://laravel.com/docs/13.x/lifecycle) in the Laravel documentation.

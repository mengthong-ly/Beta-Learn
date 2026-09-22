---
title: Responses
section: 1 · The Basics
---

Every route must return a response. The simplest ones are automatic: return a **string** and Laravel turns it into a full HTTP response; return an **array** and it becomes JSON.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/text', fn () => 'Hello World');
Route::get('/numbers', fn () => [1, 2, 3]);

$json = visit('/numbers');
echo $json->headers->get('Content-Type'), ': ', $json->getContent(), PHP_EOL;
```

Eloquent models and collections are turned into JSON the same way.

## Response objects

When you need to choose the status code or headers, build the response yourself with `response()`. Most of its methods are chainable.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/teapot', function () {
    return response("I'm a teapot", 418)
        ->header('Content-Type', 'text/plain')
        ->header('X-Brewing', 'earl-grey');
});

$r = visit('/teapot');
echo $r->getStatusCode(), ' ', $r->headers->get('X-Brewing'), PHP_EOL;
```

`response()->json($data, $status)` sets the `Content-Type: application/json` header and encodes the array for you:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::post('/notes', function () {
    return response()->json(['id' => 1, 'title' => 'Buy milk'], 201);
});

$r = visit('/notes', 'POST');
echo $r->getStatusCode(), ' ', $r->getContent(), PHP_EOL;
```

## Redirects

`redirect('/somewhere')` sends the browser elsewhere with a `302`. `redirect()->away()` goes to another site. For a route that does nothing but redirect, `Route::redirect` is a shortcut; its optional third argument sets the status code.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/dashboard', fn () => redirect('/home/dashboard'));
Route::get('/docs', fn () => redirect()->away('https://laravel.com/docs'));
Route::redirect('/old-blog', '/blog', 301);

foreach (['/dashboard', '/docs', '/old-blog'] as $uri) {
    $r = visit($uri);
    echo "$uri → {$r->getStatusCode()} {$r->headers->get('Location')}", PHP_EOL;
}
```

After a form submit you usually redirect and **flash** a message at the same time: `redirect('/dashboard')->with('status', 'Profile updated!')`. You'll see how flash data works in the session lesson.

## Cookies

`cookie($name, $value, $minutes)` attaches a cookie to the response:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/dark-mode', fn () => response('Theme saved')->cookie('theme', 'dark', 60));

$cookie = visit('/dark-mode')->headers->getCookies()[0];
echo $cookie->getName(), '=', $cookie->getValue(), PHP_EOL;
```

> 💡 **Tip:** in the `web` group, the `EncryptCookies` middleware encrypts and signs every cookie Laravel creates, so the browser can't read or modify it.

## Challenge

> 🎯 **Challenge:** Make `GET /api/status` return the JSON `{"ok":true}` with a `503` status code and a `Retry-After` header of `120`.

```php starter
<?php

use Illuminate\Support\Facades\Route;

Route::get('/api/status', function () {
    return ['ok' => true];
});
```

```php solution
<?php

use Illuminate\Support\Facades\Route;

Route::get('/api/status', function () {
    return response()->json(['ok' => true], 503)
        ->header('Retry-After', '120');
});
```

```php check
$r = visit('/api/status');
expect($r->getStatusCode() === 503, "Expected status 503, got {$r->getStatusCode()}.");
expect(json_decode($r->getContent(), true) === ['ok' => true], "The body should be the JSON {\"ok\":true}.");
expect(str_contains((string) $r->headers->get('Content-Type'), 'application/json'), "The response should be JSON.");
expect($r->headers->get('Retry-After') === '120', "Add a Retry-After header of 120.");
```

**Reference:** [HTTP Responses](https://laravel.com/docs/13.x/responses) in the Laravel 13 docs.

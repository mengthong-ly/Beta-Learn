---
title: Session
section: 1 · The Basics
---

HTTP is stateless: each request arrives knowing nothing about the one before. A **session** stores data about one user across requests. Laravel keeps the data in a backend (files, a database, Redis…) and gives the browser a cookie holding the session's ID.

The session comes from the `StartSession` middleware in the `web` group. Reach it through `$request->session()` or the global `session()` helper.

```php
<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->get('/count', function (Request $request) {
    $n = $request->session()->increment('visits');

    return "Visit number $n";
});

// A tiny "browser": it sends back the cookies it was given, so the app
// recognises the same session on every request.
$cookies = [];
function browse(string $uri): string
{
    global $cookies;
    $response = app(Kernel::class)->handle(Request::create($uri, 'GET', [], $cookies));
    foreach ($response->headers->getCookies() as $cookie) {
        $cookies[$cookie->getName()] = $cookie->getValue();
    }

    return $response->getContent();
}

echo browse('/count'), PHP_EOL;
echo browse('/count'), PHP_EOL;
echo browse('/count'), PHP_EOL;
echo 'Cookies: ', implode(', ', array_keys($cookies)), PHP_EOL;
```

## Reading and writing

| Code | What it does |
|---|---|
| `session('key', 'default')` | read a value, with a default |
| `session(['key' => 'value'])` | store values |
| `$request->session()->put('key', 'value')` | store a value |
| `->has('key')` | present and not `null` |
| `->push('cart', 'pen')` | append to an array value |
| `->pull('key')` | read, then delete |
| `->increment('count')` | add 1 to a number |
| `->forget('key')` / `->flush()` | delete one key / everything |

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->get('/demo', function (Request $request) {
    $session = $request->session();

    session(['theme' => 'dark']);
    $session->push('recent', 'laravel');
    $session->push('recent', 'blade');

    return [
        'theme' => session('theme'),
        'lang' => session('lang', 'en'),       // missing: the default
        'recent' => $session->get('recent'),
        'pulled' => $session->pull('theme'),   // read and delete
        'theme_left' => $session->has('theme'),
    ];
});

echo visit('/demo')->getContent();
```

## Flash data

**Flashed** data lives for the current request and the next one only, then it's gone. That's exactly right for a "Saved!" message shown once after a redirect. `redirect(...)->with('status', '…')` flashes too.

```php
<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::get('/save', function () {
        return redirect('/tasks')->with('status', 'Task was saved!');
    });
    Route::get('/tasks', fn () => session('status', '(no message)'));
});

$cookies = [];
foreach (['/save', '/tasks', '/tasks'] as $uri) {
    $response = app(Kernel::class)->handle(Request::create($uri, 'GET', [], $cookies));
    foreach ($response->headers->getCookies() as $cookie) {
        $cookies[$cookie->getName()] = $cookie->getValue();
    }
    echo "$uri → ", $response->isRedirect() ? 'redirect' : $response->getContent(), PHP_EOL;
}
```

> 💡 **Tip:** `$request->session()->regenerate()` gives the user a new session ID, which prevents session fixation attacks. Laravel's starter kits do it for you when a user logs in.

## Challenge

> 🎯 **Challenge:** Build a session cart. `POST /cart` pushes the `item` input onto the `cart` array in the session. `GET /cart` returns the items joined with `, `, or `Cart is empty` when there are none.

`visit()` doesn't send a CSRF token, so a `POST` from it gets a 419 here. The check sends its requests like a browser on your own site would.

```php starter
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::post('/cart', function (Request $request) {
        return 'Added';
    });

    Route::get('/cart', function (Request $request) {
        return 'Cart is empty';
    });
});
```

```php solution
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::post('/cart', function (Request $request) {
        $request->session()->push('cart', $request->input('item'));

        return 'Added';
    });

    Route::get('/cart', function (Request $request) {
        $items = $request->session()->get('cart', []);

        return $items ? implode(', ', $items) : 'Cart is empty';
    });
});
```

```php check
$jar = [];
$send = function (string $method, string $uri, array $data = []) use (&$jar) {
    // Sec-Fetch-Site: same-origin is what a modern browser sends from your own pages (passes CSRF).
    $request = \Illuminate\Http\Request::create($uri, $method, $data, $jar, [], ['HTTP_SEC_FETCH_SITE' => 'same-origin']);
    $response = app(\Illuminate\Contracts\Http\Kernel::class)->handle($request);
    foreach ($response->headers->getCookies() as $c) $jar[$c->getName()] = $c->getValue();
    return $response;
};
$first = trim($send('GET', '/cart')->getContent());
expect($first === 'Cart is empty', "An empty cart should say 'Cart is empty', got '$first'.");
$send('POST', '/cart', ['item' => 'Pen']);
$send('POST', '/cart', ['item' => 'Ink']);
$cart = trim($send('GET', '/cart')->getContent());
expect($cart === 'Pen, Ink', "After adding Pen and Ink, GET /cart should return 'Pen, Ink', got '$cart'.");
```

**Reference:** [HTTP Session](https://laravel.com/docs/13.x/session) in the Laravel 13 docs.

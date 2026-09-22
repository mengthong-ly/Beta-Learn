---
title: CSRF protection
section: 1 · The Basics
---

A cross-site request forgery (CSRF) is when another website tricks a logged-in user's browser into submitting a form to *your* app, say, one that changes their email. The browser sends the user's cookies along, so the request looks real.

Laravel blocks this with the `PreventRequestForgery` middleware, part of the `web` group. It checks every `POST`, `PUT`, `PATCH` and `DELETE` request. `GET` requests are only reads, so they pass.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::get('/profile', fn () => 'Your profile');
    Route::post('/profile', fn () => 'Saved!');
});

echo visit('/profile')->getStatusCode(), PHP_EOL;          // 200: reading is fine
echo visit('/profile', 'POST')->getStatusCode(), PHP_EOL;  // 419: no CSRF token
```

**419** is the status Laravel uses for a CSRF token mismatch.

## Two layers of defence

First, the middleware reads the browser's `Sec-Fetch-Site` header. Modern browsers send it over HTTPS, and if it says `same-origin`, the request is allowed right away.

If that check doesn't pass (an old browser, or a plain HTTP connection), it falls back to a **CSRF token**: a secret stored in the user's session that another site can't read. `csrf_token()` returns it.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::middleware('web')->get('/token', fn () => csrf_token());

$token = visit('/token')->getContent();
echo strlen($token), ' characters, e.g. ', substr($token, 0, 8), '…', PHP_EOL;
```

Every HTML form that posts to your app needs that token in a hidden `_token` field. The `@csrf` Blade directive writes it for you:

```blade
<form method="POST" action="/profile">
    @csrf
    <!-- same as: <input type="hidden" name="_token" value="{{ csrf_token() }}" /> -->
</form>
```

JavaScript clients can send the token in an `X-CSRF-TOKEN` header instead.

## Routes without CSRF

Some routes are called by other servers, not browsers. Stripe's webhooks can't know your CSRF token. The docs' advice: put these routes **outside** the `web` group. You can also list URIs to skip in `bootstrap/app.php`:

```php-snippet
->withMiddleware(function (Middleware $middleware): void {
    $middleware->preventRequestForgery(except: [
        'stripe/*',
    ]);
})
```

> 💡 **Tip:** CSRF protection is switched off automatically while you run your tests.

## Challenge

> 🎯 **Challenge:** The payment provider's `POST /webhooks/payment` calls keep failing with 419. Fix it so the webhook returns 200, while `POST /profile` stays protected.

```php starter
<?php

use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::post('/profile', fn () => 'Saved!');
    Route::post('/webhooks/payment', fn () => 'Payment received');
});
```

```php solution
<?php

use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::post('/profile', fn () => 'Saved!');
});

Route::post('/webhooks/payment', fn () => 'Payment received');
```

```php check
$hook = visit('/webhooks/payment', 'POST');
expect($hook->getStatusCode() === 200, "POST /webhooks/payment should return 200 (got {$hook->getStatusCode()}).");
expect($hook->getContent() === 'Payment received', "The webhook should still return 'Payment received'.");
$profile = visit('/profile', 'POST')->getStatusCode();
expect($profile === 419, "POST /profile must stay CSRF-protected (expected 419, got $profile).");
```

**Reference:** [CSRF Protection](https://laravel.com/docs/13.x/csrf) in the Laravel 13 docs.

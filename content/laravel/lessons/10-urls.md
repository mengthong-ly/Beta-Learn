---
title: Named routes & URLs
section: 1 · The Basics
---

Hard-coding `/user/42/profile` in twenty templates means twenty edits when the URL changes. Laravel's URL helpers build links for you.

`url()` turns a path into a full URL, using the scheme (HTTP or HTTPS) and host of the current request. `url()->query()` adds a query string.

```php
<?php

echo url('/posts/1'), PHP_EOL;
echo url()->query('/posts', ['search' => 'Laravel', 'sort' => 'new']), PHP_EOL;
```

## Named routes

Give a route a name with `->name()`, then build its URL with `route()`. Route parameters are filled in by key, and any extra keys become the query string. If the URI later changes, every `route()` call follows it.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/user/{id}/profile', fn (string $id) => "Profile $id")->name('profile');

// Laravel indexes route names after loading routes/web.php at boot. Our routes are
// added after boot, so we ask it to re-index them once.
Route::getRoutes()->refreshNameLookups();

echo route('profile', ['id' => 1]), PHP_EOL;
echo route('profile', ['id' => 1, 'photos' => 'yes']), PHP_EOL;
echo route('profile', ['id' => 1], false), PHP_EOL;   // false: a relative URL
```

Route names must be unique. A common convention is `resource.action`, like the `photos.index` names a resource controller creates.

Redirects understand names too: `redirect()->route('profile', ['id' => 1])`, or the shorter `to_route('profile', ['id' => 1])`.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/dashboard', fn () => 'Dashboard')->name('dashboard');
Route::get('/home', fn () => to_route('dashboard'));
Route::getRoutes()->refreshNameLookups();

$r = visit('/home');
echo $r->getStatusCode(), ' → ', $r->headers->get('Location'), PHP_EOL;
```

## Signed URLs

A **signed** URL has a hash in its query string, so Laravel can tell if anyone changed it. It's perfect for an "unsubscribe" link in an email. Create one with `URL::signedRoute` (or `URL::temporarySignedRoute` for one that expires), and protect the route with the `signed` middleware, which answers **403** to a missing or broken signature.

```php
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;

Route::get('/unsubscribe/{user}', fn (string $user) => "User $user unsubscribed")
    ->name('unsubscribe')
    ->middleware('signed');
Route::getRoutes()->refreshNameLookups();

$link = URL::signedRoute('unsubscribe', ['user' => 1]);
echo substr($link, 0, 60), '…', PHP_EOL;

echo visit($link)->getContent(), PHP_EOL;                                // valid
echo visit(str_replace('/1?', '/2?', $link))->getStatusCode(), PHP_EOL;  // tampered: 403
echo visit('/unsubscribe/1')->getStatusCode(), PHP_EOL;                  // unsigned: 403

$expiring = URL::temporarySignedRoute('unsubscribe', now()->plus(minutes: 30), ['user' => 5]);
echo visit($expiring)->getContent(), PHP_EOL;
```

## Challenge

> 🎯 **Challenge:** Name the product route `products.show`, and make `GET /featured` redirect to it for product `42` using the route's **name**, not a hard-coded path.

```php starter
<?php

use Illuminate\Support\Facades\Route;

Route::get('/products/{id}', fn (string $id) => "Product $id");
Route::get('/featured', fn () => redirect('/products/42'));

Route::getRoutes()->refreshNameLookups(); // keep this last
```

```php solution
<?php

use Illuminate\Support\Facades\Route;

Route::get('/products/{id}', fn (string $id) => "Product $id")->name('products.show');
Route::get('/featured', fn () => to_route('products.show', ['id' => 42]));

Route::getRoutes()->refreshNameLookups(); // keep this last
```

```php check
expect(\Illuminate\Support\Facades\Route::has('products.show'), "Name the /products/{id} route 'products.show'.");
expect(route('products.show', ['id' => 7], false) === '/products/7', "route('products.show', ['id' => 7]) should point at /products/7.");
$r = visit('/featured');
expect($r->isRedirect(), "GET /featured should redirect (got status {$r->getStatusCode()}).");
expect(str_ends_with((string) $r->headers->get('Location'), '/products/42'), "GET /featured should redirect to /products/42.");
$src = file_get_contents(__DIR__ . '/lesson.php');
expect(substr_count($src, 'products.show') >= 2, "Redirect using the route name 'products.show', not the path.");
```

**Reference:** [URL Generation](https://laravel.com/docs/13.x/urls) · [Routing: Named Routes](https://laravel.com/docs/13.x/routing#named-routes) in the Laravel 13 docs.

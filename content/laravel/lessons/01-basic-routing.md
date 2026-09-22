---
title: Basic routing
section: 1 · The Basics
---

A route connects a URL to the code that answers it. The most basic Laravel route takes a URI and a closure:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/greeting', function () {
    return 'Hello World';
});

echo visit('/greeting')->getContent();
```

In a real app, routes live in `routes/web.php`, which Laravel loads for you. Here, your code runs inside a real Laravel 13 app, and `visit()` sends a request through it the way a browser would, so you can see the response.

## Any HTTP verb

The router has a method for each HTTP verb: `Route::get`, `post`, `put`, `patch`, `delete` and `options`. `Route::match` takes several verbs and `Route::any` takes them all.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::match(['get', 'post'], '/ping', fn () => 'pong');

echo visit('/ping')->getContent(), PHP_EOL;
echo visit('/nope')->getStatusCode(), PHP_EOL; // no route: 404
```

## Challenge

> 🎯 **Challenge:** Add a `GET /hello` route that returns `Hello, Laravel!`.

```php starter
<?php

use Illuminate\Support\Facades\Route;

// Route::get(...)
```

```php solution
<?php

use Illuminate\Support\Facades\Route;

Route::get('/hello', function () {
    return 'Hello, Laravel!';
});
```

```php check
$response = visit('/hello');
expect($response->getStatusCode() === 200, "GET /hello should exist (got status {$response->getStatusCode()}).");
expect($response->getContent() === 'Hello, Laravel!', "GET /hello should return 'Hello, Laravel!'.");
```

**Reference:** [Routing: Basic Routing](https://laravel.com/docs/13.x/routing#basic-routing) in the Laravel 13 docs.

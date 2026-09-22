---
title: Route parameters
section: 1 · The Basics
---

Most URLs carry data: `/user/42`, `/posts/hello-world`. Wrap a segment in `{}` braces to capture it, and Laravel passes it to your closure.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/user/{id}', function (string $id) {
    return 'User '.$id;
});

echo visit('/user/42')->getContent();
```

Parameters are passed **in order**. The names of your closure's arguments don't have to match the names in the URI, only their positions do.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/posts/{post}/comments/{comment}', function (string $postId, string $commentId) {
    return "Post $postId, comment $commentId";
});

echo visit('/posts/7/comments/3')->getContent();
```

## Optional parameters

Put a `?` after the name to make a segment optional, and give the matching argument a default value.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/hi/{name?}', function (?string $name = 'John') {
    return "Hi, $name!";
});

echo visit('/hi')->getContent(), PHP_EOL;
echo visit('/hi/Ada')->getContent(), PHP_EOL;
```

## Constraints

`where` limits a parameter with a regular expression. Laravel also has helpers for common patterns, such as `whereNumber`, `whereAlpha`, `whereAlphaNumeric`, `whereUuid` and `whereIn`. If the URL doesn't match the pattern, the route doesn't match, and you get a **404**.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/user/{id}', fn (string $id) => "User $id")->whereNumber('id');

Route::get('/category/{category}', fn (string $category) => "Category: $category")
    ->whereIn('category', ['movie', 'song', 'painting']);

echo visit('/user/42')->getContent(), PHP_EOL;
echo visit('/user/abc')->getStatusCode(), PHP_EOL;       // 404
echo visit('/category/song')->getContent(), PHP_EOL;
echo visit('/category/poem')->getStatusCode(), PHP_EOL;  // 404
```

> 💡 **Tip:** a parameter can hold any character except `/`. To capture the rest of a path, slashes included, use `->where('search', '.*')`.

## Challenge

> 🎯 **Challenge:** Add a `GET /square/{n}` route that returns the square of `n` (so `/square/7` returns `49`). Only numbers should match: `/square/abc` must be a 404.

```php starter
<?php

use Illuminate\Support\Facades\Route;

Route::get('/square/{n}', function (string $n) {
    return $n;
});
```

```php solution
<?php

use Illuminate\Support\Facades\Route;

Route::get('/square/{n}', function (string $n) {
    return (string) ($n * $n);
})->whereNumber('n');
```

```php check
$r = visit('/square/7');
expect($r->getStatusCode() === 200, "GET /square/7 should exist (got status {$r->getStatusCode()}).");
expect(trim($r->getContent()) === '49', "GET /square/7 should return 49, got '{$r->getContent()}'.");
expect(trim(visit('/square/12')->getContent()) === '144', "GET /square/12 should return 144.");
$bad = visit('/square/abc')->getStatusCode();
expect($bad === 404, "GET /square/abc should be a 404 (got $bad). Constrain {n} to numbers.");
```

**Reference:** [Routing: Route Parameters](https://laravel.com/docs/13.x/routing#route-parameters) in the Laravel 13 docs.

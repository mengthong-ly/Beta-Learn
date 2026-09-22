---
title: Requests & input
section: 1 · The Basics
---

Type-hint `Illuminate\Http\Request` in a route closure or controller method and Laravel hands you the current request. It knows the path, the method, the headers and, most usefully, the input.

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/admin/users', function (Request $request) {
    return implode(' | ', [
        $request->method(),          // GET
        $request->path(),            // admin/users (no leading slash)
        $request->is('admin/*') ? 'admin area' : 'public',
        $request->header('X-Missing', 'no header'),
    ]);
});

echo visit('/admin/users')->getContent();
```

## Reading input

`input()` reads a value no matter which HTTP verb sent it: query string, form body or JSON. The second argument is a default. `query()` reads only the query string.

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/search', function (Request $request) {
    $q = $request->input('q');
    $sort = $request->query('sort', 'newest');   // default when missing

    return "Searching for '$q', sorted by $sort";
});

echo visit('/search?q=laravel')->getContent();
```

## Typed input

Input always arrives as strings. Ask for the type you want instead of casting by hand: `integer()`, `boolean()` (true for `1`, `"1"`, `"true"`, `"on"` and `"yes"`), `string()`, `array()`, `date()` and `enum()`.

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/products', function (Request $request) {
    return [
        'page' => $request->integer('page'),
        'in_stock' => $request->boolean('in_stock'),
        'tag' => $request->string('tag')->upper()->value(),
    ];
});

echo visit('/products?page=3&in_stock=on&tag=sale')->getContent();
```

Returning an array from a route sends it as JSON.

## Several fields at once

`only()` and `except()` pick a subset. `has()` checks a key is present; `filled()` also requires it not to be empty. Use dot notation to reach into arrays.

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/order', function (Request $request) {
    return [
        'customer' => $request->only(['name', 'email']),
        'has_note' => $request->filled('note'),
        'items' => $request->input('items.*.name'),
    ];
});

echo visit('/order', 'POST', [
    'name' => '  Ada  ',
    'email' => 'ada@example.com',
    'note' => '',
    'items' => [['name' => 'Pen'], ['name' => 'Ink']],
])->getContent();
```

Notice `'  Ada  '` arrived as `"Ada"`. The `TrimStrings` and `ConvertEmptyStringsToNull` global middleware trim every string field and turn empty ones into `null`.

> 💡 **Tip:** `only()` leaves out keys that aren't in the request at all, so you never get surprise `null`s.

## Challenge

> 🎯 **Challenge:** Build `GET /greet`. It reads `name` (default `Guest`) and `times` as an integer (default 1), and returns the greeting `Hi, NAME!` repeated `times` times, separated by spaces. `/greet?name=Ada&times=2` returns `Hi, Ada! Hi, Ada!`.

```php starter
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/greet', function (Request $request) {
    return 'Hi!';
});
```

```php solution
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/greet', function (Request $request) {
    $name = $request->input('name', 'Guest');
    $times = $request->integer('times', 1);

    return implode(' ', array_fill(0, $times, "Hi, $name!"));
});
```

```php check
$a = visit('/greet?name=Ada&times=2')->getContent();
expect($a === 'Hi, Ada! Hi, Ada!', "/greet?name=Ada&times=2 should return 'Hi, Ada! Hi, Ada!', got '$a'.");
$b = visit('/greet')->getContent();
expect($b === 'Hi, Guest!', "/greet with no input should return 'Hi, Guest!', got '$b'.");
$c = visit('/greet?name=Bo&times=3')->getContent();
expect($c === 'Hi, Bo! Hi, Bo! Hi, Bo!', "/greet?name=Bo&times=3 should repeat 3 times, got '$c'.");
```

**Reference:** [HTTP Requests](https://laravel.com/docs/13.x/requests) in the Laravel 13 docs.

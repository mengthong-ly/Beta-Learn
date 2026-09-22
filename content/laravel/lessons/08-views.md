---
title: Views & Blade
section: 1 · The Basics
---

Returning whole HTML pages as PHP strings gets messy fast. **Views** keep your HTML in separate files in `resources/views`, written in Laravel's templating language, **Blade**.

```blade
<!-- resources/views/greeting.blade.php -->
<html>
    <body>
        <h1>Hello, {{ $name }}</h1>
    </body>
</html>
```

The `view` helper finds the file by name (without `.blade.php`) and passes it an array of data. Each key becomes a variable in the template.

```php-snippet
Route::get('/', function () {
    return view('greeting', ['name' => 'James']);
});
```

For a view in a subfolder, use dots: `view('admin.profile')` loads `resources/views/admin/profile.blade.php`.

## Rendering a template here

This lesson can't add files to the app, but `Blade::render` turns a Blade template **string** into HTML. It's the same syntax you'd write in a `.blade.php` file.

```php
<?php

use Illuminate\Support\Facades\Blade;

echo Blade::render('<h1>Hello, {{ $name }}</h1>', ['name' => 'James']);
```

The app you're running in does have one real view, `welcome`, which its `/` route returns:

```php
<?php

use Illuminate\Support\Facades\View;

var_dump(View::exists('welcome'), View::exists('admin.profile'));

$home = visit('/');
echo $home->getStatusCode(), ', ', strlen($home->getContent()), ' bytes of HTML', PHP_EOL;
```

## `{{ }}` escapes for you

Blade sends everything inside `{{ }}` through PHP's `htmlspecialchars`, so text from users can't inject HTML or scripts (an XSS attack). `{!! !!}` prints raw, unescaped output. Only use it for HTML you trust.

```php
<?php

use Illuminate\Support\Facades\Blade;

$comment = '<script>alert("hacked")</script>';

echo Blade::render('Safe: {{ $comment }}', ['comment' => $comment]), PHP_EOL;
echo Blade::render('Raw:  {!! $comment !!}', ['comment' => $comment]), PHP_EOL;
```

You can put any PHP expression inside `{{ }}`, not just variables: `{{ strtoupper($name) }}`, `{{ count($items) }}`.

## Sharing data with every view

`View::share` makes a value available to all views. You'd usually call it in a service provider's `boot` method.

```php
<?php

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\View;

View::share('appName', 'ThongLearn');

echo Blade::render('Welcome to {{ $appName }}, {{ $name }}!', ['name' => 'Ada']);
```

## Challenge

> 🎯 **Challenge:** Make `GET /hello/{name}` return `<p>Hello, NAME!</p>` rendered with Blade, so the name is escaped. `/hello/Ada` returns `<p>Hello, Ada!</p>`, and a name like `<Bo>` must come out as `&lt;Bo&gt;`.

```php starter
<?php

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Route;

Route::get('/hello/{name}', function (string $name) {
    return "<p>Hello, $name!</p>";
});
```

```php solution
<?php

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Route;

Route::get('/hello/{name}', function (string $name) {
    return Blade::render('<p>Hello, {{ $name }}!</p>', ['name' => $name]);
});
```

```php check
$a = visit('/hello/Ada')->getContent();
expect($a === '<p>Hello, Ada!</p>', "/hello/Ada should return '<p>Hello, Ada!</p>', got '$a'.");
$b = visit('/hello/' . rawurlencode('<Bo>'))->getContent();
expect($b === '<p>Hello, &lt;Bo&gt;!</p>', "The name must be escaped: got '$b'. Use {{ }} in Blade.");
```

**Reference:** [Views](https://laravel.com/docs/13.x/views) · [Blade Templates: Displaying Data](https://laravel.com/docs/13.x/blade#displaying-data) in the Laravel 13 docs.

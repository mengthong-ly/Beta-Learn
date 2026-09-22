---
title: Controllers
section: 1 · The Basics
---

Closures in a route file are fine for a few routes. As an app grows, you'll want to group related request handling in a **controller** class: a `UserController` handles showing, creating, updating and deleting users.

A controller is a class with public methods. Point a route at one with `[ClassName::class, 'method']`, and route parameters are passed to the method.

```php
<?php

use Illuminate\Support\Facades\Route;

class UserController
{
    public function show(string $id): string
    {
        return "Profile of user $id";
    }
}

Route::get('/user/{id}', [UserController::class, 'show']);

echo visit('/user/7')->getContent();
```

In an app, `php artisan make:controller UserController` creates the class in `app/Http/Controllers`. Controllers don't have to extend a base class.

## Injecting the request

The service container builds your controllers, so any type-hinted dependency is passed in for you. The most common one is the `Request`. List route parameters **after** your dependencies.

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

class UserController
{
    public function update(Request $request, string $id): string
    {
        return "User $id is now called {$request->input('name')}";
    }
}

Route::put('/user/{id}', [UserController::class, 'update']);

echo visit('/user/7', 'PUT', ['name' => 'Ada'])->getContent();
```

## Single action controllers

A controller with only an `__invoke` method handles one action. Register it without a method name.

```php
<?php

use Illuminate\Support\Facades\Route;

class ProvisionServer
{
    public function __invoke(): string
    {
        return 'Provisioning a new server…';
    }
}

Route::post('/server', ProvisionServer::class);

echo visit('/server', 'POST')->getContent();
```

## Resource controllers

Most models need the same CRUD actions. `Route::resource` registers all seven routes in one line, each pointing at a conventionally named method:

| Verb | URI | Action | Route name |
|---|---|---|---|
| GET | `/photos` | index | photos.index |
| GET | `/photos/create` | create | photos.create |
| POST | `/photos` | store | photos.store |
| GET | `/photos/{photo}` | show | photos.show |
| GET | `/photos/{photo}/edit` | edit | photos.edit |
| PUT/PATCH | `/photos/{photo}` | update | photos.update |
| DELETE | `/photos/{photo}` | destroy | photos.destroy |

`Route::apiResource` leaves out `create` and `edit`, the two routes that show HTML forms. `only` and `except` pick a subset.

```php
<?php

use Illuminate\Support\Facades\Route;

class PhotoController
{
    public function index() { return 'All photos'; }
    public function store() { return 'Photo saved'; }
    public function show(string $photo) { return "Photo #$photo"; }
    public function update(string $photo) { return "Photo #$photo updated"; }
    public function destroy(string $photo) { return "Photo #$photo deleted"; }
}

Route::apiResource('photos', PhotoController::class);

echo visit('/photos')->getContent(), PHP_EOL;
echo visit('/photos/3')->getContent(), PHP_EOL;
echo visit('/photos/3', 'DELETE')->getContent(), PHP_EOL;
```

> 💡 **Tip:** run `php artisan route:list` in a project to see every route a `resource` call created.

## Challenge

> 🎯 **Challenge:** Register `BookController` as a resource at `books`, limited to the `index` and `show` actions. `GET /books` should list, `GET /books/2` should show, and `POST /books` must not be routed (405).

```php starter
<?php

use Illuminate\Support\Facades\Route;

class BookController
{
    public function index() { return 'All books'; }
    public function show(string $book) { return "Book #$book"; }
}

// Route::resource(...)
```

```php solution
<?php

use Illuminate\Support\Facades\Route;

class BookController
{
    public function index() { return 'All books'; }
    public function show(string $book) { return "Book #$book"; }
}

Route::resource('books', BookController::class)->only(['index', 'show']);
```

```php check
expect(visit('/books')->getContent() === 'All books', "GET /books should return 'All books'.");
expect(visit('/books/2')->getContent() === 'Book #2', "GET /books/2 should return 'Book #2'.");
$post = visit('/books', 'POST')->getStatusCode();
expect($post === 405, "POST /books shouldn't be routed (expected 405, got $post). Use ->only([...]).");
$names = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes())->map(fn ($r) => $r->getName());
expect($names->contains('books.index') && $names->contains('books.show'), "Use Route::resource so the routes get names like books.index.");
```

**Reference:** [Controllers](https://laravel.com/docs/13.x/controllers) in the Laravel 13 docs.

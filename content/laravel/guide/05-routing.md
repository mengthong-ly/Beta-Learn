---
title: Routing
section: Guide Book
summary: Verbs, parameters and constraints, named routes, groups, model binding and fallbacks — plus how the router decides which route wins.
---
## Verbs

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/items', fn () => 'list');
Route::post('/items', fn () => 'create');
Route::put('/items/1', fn () => 'replace');
Route::patch('/items/1', fn () => 'update');
Route::delete('/items/1', fn () => 'destroy');
Route::match(['get', 'head'], '/ping', fn () => 'pong');
Route::any('/anything', fn () => 'any verb');

foreach ([['GET', '/items'], ['POST', '/items'], ['GET', '/ping']] as [$verb, $uri]) {
    echo $verb, ' ', $uri, ' → ', visit($uri, $verb)->getContent(), PHP_EOL;
}
```

A URI that exists for a different verb gives **405 Method Not Allowed**, not 404 — a useful distinction when debugging a form that posts to a `get` route.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/only-get', fn () => 'ok');

echo visit('/only-get')->getStatusCode(), PHP_EOL;              // 200
echo visit('/only-get', 'POST')->getStatusCode(), PHP_EOL;      // 405
echo visit('/nothing-here')->getStatusCode(), PHP_EOL;          // 404
```

## Parameters

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/users/{id}', fn (string $id) => "user $id");
Route::get('/posts/{post}/comments/{comment}', fn ($post, $comment) => "post $post, comment $comment");
Route::get('/files/{name?}', fn (?string $name = 'index') => "file: $name");

echo visit('/users/7')->getContent(), PHP_EOL;
echo visit('/posts/1/comments/2')->getContent(), PHP_EOL;
echo visit('/files')->getContent(), PHP_EOL;
echo visit('/files/readme')->getContent(), PHP_EOL;
```

Parameters are matched to closure arguments **by position**, not by name — but injected classes are matched by type, so you can mix them freely.

## Constraints

`where()` restricts what a segment may contain. A URI that fails the constraint does not match the route at all — it falls through to the next one, or 404s.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/orders/{id}', fn ($id) => "numeric order $id")->whereNumber('id');
Route::get('/orders/{slug}', fn ($slug) => "slug order $slug");

Route::get('/u/{name}', fn ($name) => "name $name")->whereAlpha('name');
Route::get('/v/{v}', fn ($v) => "version $v")->where('v', '[0-9]+\.[0-9]+');

echo visit('/orders/42')->getContent(), PHP_EOL;
echo visit('/orders/black-friday')->getContent(), PHP_EOL;
echo visit('/v/1.2')->getContent(), PHP_EOL;
echo visit('/v/abc')->getStatusCode(), PHP_EOL;
```

> 🔍 **Behind the scenes: first match wins**
>
> The router walks routes in **registration order** and takes the first whose method and compiled pattern match. There is no "most specific route wins" rule. That is why `/orders/{id}` with a numeric constraint must be declared *before* `/orders/{slug}` — reverse them and the slug route swallows every numeric id. When a route mysteriously never fires, the cause is almost always a broader route registered above it.

## Named routes

Names decouple your links from your URLs.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/profile/{user}', fn ($user) => "profile $user")->name('profile.show');
Route::get('/about', fn () => 'about')->name('about');

// Only needed here: these routes are added after the app booted.
app('router')->getRoutes()->refreshNameLookups();

echo route('profile.show', ['user' => 7]), PHP_EOL;
echo route('about'), PHP_EOL;
echo route('about', absolute: false), PHP_EOL;
echo route('profile.show', ['user' => 7, 'tab' => 'settings']), PHP_EOL;  // extras become a query string
```

Change `/about` to `/about-us` and every `route('about')` still works. A hard-coded `/about` would not.

## Groups

Groups share attributes across many routes.

```php
<?php

use Illuminate\Support\Facades\Route;

Route::prefix('api')->name('api.')->group(function () {
    Route::get('/status', fn () => 'ok')->name('status');

    Route::prefix('v1')->name('v1.')->group(function () {
        Route::get('/users', fn () => 'v1 users')->name('users.index');
    });
});

app('router')->getRoutes()->refreshNameLookups();

echo visit('/api/status')->getContent(), PHP_EOL;
echo visit('/api/v1/users')->getContent(), PHP_EOL;
echo route('api.v1.users.index', absolute: false), PHP_EOL;
```

Prefixes, names and middleware **nest and accumulate**; controllers and domains are replaced by the innermost value.

## Route model binding

Type-hint an Eloquent model and Laravel fetches it — or 404s before your code runs.

```php
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;

Schema::create('articles', function (Blueprint $t) {
    $t->id();
    $t->string('slug');
    $t->string('title');
});

class Article extends Model
{
    public $timestamps = false;
    protected $guarded = [];
    public function getRouteKeyName(): string { return 'slug'; }
}

Article::create(['slug' => 'hello-world', 'title' => 'Hello World']);

Route::get('/articles/{article}', fn (Article $article) => $article->title);

echo visit('/articles/hello-world')->getContent(), PHP_EOL;
echo visit('/articles/nope')->getStatusCode(), PHP_EOL;     // 404, automatically
```

> 💡 **Tip:** `getRouteKeyName()` switches binding from the primary key to any column — usually a slug or a UUID. For a single route, `/{article:slug}` does the same thing inline.

## Fallback and redirects

```php
<?php

use Illuminate\Support\Facades\Route;

Route::redirect('/old-home', '/new-home');
Route::permanentRedirect('/ancient', '/new-home');
Route::get('/new-home', fn () => 'the new home');

Route::fallback(fn () => response('nothing here, sorry', 404));

$r = visit('/old-home');
echo $r->getStatusCode(), ' → ', $r->headers->get('location'), PHP_EOL;
echo visit('/ancient')->getStatusCode(), PHP_EOL;           // 301
echo visit('/who-knows')->getContent(), PHP_EOL;            // the fallback
```

`Route::fallback()` must be registered **last** — it matches everything.

## Controllers

For anything beyond a line or two, routes point at controllers.

```php
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Routing\Controller;

class ArticleController extends Controller
{
    public function index(): string { return 'all articles'; }
    public function show(string $id): string { return "article $id"; }
}

Route::get('/a', [ArticleController::class, 'index']);
Route::get('/a/{id}', [ArticleController::class, 'show']);

echo visit('/a')->getContent(), PHP_EOL;
echo visit('/a/3')->getContent(), PHP_EOL;
```

`Route::resource('articles', ArticleController::class)` registers the seven conventional routes (`index`, `create`, `store`, `show`, `edit`, `update`, `destroy`) in one line.

## Inspecting the route table

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/one', fn () => 1)->name('one');
Route::post('/two/{id}', fn () => 2)->name('two')->middleware('web');

foreach (Route::getRoutes() as $route) {
    if (! str_starts_with($route->uri(), 'one') && ! str_starts_with($route->uri(), 'two')) {
        continue;
    }
    printf("%-6s %-12s %-6s %s\n",
        implode('|', $route->methods()),
        $route->uri(),
        $route->getName(),
        implode(',', $route->gatherMiddleware()) ?: '-'
    );
}
```

`php artisan route:list` is the same information from the command line, and it is the fastest way to answer "why is this URL 404ing?"

**Reference:** [Routing](https://laravel.com/docs/13.x/routing) in the Laravel documentation.

---
title: Eloquent
section: Guide Book
summary: Models, mass assignment, relationships, eager loading and the N+1 problem, accessors, casts, scopes and events.
---
Eloquent is an Active Record ORM: a model class *is* a table, an instance *is* a row, and the row knows how to save itself.

## A model

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;

Schema::create('books', function (Blueprint $t) {
    $t->id();
    $t->string('title');
    $t->integer('pages');
    $t->boolean('published')->default(false);
    $t->timestamps();
});

class Book extends Model
{
    protected $fillable = ['title', 'pages', 'published'];
}

$book = Book::create(['title' => 'Dune', 'pages' => 412, 'published' => true]);

echo $book->id, ' ', $book->title, PHP_EOL;
echo 'created at: ', $book->created_at->format('Y-m-d'), PHP_EOL;

$book->pages = 500;
$book->save();

echo Book::find($book->id)->pages, PHP_EOL;
```

Conventions do the wiring: class `Book` → table `books`, primary key `id`, `created_at` / `updated_at` maintained automatically. Each is overridable (`$table`, `$primaryKey`, `$timestamps`).

## Mass assignment

`$fillable` is an allow-list, `$guarded` a deny-list. One of them is required for `create()` and `fill()` to work.

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;

Schema::create('users2', function (Blueprint $t) {
    $t->id();
    $t->string('name');
    $t->boolean('is_admin')->default(false);
});

class Account extends Model
{
    protected $table = 'users2';
    public $timestamps = false;
    protected $fillable = ['name'];        // is_admin deliberately absent
}

// Pretend this array came straight from a request:
$account = Account::create(['name' => 'Ada', 'is_admin' => true]);

echo $account->name, ' is_admin: ', var_export((bool) $account->is_admin, true), PHP_EOL;

// Setting it deliberately still works:
$account->is_admin = true;
$account->save();
echo 'after explicit set: ', var_export((bool) $account->fresh()->is_admin, true), PHP_EOL;
```

> 🧭 **Scenario:** A registration form posts to `User::create($request->all())`. An attacker adds `is_admin=1` to the form data and creates themselves an administrator. `$fillable` is the line of defence — and passing `$request->validated()` instead of `$request->all()` is the second.

## Retrieving

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;

Schema::create('books', function (Blueprint $t) {
    $t->id();
    $t->string('title');
    $t->integer('pages');
    $t->boolean('published')->default(true);
});

class Book extends Model
{
    public $timestamps = false;
    protected $guarded = [];
}

Book::insert([
    ['title' => 'Dune', 'pages' => 412, 'published' => true],
    ['title' => 'Neuromancer', 'pages' => 271, 'published' => true],
    ['title' => 'Draft', 'pages' => 12, 'published' => false],
]);

echo Book::count(), PHP_EOL;
echo Book::where('published', true)->count(), PHP_EOL;
echo Book::orderByDesc('pages')->first()->title, PHP_EOL;
echo Book::where('pages', '>', 200)->pluck('title')->implode(', '), PHP_EOL;

var_dump(Book::find(999));                       // null
var_dump(Book::where('pages', '>', 99999)->exists());

try {
    Book::findOrFail(999);
} catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
    echo 'findOrFail threw — a route would turn this into a 404', PHP_EOL;
}
```

> ⚠️ `first()` returns `null`, `find()` returns `null`, but `firstOrFail()` and `findOrFail()` throw. In a controller the throwing versions are usually right: the exception handler turns `ModelNotFoundException` into a 404 for free, so you never write the `if (! $model) abort(404)` line.

## Relationships

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;

Schema::create('authors', function (Blueprint $t) {
    $t->id();
    $t->string('name');
});

Schema::create('books', function (Blueprint $t) {
    $t->id();
    $t->foreignId('author_id');
    $t->string('title');
});

class Author extends Model
{
    public $timestamps = false;
    protected $guarded = [];

    public function books()
    {
        return $this->hasMany(Book::class);
    }
}

class Book extends Model
{
    public $timestamps = false;
    protected $guarded = [];

    public function author()
    {
        return $this->belongsTo(Author::class);
    }
}

$herbert = Author::create(['name' => 'Frank Herbert']);
$herbert->books()->create(['title' => 'Dune']);
$herbert->books()->create(['title' => 'Dune Messiah']);

echo $herbert->books->count(), ' books', PHP_EOL;
echo $herbert->books->pluck('title')->implode(' / '), PHP_EOL;
echo Book::first()->author->name, PHP_EOL;

// The relationship is also a query builder:
echo $herbert->books()->where('title', 'like', '%Messiah%')->count(), PHP_EOL;
```

| Relationship | Foreign key lives on |
| --- | --- |
| `hasOne` / `hasMany` | the **other** table |
| `belongsTo` | **this** table |
| `belongsToMany` | a pivot table |
| `hasManyThrough` | two hops away |
| `morphTo` / `morphMany` | polymorphic — type + id columns |

> 🔍 **Behind the scenes: `$author->books` versus `$author->books()`**
>
> Without parentheses you get the **result** — a `Collection`, fetched on first access and then cached on the model instance. With parentheses you get the **relationship object**, which is a query builder you can keep constraining. This is why `$author->books` inside a loop is a hidden query per iteration, and why `$author->books()->count()` runs a `COUNT` in the database rather than loading every row to count them in PHP.

## The N+1 problem

The single most common Laravel performance bug.

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

Schema::create('authors', function (Blueprint $t) {
    $t->id();
    $t->string('name');
});
Schema::create('books', function (Blueprint $t) {
    $t->id();
    $t->foreignId('author_id');
    $t->string('title');
});

class Author extends Model
{
    public $timestamps = false;
    protected $guarded = [];
    public function books() { return $this->hasMany(Book::class); }
}
class Book extends Model
{
    public $timestamps = false;
    protected $guarded = [];
    public function author() { return $this->belongsTo(Author::class); }
}

foreach (['Herbert', 'Gibson', 'Le Guin'] as $name) {
    Author::create(['name' => $name])->books()->create(['title' => "Book by $name"]);
}

DB::enableQueryLog();
foreach (Book::all() as $book) {
    $book->author->name;                 // one query per book
}
echo 'lazy:   ', count(DB::getQueryLog()), ' queries', PHP_EOL;

DB::flushQueryLog();
foreach (Book::with('author')->get() as $book) {
    $book->author->name;                 // all authors in one extra query
}
echo 'eager:  ', count(DB::getQueryLog()), ' queries', PHP_EOL;
```

Three books cost four queries lazily and two eagerly. Three *thousand* books cost 3,001 and 2.

> 💡 **Tip:** `Model::preventLazyLoading()` in a service provider turns every lazy load into an exception in development. It finds N+1 bugs at the moment you write them rather than when traffic arrives.

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;

Schema::create('authors', function (Blueprint $t) { $t->id(); $t->string('name'); });
Schema::create('books', function (Blueprint $t) { $t->id(); $t->foreignId('author_id'); $t->string('title'); });

class Author extends Model {
    public $timestamps = false; protected $guarded = [];
    public function books() { return $this->hasMany(Book::class); }
}
class Book extends Model { public $timestamps = false; protected $guarded = []; }

$a = Author::create(['name' => 'Herbert']);
$a->books()->createMany([['title' => 'Dune'], ['title' => 'Messiah']]);

// Counts without loading the rows:
foreach (Author::withCount('books')->get() as $author) {
    echo $author->name, ': ', $author->books_count, PHP_EOL;
}

// Constrained eager load:
foreach (Author::with(['books' => fn ($q) => $q->where('title', 'Dune')])->get() as $author) {
    echo $author->name, ' → ', $author->books->pluck('title')->implode(','), PHP_EOL;
}

// Filter parents by their children:
echo Author::whereHas('books', fn ($q) => $q->where('title', 'Dune'))->count(), PHP_EOL;
```

## Casts

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;

Schema::create('settings', function (Blueprint $t) {
    $t->id();
    $t->string('options');
    $t->string('active');
    $t->string('launch_at');
    $t->string('price');
});

class Setting extends Model
{
    public $timestamps = false;
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'options'   => 'array',
            'active'    => 'boolean',
            'launch_at' => 'datetime',
            'price'     => 'decimal:2',
        ];
    }
}

$s = Setting::create([
    'options'   => ['theme' => 'dark', 'rows' => 25],
    'active'    => 1,
    'launch_at' => '2026-01-15 09:00:00',
    'price'     => '9.5',
]);

$fresh = Setting::first();
print_r($fresh->options);
var_dump($fresh->active);
echo get_class($fresh->launch_at), ' → ', $fresh->launch_at->format('D j M Y'), PHP_EOL;
echo $fresh->price, PHP_EOL;
```

Casts run in both directions: the array is JSON-encoded on save and decoded on read.

## Accessors and mutators

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

Schema::create('people', function (Blueprint $t) {
    $t->id();
    $t->string('first_name');
    $t->string('last_name');
    $t->string('email');
});

class Person extends Model
{
    public $timestamps = false;
    protected $guarded = [];

    protected function fullName(): Attribute
    {
        return Attribute::get(fn () => "{$this->first_name} {$this->last_name}");
    }

    protected function email(): Attribute
    {
        return Attribute::make(
            get: fn (string $v) => strtolower($v),
            set: fn (string $v) => trim(strtolower($v)),
        );
    }
}

$p = Person::create([
    'first_name' => 'Ada',
    'last_name'  => 'Lovelace',
    'email'      => '  ADA@Example.COM ',
]);

echo $p->full_name, PHP_EOL;          // fullName() → full_name
echo Person::first()->email, PHP_EOL;
```

## Scopes

A scope is a named, reusable query fragment.

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

Schema::create('books', function (Blueprint $t) {
    $t->id();
    $t->string('title');
    $t->integer('pages');
    $t->boolean('published');
});

class Book extends Model
{
    public $timestamps = false;
    protected $guarded = [];

    public function scopePublished(Builder $q): void
    {
        $q->where('published', true);
    }

    public function scopeLongerThan(Builder $q, int $pages): void
    {
        $q->where('pages', '>', $pages);
    }
}

Book::insert([
    ['title' => 'Dune', 'pages' => 412, 'published' => true],
    ['title' => 'Neuromancer', 'pages' => 271, 'published' => true],
    ['title' => 'Draft', 'pages' => 800, 'published' => false],
]);

echo Book::published()->longerThan(300)->pluck('title')->implode(', '), PHP_EOL;
echo Book::published()->count(), PHP_EOL;
```

## Model events

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;

Schema::create('posts', function (Blueprint $t) {
    $t->id();
    $t->string('title');
    $t->string('slug')->nullable();
});

class Post extends Model
{
    public $timestamps = false;
    protected $guarded = [];

    protected static function booted(): void
    {
        static::creating(function (Post $post) {
            $post->slug ??= str($post->title)->slug()->value();
            echo '  creating: slug set to ', $post->slug, PHP_EOL;
        });

        static::created(fn (Post $post) => print("  created: id {$post->id}\n"));
        static::deleted(fn (Post $post) => print("  deleted: {$post->title}\n"));
    }
}

$post = Post::create(['title' => 'Hello Laravel World']);
echo $post->slug, PHP_EOL;
$post->delete();
```

> ⚠️ Model events do **not** fire for mass operations: `Post::where(...)->delete()` and `->update()` go straight to SQL. If a hook must always run, put it in a service method rather than a model event, or use the model's own `delete()` in a loop and accept the queries.

## Soft deletes

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

Schema::create('notes', function (Blueprint $t) {
    $t->id();
    $t->string('body');
    $t->softDeletes();
});

class Note extends Model
{
    use SoftDeletes;

    public $timestamps = false;
    protected $guarded = [];
}

$n = Note::create(['body' => 'remember this']);
$n->delete();

echo 'visible:       ', Note::count(), PHP_EOL;
echo 'with trashed:  ', Note::withTrashed()->count(), PHP_EOL;
echo 'only trashed:  ', Note::onlyTrashed()->count(), PHP_EOL;

Note::withTrashed()->first()->restore();
echo 'after restore: ', Note::count(), PHP_EOL;
```

**Reference:** [Eloquent: Getting Started](https://laravel.com/docs/13.x/eloquent) and [Relationships](https://laravel.com/docs/13.x/eloquent-relationships).

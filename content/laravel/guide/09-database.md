---
title: The database layer
section: Guide Book
summary: Migrations, the query builder, bindings and why they matter, transactions, and how to see the SQL Laravel actually runs.
---
Laravel's database layer has three floors: raw SQL at the bottom, the **query builder** in the middle, and **Eloquent** on top. They all sit on the same connection, and you can drop a floor at any time.

## Migrations describe the schema

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

Schema::create('authors', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('country', 2)->default('GB');
    $table->timestamps();
});

Schema::create('books', function (Blueprint $table) {
    $table->id();
    $table->foreignId('author_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->integer('pages')->unsigned();
    $table->decimal('price', 8, 2)->nullable();
    $table->boolean('published')->default(false);
    $table->timestamps();

    $table->index(['author_id', 'published']);
});

var_dump(Schema::hasTable('books'));
var_dump(Schema::hasColumn('books', 'price'));
print_r(Schema::getColumnListing('books'));
```

`->constrained()` infers the referenced table from the column name (`author_id` → `authors.id`) and adds the foreign key.

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

Schema::create('notes', function (Blueprint $t) {
    $t->id();
    $t->string('body');
});

Schema::table('notes', function (Blueprint $t) {
    $t->string('colour')->default('yellow');
});

print_r(Schema::getColumnListing('notes'));

Schema::table('notes', fn (Blueprint $t) => $t->dropColumn('colour'));
print_r(Schema::getColumnListing('notes'));
```

> ⚠️ A migration that has run in production is history — change it and every environment disagrees about the schema. Always add a *new* migration instead. `down()` matters for the same reason: it is the only safe way back.

## The query builder

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

Schema::create('books', function (Blueprint $t) {
    $t->id();
    $t->string('title');
    $t->integer('pages');
    $t->boolean('published')->default(true);
});

DB::table('books')->insert([
    ['title' => 'Dune', 'pages' => 412, 'published' => true],
    ['title' => 'Neuromancer', 'pages' => 271, 'published' => true],
    ['title' => 'Draft', 'pages' => 12, 'published' => false],
]);

echo 'count:  ', DB::table('books')->count(), PHP_EOL;
echo 'longest: ', DB::table('books')->max('pages'), PHP_EOL;
echo 'average: ', round(DB::table('books')->avg('pages')), PHP_EOL;

$long = DB::table('books')
    ->where('published', true)
    ->where('pages', '>', 300)
    ->orderBy('pages', 'desc')
    ->pluck('title');

print_r($long->all());
```

### Where clauses

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

Schema::create('books', function (Blueprint $t) {
    $t->id();
    $t->string('title');
    $t->integer('pages');
    $t->string('genre')->nullable();
});

DB::table('books')->insert([
    ['title' => 'Dune', 'pages' => 412, 'genre' => 'scifi'],
    ['title' => 'Neuromancer', 'pages' => 271, 'genre' => 'scifi'],
    ['title' => 'Untitled', 'pages' => 90, 'genre' => null],
]);

$q = fn () => DB::table('books');

echo $q()->whereIn('genre', ['scifi'])->count(), PHP_EOL;
echo $q()->whereNull('genre')->count(), PHP_EOL;
echo $q()->whereBetween('pages', [100, 300])->count(), PHP_EOL;
echo $q()->where('title', 'like', '%man%')->count(), PHP_EOL;

// Grouped: (a OR b) AND c
$rows = $q()
    ->where(function ($sub) {
        $sub->where('pages', '>', 400)->orWhere('genre', 'scifi');
    })
    ->where('title', '!=', 'Dune')
    ->pluck('title');

print_r($rows->all());
```

## Bindings: why `?` matters

The builder never puts your values into the SQL string. It emits placeholders and sends the values separately.

```php
<?php

use Illuminate\Support\Facades\DB;

$query = DB::table('users')
    ->where('email', 'ada@example.com')
    ->where('active', true)
    ->orderBy('name');

echo $query->toSql(), PHP_EOL;
print_r($query->getBindings());
```

> 🔍 **Behind the scenes: prepared statements are the defence**
>
> The driver sends the SQL *once*, with `?` where the values go, and the database compiles a plan before it ever sees a value. Values then arrive as data on a separate channel — there is no parsing step left for them to escape into. This is why `where('name', $userInput)` is safe no matter what the user typed, and why `whereRaw("name = '$userInput'")` is not: string interpolation puts the input back into the part that gets parsed.

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

Schema::create('books', function (Blueprint $t) {
    $t->id();
    $t->string('title');
});
DB::table('books')->insert([['title' => 'Dune']]);

$evil = "' OR 1=1 --";

echo 'safe search found: ', DB::table('books')->where('title', $evil)->count(), PHP_EOL;

// If you must write raw SQL, still bind:
$rows = DB::select('select * from books where title = ?', ['Dune']);
echo 'bound raw found: ', count($rows), PHP_EOL;
```

## Raw expressions, used sparingly

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

Schema::create('sales', function (Blueprint $t) {
    $t->id();
    $t->string('region');
    $t->integer('amount');
});

DB::table('sales')->insert([
    ['region' => 'eu', 'amount' => 100],
    ['region' => 'eu', 'amount' => 250],
    ['region' => 'us', 'amount' => 400],
]);

$totals = DB::table('sales')
    ->select('region', DB::raw('sum(amount) as total'), DB::raw('count(*) as orders'))
    ->groupBy('region')
    ->havingRaw('sum(amount) > ?', [200])
    ->orderByDesc('total')
    ->get();

foreach ($totals as $row) {
    echo $row->region, ': ', $row->total, ' from ', $row->orders, ' orders', PHP_EOL;
}
```

## Joins

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

Schema::create('authors', function (Blueprint $t) {
    $t->id();
    $t->string('name');
});

Schema::create('books', function (Blueprint $t) {
    $t->id();
    $t->unsignedBigInteger('author_id');
    $t->string('title');
});

DB::table('authors')->insert([['name' => 'Herbert'], ['name' => 'Gibson'], ['name' => 'Nobody']]);
DB::table('books')->insert([
    ['author_id' => 1, 'title' => 'Dune'],
    ['author_id' => 2, 'title' => 'Neuromancer'],
]);

$rows = DB::table('books')
    ->join('authors', 'authors.id', '=', 'books.author_id')
    ->select('books.title', 'authors.name')
    ->get();

foreach ($rows as $r) echo $r->title, ' by ', $r->name, PHP_EOL;

$all = DB::table('authors')
    ->leftJoin('books', 'books.author_id', '=', 'authors.id')
    ->select('authors.name', 'books.title')
    ->get();

foreach ($all as $r) echo $r->name, ' → ', $r->title ?? '(no books)', PHP_EOL;
```

## Transactions

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

Schema::create('accounts', function (Blueprint $t) {
    $t->id();
    $t->string('owner');
    $t->integer('balance');
});

DB::table('accounts')->insert([
    ['owner' => 'Ada', 'balance' => 100],
    ['owner' => 'Grace', 'balance' => 0],
]);

try {
    DB::transaction(function () {
        DB::table('accounts')->where('owner', 'Ada')->decrement('balance', 50);
        DB::table('accounts')->where('owner', 'Grace')->increment('balance', 50);
        throw new \RuntimeException('something failed after both writes');
    });
} catch (\RuntimeException $e) {
    echo 'rolled back: ', $e->getMessage(), PHP_EOL;
}

foreach (DB::table('accounts')->get() as $a) {
    echo $a->owner, ': ', $a->balance, PHP_EOL;     // unchanged
}
```

`DB::transaction()` commits when the closure returns and rolls back when it throws. `beginTransaction()` / `commit()` / `rollBack()` are there when you need manual control.

## Seeing the SQL

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

Schema::create('books', function (Blueprint $t) {
    $t->id();
    $t->string('title');
});

DB::enableQueryLog();

DB::table('books')->insert([['title' => 'Dune']]);
DB::table('books')->where('title', 'Dune')->get();

foreach (DB::getQueryLog() as $entry) {
    echo $entry['query'], '  ', json_encode($entry['bindings']), PHP_EOL;
}
```

> 💡 **Tip:** `DB::listen()` does the same thing continuously, which is how query-count assertions and the debug bar work. In development, logging every query and failing a test that fires more than N is the cheapest possible defence against the N+1 problem — see the next chapter.

**Reference:** [Database: Query Builder](https://laravel.com/docs/13.x/queries) and [Migrations](https://laravel.com/docs/13.x/migrations).

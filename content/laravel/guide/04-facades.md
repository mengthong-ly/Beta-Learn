---
title: Facades, helpers & contracts
section: Guide Book
summary: What `Route::get()` really does, why facades are not static calls, and how to choose between a facade, a helper and an injected contract.
---
`Cache::get('key')` looks like a static method call. It is not one — and the difference matters for testing, for tooling and for understanding error messages.

## A facade is a proxy to a container binding

Every facade extends `Facade` and answers one question: which container key do I stand for?

```php
<?php

use Illuminate\Support\Facades\Facade;

class Greeter
{
    public function hello(string $name): string
    {
        return "Hello, $name";
    }
}

class Greet extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'greeter';       // a container key
    }
}

app()->singleton('greeter', fn () => new Greeter());

echo Greet::hello('Ada'), PHP_EOL;          // looks static…
echo app('greeter')->hello('Ada'), PHP_EOL; // …is exactly this
```

`__callStatic` intercepts the call, resolves `greeter` from the container, and forwards the call to the real object.

```php
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Config;

echo get_class(Route::getFacadeRoot()), PHP_EOL;    // Illuminate\Routing\Router
echo get_class(Config::getFacadeRoot()), PHP_EOL;   // the config repository
var_dump(Route::getFacadeRoot() === app('router'));
```

> 🔍 **Behind the scenes: `Illuminate\Support\Facades\Route` is not the router**
>
> The class in that namespace contains no routing code at all — it is a few lines declaring an accessor. The real work is in `Illuminate\Routing\Router`. This is worth knowing when you read a stack trace or jump to a definition and find an almost-empty class: follow `getFacadeAccessor()` to the binding, and the binding to the implementation. The accurate docblocks at the top of each facade (`@method static Route get(...)`) are what make IDE autocompletion work.

## Why this matters: facades are swappable

Because the call goes through the container, a test can replace the underlying object. `Facade::swap()` and the `shouldReceive`/`fake` helpers all work this way.

```php
<?php

use Illuminate\Support\Facades\Facade;

class Clock
{
    public function now(): string { return 'the real time'; }
}

class FrozenClock extends Clock
{
    public function now(): string { return '2026-01-15 09:00'; }
}

class Time extends Facade
{
    protected static function getFacadeAccessor(): string { return 'clock'; }
}

app()->singleton('clock', fn () => new Clock());
echo Time::now(), PHP_EOL;

Time::swap(new FrozenClock());      // the whole point of the indirection
echo Time::now(), PHP_EOL;
```

A genuinely static method could not do that. This is the answer to "aren't facades just global state?" — they are global *access*, but not global *binding*.

## The framework's own fakes

Most first-party facades ship a fake that records instead of acting.

```php
<?php

use Illuminate\Support\Facades\Event;

class OrderShipped
{
    public function __construct(public string $order) {}
}

Event::fake();

Event::dispatch(new OrderShipped('A-1'));
Event::dispatch(new OrderShipped('A-2'));

echo 'recorded dispatches: ', count(Event::dispatched(OrderShipped::class)), PHP_EOL;
var_dump(Event::hasDispatched(OrderShipped::class));
echo 'nothing actually ran — the fake only recorded', PHP_EOL;
```

In a test you would assert on that recording with `Event::assertDispatched(OrderShipped::class, 2)`. `Mail::fake()`, `Queue::fake()`, `Storage::fake()`, `Http::fake()` and `Notification::fake()` all follow the same pattern.

## Helpers

Helper functions are the shortest form. Many are one-line wrappers over the same bindings.

```php
<?php

echo config('app.name', 'Laravel'), PHP_EOL;
echo str('hello world')->title(), PHP_EOL;
echo collect([3, 1, 2])->sort()->implode(','), PHP_EOL;
echo now()->format('Y'), PHP_EOL;

print_r(data_get(['user' => ['roles' => ['admin']]], 'user.roles.0'));
echo PHP_EOL;
echo value(fn () => 'lazy'), PHP_EOL;
echo blank('') ? 'blank' : 'filled', PHP_EOL;
echo filled('x') ? 'filled' : 'blank', PHP_EOL;
```

## Contracts: the third option

A **contract** is the interface behind a facade. Type-hint it and the container injects the implementation — the same object the facade would have reached.

```php
<?php

use Illuminate\Contracts\Config\Repository as ConfigContract;

class PricingService
{
    public function __construct(private ConfigContract $config) {}

    public function currency(): string
    {
        return $this->config->get('app.currency', 'GBP');
    }
}

echo app(PricingService::class)->currency(), PHP_EOL;
```

## Choosing between the three

| | Facade | Helper | Injected contract |
| --- | --- | --- | --- |
| Reads as | `Cache::get()` | `cache()->get()` | `$this->cache->get()` |
| Dependencies | hidden | hidden | **visible in the signature** |
| Unit-testable without the framework | no | no | **yes** |
| Best in | routes, providers, quick scripts | views, closures | services and domain classes |

```php
<?php

use Illuminate\Contracts\Cache\Repository as CacheContract;

// A service class: dependencies declared, trivially testable with a stub.
class ReportService
{
    public function __construct(private CacheContract $cache) {}

    public function summary(): string
    {
        return $this->cache->remember('summary', 60, fn () => 'computed once');
    }
}

echo app(ReportService::class)->summary(), PHP_EOL;
echo app(ReportService::class)->summary(), PHP_EOL;   // served from cache
```

> 💡 **Tip:** A useful rule: facades and helpers in the framework's own seams — routes, providers, Blade, commands — and constructor injection in the classes that hold your business logic. A class whose constructor lists its four dependencies is a class whose test needs no application at all.

## Real-time facades

Prefix any class with `Facades\` and Laravel builds a facade for it on the fly.

```php
<?php

class Publisher
{
    public function publish(string $slug): string
    {
        return "published $slug";
    }
}

// Normally: use Facades\Publisher; then Publisher::publish('x')
// The mechanism is the same — the container resolves the real class.
echo app(Publisher::class)->publish('hello-world'), PHP_EOL;
```

They are handy for making an existing class mockable without changing its callers. They also hide dependencies just as thoroughly as any other facade, so the same guidance applies.

**Reference:** [Facades](https://laravel.com/docs/13.x/facades) and [Contracts](https://laravel.com/docs/13.x/contracts).

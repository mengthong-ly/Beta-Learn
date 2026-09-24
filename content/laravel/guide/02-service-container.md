---
title: The service container
section: Guide Book
summary: Automatic dependency injection, binding and resolving, singletons and contextual bindings — the machine the whole framework is built on.
---
The container is a factory that knows how to build your objects, including everything *those* objects need. Understanding it is what makes the rest of Laravel stop feeling like magic.

## Zero-configuration resolution

If a class's dependencies are all concrete classes, the container can build it with no configuration at all.

```php
<?php

class Mailer
{
    public function send(string $to): string
    {
        return "mail to $to";
    }
}

class OrderService
{
    public function __construct(private Mailer $mailer) {}

    public function confirm(string $email): string
    {
        return 'confirmed: ' . $this->mailer->send($email);
    }
}

$service = app(OrderService::class);      // Mailer built automatically
echo $service->confirm('ada@example.com'), PHP_EOL;
```

Nothing was registered. The container read the constructor's type hints with reflection and worked backwards.

> 🔍 **Behind the scenes: reflection, then recursion**
>
> `app(OrderService::class)` finds no binding, so the container reflects on the constructor, sees `Mailer $mailer`, and resolves *that* the same way — recursively, until it reaches classes with no dependencies. This is why a type hint on a constructor is all most classes ever need, and why a constructor parameter without a type hint (or with a scalar one) fails: reflection cannot guess a `string $apiKey`.

```php
<?php

class NeedsConfig
{
    public function __construct(private string $apiKey) {}
}

try {
    app(NeedsConfig::class);
} catch (\Throwable $e) {
    echo get_class($e), ': unresolvable scalar', PHP_EOL;
}
```

## Binding an interface to an implementation

This is the container's real job: your code depends on an interface, and one line decides what that means.

```php
<?php

interface PaymentGateway
{
    public function charge(int $cents): string;
}

class StripeGateway implements PaymentGateway
{
    public function charge(int $cents): string
    {
        return "stripe charged $cents";
    }
}

class FakeGateway implements PaymentGateway
{
    public function charge(int $cents): string
    {
        return "pretended to charge $cents";
    }
}

class Checkout
{
    public function __construct(private PaymentGateway $gateway) {}

    public function pay(int $cents): string
    {
        return $this->gateway->charge($cents);
    }
}

app()->bind(PaymentGateway::class, StripeGateway::class);
echo app(Checkout::class)->pay(500), PHP_EOL;

app()->bind(PaymentGateway::class, FakeGateway::class);   // swap for tests
echo app(Checkout::class)->pay(500), PHP_EOL;
```

`Checkout` never changed. That is the whole point.

## `bind` versus `singleton`

`bind` runs the factory every time. `singleton` runs it once and reuses the instance.

```php
<?php

class Counter
{
    public int $n = 0;
}

app()->bind('fresh', fn () => new Counter());
app()->singleton('shared', fn () => new Counter());

app('fresh')->n++;
app('fresh')->n++;
echo 'bind:      ', app('fresh')->n, PHP_EOL;        // 0 — a new object each time

app('shared')->n++;
app('shared')->n++;
echo 'singleton: ', app('shared')->n, PHP_EOL;       // 2 — the same object
```

`instance()` registers an object you already have; `scoped()` is a singleton that resets per request — the one to reach for under Octane.

```php
<?php

class Config
{
    public function __construct(public string $env) {}
}

app()->instance('my.config', new Config('staging'));
echo app('my.config')->env, PHP_EOL;
var_dump(app('my.config') === app('my.config'));
```

> ⚠️ A singleton holding request-specific state is the classic Octane bug: it is built during request 1 and still holds request 1's user during request 500. Under a traditional PHP-FPM setup the process dies and hides the problem; under a long-lived worker it does not. `scoped()` exists for exactly this.

## The factory closure

When construction needs more than type hints, bind a closure. It receives the container.

```php
<?php

class HttpClient
{
    public function __construct(public string $baseUrl, public int $timeout) {}
}

app()->singleton(HttpClient::class, function ($app) {
    return new HttpClient(
        baseUrl: $app['config']->get('app.url', 'http://localhost'),
        timeout: 5,
    );
});

$client = app(HttpClient::class);
echo $client->baseUrl, ' (timeout ', $client->timeout, "s)", PHP_EOL;
```

## Contextual binding

Two classes, the same interface, different implementations — decided by who is asking.

```php
<?php

interface Storage
{
    public function put(string $key): string;
}

class LocalStorage implements Storage
{
    public function put(string $key): string { return "local:$key"; }
}

class CloudStorage implements Storage
{
    public function put(string $key): string { return "cloud:$key"; }
}

class AvatarUploader
{
    public function __construct(public Storage $storage) {}
}

class LogArchiver
{
    public function __construct(public Storage $storage) {}
}

app()->when(AvatarUploader::class)->needs(Storage::class)->give(CloudStorage::class);
app()->when(LogArchiver::class)->needs(Storage::class)->give(LocalStorage::class);

echo app(AvatarUploader::class)->storage->put('a.png'), PHP_EOL;
echo app(LogArchiver::class)->storage->put('app.log'), PHP_EOL;
```

## Method injection

The container can also fill a *method's* parameters, which is what makes controller actions work.

```php
<?php

class Mailer
{
    public function send(string $to): string { return "sent to $to"; }
}

class Report
{
    public function generate(Mailer $mailer, string $to): string
    {
        return $mailer->send($to);
    }
}

echo app()->call([new Report(), 'generate'], ['to' => 'ada@example.com']), PHP_EOL;
```

A controller action is resolved the same way: type-hinted classes come from the container, and route parameters are matched by name.

```php
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

class Clock
{
    public function now(): string { return '2026-01-15'; }
}

Route::get('/report/{name}', function (Request $request, Clock $clock, string $name) {
    return "$name at {$clock->now()} from {$request->path()}";
});

echo visit('/report/sales')->getContent(), PHP_EOL;
```

> 💡 **Tip:** Notice the order does not matter. The container matches by *type* for classes and by *name* for route parameters, so you can list them however reads best.

## Tagging

Register a group, resolve it as a list — useful for plugin-style collections.

```php
<?php

interface Rule
{
    public function check(string $v): bool;
}

class NotEmpty implements Rule
{
    public function check(string $v): bool { return $v !== ''; }
}

class MaxTen implements Rule
{
    public function check(string $v): bool { return strlen($v) <= 10; }
}

app()->bind(NotEmpty::class);
app()->bind(MaxTen::class);
app()->tag([NotEmpty::class, MaxTen::class], 'rules');

foreach (app()->tagged('rules') as $rule) {
    echo get_class($rule), ': ', var_export($rule->check('hello'), true), PHP_EOL;
}
```

## When not to use it

The container is for *services* — things with behaviour and dependencies. It is not for data.

```php
<?php

// Wrong: a value object built from request data does not belong in the container.
final class Money
{
    public function __construct(public readonly int $cents) {}
}

$m = new Money(500);        // just use new
echo $m->cents, PHP_EOL;
```

**Reference:** [Service Container](https://laravel.com/docs/13.x/container) in the Laravel documentation.

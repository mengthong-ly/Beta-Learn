---
title: Events, queues & cache
section: Guide Book
summary: Decoupling with events and listeners, moving work off the request with queues, and the cache API — including the locks that stop two workers doing the same job.
---
## Events: telling the application something happened

An event is a plain object. Listeners subscribe to it. Neither knows about the other.

```php
<?php

use Illuminate\Support\Facades\Event;

class OrderPlaced
{
    public function __construct(public string $reference, public int $cents) {}
}

Event::listen(OrderPlaced::class, function (OrderPlaced $event) {
    echo "  email: receipt for {$event->reference}", PHP_EOL;
});

Event::listen(OrderPlaced::class, function (OrderPlaced $event) {
    echo "  analytics: recorded {$event->cents}p", PHP_EOL;
});

echo 'placing order…', PHP_EOL;
Event::dispatch(new OrderPlaced('A-1001', 4999));
echo 'done', PHP_EOL;
```

The controller that places the order says *what happened*. Adding a third listener — a webhook, a loyalty point, an audit row — never touches the controller.

> 🧭 **Scenario:** "When an order is placed, also notify the warehouse." Without events that is another method call in a controller that already does six things, and the controller's test now needs a warehouse double. With events it is a new listener class and a new test, and the controller is untouched.

## Listener classes and subscribers

```php
<?php

use Illuminate\Support\Facades\Event;

class UserRegistered
{
    public function __construct(public string $email) {}
}

class SendWelcomeEmail
{
    public function handle(UserRegistered $event): void
    {
        echo "  welcome email → {$event->email}", PHP_EOL;
    }
}

class AuditSubscriber
{
    public function subscribe(): array
    {
        return [
            UserRegistered::class => 'onRegistered',
        ];
    }

    public function onRegistered(UserRegistered $event): void
    {
        echo "  audit: registered {$event->email}", PHP_EOL;
    }
}

Event::listen(UserRegistered::class, SendWelcomeEmail::class);
Event::subscribe(AuditSubscriber::class);

Event::dispatch(new UserRegistered('ada@example.com'));
```

A listener may stop the chain by returning `false`.

```php
<?php

use Illuminate\Support\Facades\Event;

class Ping {}

Event::listen(Ping::class, function () {
    echo '  first listener', PHP_EOL;
    return false;          // halts propagation
});

Event::listen(Ping::class, function () {
    echo '  never runs', PHP_EOL;
});

Event::dispatch(new Ping());
echo 'dispatched', PHP_EOL;
```

## Queues: doing it later

A queued job is work serialised into storage and executed by a separate worker process. The request returns immediately.

```php
<?php

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(public string $month) {}

    public function handle(): void
    {
        echo "  building the report for {$this->month}", PHP_EOL;
    }
}

echo 'dispatching…', PHP_EOL;
GenerateReport::dispatch('2026-01');
echo 'request finished', PHP_EOL;
```

> 🔍 **Behind the scenes: `sync` versus a real queue**
>
> `QUEUE_CONNECTION=sync` — the default in this course and in a fresh install — runs the job **immediately, in the same process**. Nothing is queued. That is convenient for development and deeply misleading: a job that works under `sync` may fail on a real worker because the worker has no session, no authenticated user and no request. Point your local environment at `database` or `redis` early, and run `php artisan queue:work` alongside the dev server.

```php
<?php

use Illuminate\Support\Facades\Queue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class SendInvoice implements ShouldQueue
{
    use Dispatchable;

    public function __construct(public string $to) {}

    public function handle(): void
    {
        echo 'really sending', PHP_EOL;
    }
}

Queue::fake();

SendInvoice::dispatch('ada@example.com');
SendInvoice::dispatch('grace@example.com');

echo 'pushed: ', count(Queue::pushedJobs()[SendInvoice::class] ?? []), PHP_EOL;
echo 'nothing actually ran', PHP_EOL;
```

### Serialising models

`SerializesModels` stores only the model's **key** and re-fetches the row when the job runs.

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

Schema::create('invoices', function (Blueprint $t) {
    $t->id();
    $t->string('status');
});

class Invoice extends Model
{
    public $timestamps = false;
    protected $guarded = [];
}

class ProcessInvoice implements ShouldQueue
{
    use Dispatchable, SerializesModels;

    public function __construct(public Invoice $invoice) {}

    public function handle(): void
    {
        echo '  job sees status: ', $this->invoice->status, PHP_EOL;
    }
}

$invoice = Invoice::create(['status' => 'pending']);
ProcessInvoice::dispatch($invoice);
```

> ⚠️ Because the row is re-fetched, a job that runs five minutes later sees the *current* row, not the one you dispatched. That is usually what you want — and it is why a job whose model has since been deleted fails with `ModelNotFoundException` rather than operating on stale data.

### Chains and batches

```php
<?php

use Illuminate\Support\Facades\Bus;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Contracts\Queue\ShouldQueue;

class Step implements ShouldQueue
{
    use Dispatchable, Queueable;      // Queueable is what provides chaining

    public function __construct(public string $name) {}

    public function handle(): void
    {
        echo '  step: ', $this->name, PHP_EOL;
    }
}

// A chain runs in order, and stops if one fails.
Bus::chain([
    new Step('extract'),
    new Step('transform'),
    new Step('load'),
])->dispatch();
```

## Cache

```php
<?php

use Illuminate\Support\Facades\Cache;

Cache::put('greeting', 'hello', 60);
echo Cache::get('greeting'), PHP_EOL;
echo Cache::get('missing', 'a default'), PHP_EOL;
var_dump(Cache::has('greeting'));

$value = Cache::remember('expensive', 60, function () {
    echo '  computing…', PHP_EOL;
    return 'the result';
});
echo $value, PHP_EOL;

$again = Cache::remember('expensive', 60, function () {
    echo '  this never runs', PHP_EOL;
    return 'ignored';
});
echo $again, PHP_EOL;

Cache::forget('greeting');
var_dump(Cache::has('greeting'));

echo Cache::increment('hits'), Cache::increment('hits'), PHP_EOL;
echo Cache::rememberForever('config.version', fn () => '1.0'), PHP_EOL;
```

`Cache::pull()` reads and forgets in one step; `Cache::add()` writes only if the key is absent, atomically.

```php
<?php

use Illuminate\Support\Facades\Cache;

var_dump(Cache::add('once', 'first', 60));    // true — it was free
var_dump(Cache::add('once', 'second', 60));   // false — already taken
echo Cache::get('once'), PHP_EOL;

Cache::put('temp', 'value', 60);
echo Cache::pull('temp'), PHP_EOL;
var_dump(Cache::has('temp'));
```

### Locks

The answer to "two workers picked up the same job".

```php
<?php

use Illuminate\Support\Facades\Cache;

$lock = Cache::lock('nightly-report', 10);

if ($lock->get()) {
    echo 'got the lock — doing the work', PHP_EOL;

    $second = Cache::lock('nightly-report', 10);
    var_dump($second->get());      // false: someone else holds it

    $lock->release();
    echo 'released', PHP_EOL;
}

$result = Cache::lock('other-task', 10)->get(function () {
    return 'ran inside the lock, released automatically';
});
echo $result, PHP_EOL;
```

> 💡 **Tip:** `Cache::lock()` needs a store that supports atomic locks — Redis, Memcached, DynamoDB or the database store. The `file` and `array` stores do not lock across processes, so a lock that "works" locally can silently do nothing in production.

## Cache-aside, in practice

```php
<?php

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Eloquent\Model;

Schema::create('settings', function (Blueprint $t) {
    $t->id();
    $t->string('key');
    $t->string('value');
});

class Setting extends Model
{
    public $timestamps = false;
    protected $guarded = [];

    public static function value(string $key): ?string
    {
        return Cache::remember("setting.$key", 3600, fn () => static::where('key', $key)->value('value'));
    }

    public static function set(string $key, string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget("setting.$key");      // the important half
    }
}

Setting::set('theme', 'dark');
echo Setting::value('theme'), PHP_EOL;

Setting::set('theme', 'light');
echo Setting::value('theme'), PHP_EOL;      // correct, because set() forgot the key
```

The `Cache::forget()` in `set()` is the part people leave out. A cache without invalidation is a bug with a timer on it.

**Reference:** [Events](https://laravel.com/docs/13.x/events), [Queues](https://laravel.com/docs/13.x/queues) and [Cache](https://laravel.com/docs/13.x/cache).

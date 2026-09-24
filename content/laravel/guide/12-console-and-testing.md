---
title: Artisan & testing
section: Guide Book
summary: Writing console commands, the scheduler, and the fakes and helpers that make a Laravel application testable end to end.
---
## Artisan commands

A command is a class with a signature and a `handle()` method. The signature parses arguments and options for you.

```php
<?php

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Contracts\Console\Kernel as ConsoleKernel;

class Greet extends Command
{
    protected $signature = 'app:greet {name} {--shout} {--times=1}';
    protected $description = 'Greet someone by name';

    public function handle(): int
    {
        $message = "Hello, {$this->argument('name')}";

        for ($i = 0; $i < (int) $this->option('times'); $i++) {
            $this->line($this->option('shout') ? strtoupper($message) : $message);
        }

        return self::SUCCESS;
    }
}

app(ConsoleKernel::class)->registerCommand(new Greet());

Artisan::call('app:greet', ['name' => 'Ada']);
echo Artisan::output();

Artisan::call('app:greet', ['name' => 'Ada', '--shout' => true, '--times' => 2]);
echo Artisan::output();
```

### Signature syntax

```text
{name}                 required argument
{name?}                optional
{name=Ada}             optional with a default
{names*}               array — accepts several
{--shout}              boolean flag
{--times=1}            option with a value
{--Q|queue}            with a shortcut
```

### Talking to the user

```php
<?php

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Contracts\Console\Kernel as ConsoleKernel;

class Report extends Command
{
    protected $signature = 'app:report';
    protected $description = 'Show the output styles';

    public function handle(): int
    {
        $this->info('info — green');
        $this->comment('comment — yellow');
        $this->error('error — red, and goes to stderr');
        $this->line('line — plain');

        $this->table(
            ['Region', 'Total'],
            [['EU', 350], ['US', 400]],
        );

        $bar = $this->output->createProgressBar(3);
        $bar->start();
        for ($i = 0; $i < 3; $i++) {
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();

        return self::SUCCESS;
    }
}

app(ConsoleKernel::class)->registerCommand(new Report());
Artisan::call('app:report');
echo Artisan::output();
```

> ⚠️ A command's exit code matters. `return self::FAILURE` (1) is what tells cron, CI or a supervisor that something went wrong. A command that catches every exception and returns `SUCCESS` will fail silently forever.

### Calling built-in commands

```php
<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::get('/one', fn () => 1)->name('one');
Route::post('/two/{id}', fn () => 2)->name('two');

Artisan::call('route:list', ['--json' => true]);

$routes = collect(json_decode(Artisan::output(), true))
    ->whereIn('name', ['one', 'two']);

foreach ($routes as $route) {
    echo $route['method'], ' ', $route['uri'], ' → ', $route['name'], PHP_EOL;
}
```

The ones you will run most: `migrate`, `migrate:fresh --seed`, `route:list`, `tinker`, `queue:work`, `make:*`, and the `config:cache` / `route:cache` / `view:cache` trio for production.

## The scheduler

Scheduled work is defined in code, not in crontab. One cron entry runs `schedule:run` every minute; Laravel decides what is due.

```php-snippet
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('app:report')->dailyAt('02:00');
Schedule::command('queue:prune-failed')->weekly();

Schedule::call(fn () => Cache::forget('stats'))
    ->hourly()
    ->withoutOverlapping()
    ->onOneServer()
    ->environments(['production']);
```

> 💡 **Tip:** `withoutOverlapping()` and `onOneServer()` are not optional extras in a multi-server deployment — without them a nightly job runs once per web server, simultaneously. Both need a cache store with atomic locks.

## Testing: the application under test

Laravel's test case boots a real application, so a feature test exercises routing, middleware, validation and the database together.

```php-snippet
// tests/Feature/RegistrationTest.php
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('registers a user', function () {
    $response = $this->post('/register', [
        'name' => 'Ada',
        'email' => 'ada@example.com',
        'password' => 'secret-enough',
    ]);

    $response->assertRedirect('/dashboard');

    $this->assertDatabaseHas('users', ['email' => 'ada@example.com']);
});

it('rejects a bad email', function () {
    $this->post('/register', ['email' => 'nope'])
        ->assertSessionHasErrors('email');
});
```

`RefreshDatabase` wraps each test in a transaction and rolls it back, so tests never see each other's rows.

## Fakes: the framework's test doubles

Every fake swaps the real binding for a recorder. Your code is unchanged; nothing leaves the process.

```php
<?php

use Illuminate\Support\Facades\Http;

Http::fake([
    'api.example.com/users/*' => Http::response(['id' => 1, 'name' => 'Ada'], 200),
    'api.example.com/down'    => Http::response('', 503),
    '*'                       => Http::response('catch-all', 200),
]);

$user = Http::get('https://api.example.com/users/1');
echo $user->status(), ' ', $user->json('name'), PHP_EOL;

$down = Http::get('https://api.example.com/down');
var_dump($down->failed(), $down->serverError());

echo Http::get('https://anything.else/x')->body(), PHP_EOL;
```

```php
<?php

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Contracts\Queue\ShouldQueue;

class ThingHappened {}

class DoWork implements ShouldQueue
{
    use Dispatchable;
    public function handle(): void { echo 'never runs under a fake', PHP_EOL; }
}

Event::fake();
Queue::fake();

Event::dispatch(new ThingHappened());
DoWork::dispatch();

echo 'events recorded: ', count(Event::dispatched(ThingHappened::class)), PHP_EOL;
echo 'jobs recorded:   ', count(Queue::pushedJobs()[DoWork::class] ?? []), PHP_EOL;
```

In a real test these become assertions: `Event::assertDispatched()`, `Queue::assertPushed()`, `Mail::assertSent()`, `Notification::assertSentTo()`, `Storage::assertExists()`, `Http::assertSent()`.

## Controlling time

```php
<?php

use Illuminate\Support\Carbon;

Carbon::setTestNow('2026-01-15 09:00:00');

echo 'now:      ', now()->format('Y-m-d H:i'), PHP_EOL;
echo 'tomorrow: ', now()->addDay()->format('Y-m-d'), PHP_EOL;
echo 'diff:     ', now()->diffForHumans(Carbon::parse('2026-01-20')), PHP_EOL;

Carbon::setTestNow('2026-02-15 09:00:00');
echo 'a month later: ', now()->format('Y-m-d'), PHP_EOL;

Carbon::setTestNow();        // always undo it
echo 'real year: ', now()->format('Y'), PHP_EOL;
```

> 🔍 **Behind the scenes: why freezing time is worth the trouble**
>
> A test that asserts "the token expires in 60 minutes" by sleeping is slow and flaky; one that asserts it by computing the same expression as the code under test proves nothing. `Carbon::setTestNow()` — or the test-case helpers `$this->travel(61)->minutes()` and `$this->freezeTime()` — let you move the clock and assert on real behaviour, instantly and deterministically. Anything that reads `now()` becomes testable, which is a good reason never to call `time()` or `new DateTime()` directly.

## Swapping a service in a test

Because everything is resolved from the container, a test can replace any dependency.

```php
<?php

interface Weather
{
    public function today(): string;
}

class ApiWeather implements Weather
{
    public function today(): string { return 'a real API call'; }
}

class Forecast
{
    public function __construct(private Weather $weather) {}
    public function line(): string { return 'Today: ' . $this->weather->today(); }
}

app()->bind(Weather::class, ApiWeather::class);
echo app(Forecast::class)->line(), PHP_EOL;

// In a test:
app()->instance(Weather::class, new class implements Weather {
    public function today(): string { return 'sunny (stubbed)'; }
});

echo app(Forecast::class)->line(), PHP_EOL;
```

This is the payoff for every constructor injection in the codebase: no network, no waiting, and a test that fails for exactly one reason.

**Reference:** [Artisan Console](https://laravel.com/docs/13.x/artisan), [Task Scheduling](https://laravel.com/docs/13.x/scheduling) and [Testing](https://laravel.com/docs/13.x/testing).

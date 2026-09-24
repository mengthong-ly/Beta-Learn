---
title: Service providers & configuration
section: Guide Book
summary: Where every binding is registered, why `register` and `boot` are separate, and how `.env`, config files and caching fit together.
---
## Providers are the bootstrap

A **service provider** is the one place a package or a feature tells the container what it offers. Laravel's own framework is a stack of them; your application adds its own.

```php
<?php

use Illuminate\Support\ServiceProvider;

interface Weather
{
    public function today(): string;
}

class FakeWeather implements Weather
{
    public function today(): string { return 'sunny'; }
}

class WeatherServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bind things. Nothing else is guaranteed to exist yet.
        $this->app->singleton(Weather::class, FakeWeather::class);
    }

    public function boot(): void
    {
        // Every provider has registered by now: use other services freely.
        echo 'booted with: ', app(Weather::class)->today(), PHP_EOL;
    }
}

app()->register(WeatherServiceProvider::class);
echo app(Weather::class)->today(), PHP_EOL;
```

## Why `register` and `boot` are separate

Providers load in order. If a provider used another provider's service inside `register()`, it would depend on load order — a source of bugs that appear when someone reorders a list.

The framework therefore runs **every** `register()` first, then **every** `boot()`. By the time any `boot()` runs, the container is complete.

> ⚠️ Never resolve a service inside `register()`. Even `config()` is risky there. If you need another service, either move the code to `boot()` or inject it lazily with a closure so it is resolved on first use, not at registration time.

```php
<?php

use Illuminate\Support\ServiceProvider;

class GoodProvider extends ServiceProvider
{
    public function register(): void
    {
        // A closure defers resolution until something actually asks.
        $this->app->singleton('report.builder', function ($app) {
            return new class($app['config']->get('app.name', 'Laravel')) {
                public function __construct(private string $appName) {}
                public function build(): string { return "report for {$this->appName}"; }
            };
        });
    }
}

app()->register(GoodProvider::class);
echo app('report.builder')->build(), PHP_EOL;
```

## Deferred providers

A provider that only binds things can be **deferred**: Laravel records what it provides and does not load it until one of those things is asked for.

```php
<?php

use Illuminate\Support\ServiceProvider;
use Illuminate\Contracts\Support\DeferrableProvider;

class PdfServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        echo '  (PdfServiceProvider registered)', PHP_EOL;
        $this->app->singleton('pdf', fn () => new class {
            public function render(): string { return 'a PDF'; }
        });
    }

    public function provides(): array
    {
        return ['pdf'];
    }
}

app()->register(PdfServiceProvider::class);
echo 'app running, pdf not needed yet', PHP_EOL;
echo app('pdf')->render(), PHP_EOL;
```

> 🔍 **Behind the scenes: the deferred-services manifest**
>
> Laravel writes a manifest mapping each deferred binding to its provider. On boot it loads only the *non*-deferred providers and the manifest; the moment something asks for `pdf`, the container consults the manifest, registers that provider, and resolves. For an application with fifty packages this is the difference between constructing fifty providers per request and constructing three. It is also why `provides()` must be accurate — a binding you forget to list will not be found.

## Configuration

Config files are plain PHP arrays in `config/`. They are read through the `config` repository, with dot notation.

```php
<?php

config(['services.weather.key' => 'abc123', 'services.weather.units' => 'metric']);

echo config('services.weather.key'), PHP_EOL;
echo config('services.weather.units'), PHP_EOL;
echo config('services.weather.missing', 'a default'), PHP_EOL;

var_dump(config()->has('services.weather.key'));
print_r(config('services.weather'));
```

## `.env` and `env()`

`.env` holds per-machine values — credentials, hostnames, the environment name. It is not committed.

```php
<?php

echo 'APP_ENV:  ', env('APP_ENV', 'unknown'), PHP_EOL;
echo 'unset:    ', var_export(env('DEFINITELY_NOT_SET'), true), PHP_EOL;
echo 'fallback: ', env('DEFINITELY_NOT_SET', 'used the default'), PHP_EOL;
```

> ⚠️ **Call `env()` only inside `config/` files.** Once the config is cached with `php artisan config:cache`, the `.env` file is no longer loaded at all and every `env()` call elsewhere returns `null`. This is the single most common "works locally, breaks in production" bug in Laravel. The rule is mechanical: `env()` in `config/*.php`, `config()` everywhere else.

```php
<?php

// The pattern: read env once, in a config file…
config(['services.stripe.key' => env('STRIPE_KEY', 'sk_test_fallback')]);

// …and read config everywhere else.
class Billing
{
    public function key(): string
    {
        return config('services.stripe.key');
    }
}

echo app(Billing::class)->key(), PHP_EOL;
```

## Environments

```php
<?php

echo 'environment: ', app()->environment(), PHP_EOL;
var_dump(app()->environment('local'));
var_dump(app()->environment(['production', 'staging']));
var_dump(app()->isProduction());
var_dump(app()->hasDebugModeEnabled());
```

> 🧭 **Scenario:** A seeder that wipes the database guards itself with `if (app()->environment('local'))`. That check is the difference between a useful development tool and an outage. Guard destructive operations by environment, not by a comment.

## Binding config into services

Providers and config together give you the standard Laravel shape: config describes *what*, the provider decides *how*.

```php
<?php

use Illuminate\Support\ServiceProvider;

config(['notify.channel' => 'log', 'notify.prefix' => '[app]']);

class Notifier
{
    public function __construct(private string $channel, private string $prefix) {}

    public function send(string $message): string
    {
        return "{$this->prefix} via {$this->channel}: {$message}";
    }
}

class NotifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(Notifier::class, fn ($app) => new Notifier(
            channel: $app['config']->get('notify.channel'),
            prefix: $app['config']->get('notify.prefix'),
        ));
    }
}

app()->register(NotifyServiceProvider::class);
echo app(Notifier::class)->send('deploy finished'), PHP_EOL;
```

Swapping the channel is now a config change, not a code change — and a test can override it with one `config([...])` call.

**Reference:** [Service Providers](https://laravel.com/docs/13.x/providers) and [Configuration](https://laravel.com/docs/13.x/configuration).

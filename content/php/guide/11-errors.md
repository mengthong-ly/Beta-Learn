---
title: Errors & exceptions
section: Guide Book
summary: The Throwable hierarchy, why PHP has both errors and exceptions, catching and rethrowing, finally, and reading a stack trace.
---
PHP has two failure traditions that finally met in PHP 7. Old-style **errors** (warnings, notices, fatals) came from C; **exceptions** came from object-oriented PHP. Today almost everything that used to be a fatal error is an object you can catch.

## The hierarchy

```text
Throwable  (interface)
├── Error                         engine failures — usually YOUR bug
│   ├── TypeError                 wrong type passed or returned
│   ├── ValueError                right type, impossible value
│   ├── ArithmeticError
│   │   └── DivisionByZeroError
│   ├── ArgumentCountError
│   ├── AssertionError
│   └── UnhandledMatchError
└── Exception                     conditions your program should handle
    ├── ErrorException
    ├── RuntimeException
    │   ├── OutOfBoundsException
    │   └── UnexpectedValueException
    ├── LogicException
    │   ├── InvalidArgumentException
    │   ├── DomainException
    │   └── LengthException
    └── JsonException, …
```

```php
<?php

foreach ([fn() => 1 % 0, fn() => strlen(), fn() => array_chunk([1], 0)] as $f) {
    try {
        $f();
    } catch (\Throwable $e) {
        printf("%-22s %s\n", get_debug_type($e), $e->getMessage());
    }
}
```

> 🔍 **Behind the scenes: why `Error` and `Exception` share only an interface**
>
> They deliberately do **not** share a base class. Before PHP 7, `catch (Exception $e)` was the universal net; had `Error` been made a subclass of `Exception`, every one of those existing catch blocks would suddenly have started swallowing engine bugs — a `TypeError` quietly caught and logged as a business failure. Putting both under the `Throwable` *interface* meant old code kept catching exactly what it always caught, and new code could opt in with `catch (\Throwable $e)`.

## Catching

```php
<?php

function divide(int $a, int $b): float {
    if ($b === 0) {
        throw new InvalidArgumentException("Cannot divide $a by zero");
    }
    return $a / $b;
}

foreach ([[10, 2], [10, 0]] as [$a, $b]) {
    try {
        echo divide($a, $b), "\n";
    } catch (InvalidArgumentException $e) {
        echo 'Caught: ', $e->getMessage(), "\n";
    }
}
```

Catch several types with `|`, and omit the variable when you do not need it.

```php
<?php

try {
    throw new DivisionByZeroError('boom');
} catch (TypeError | DivisionByZeroError $e) {
    echo get_debug_type($e), ': ', $e->getMessage(), "\n";
}

try {
    json_decode('{bad', flags: JSON_THROW_ON_ERROR);
} catch (JsonException) {                  // no variable needed
    echo "That was not JSON\n";
}
```

Order matters: the **first** matching catch wins, so list the specific types before the general ones.

```php
<?php

try {
    throw new InvalidArgumentException('specific');
} catch (InvalidArgumentException $e) {
    echo "specific handler\n";
} catch (LogicException $e) {
    echo "never reached — InvalidArgumentException matched first\n";
}
```

## `finally`

`finally` runs whether the `try` succeeded, threw, or returned. It is for cleanup.

```php
<?php

function work(bool $fail): string {
    try {
        if ($fail) {
            throw new RuntimeException('failed');
        }
        return 'ok';
    } catch (RuntimeException $e) {
        return 'recovered';
    } finally {
        echo "  cleanup ran\n";
    }
}

echo work(false), "\n";
echo work(true), "\n";
```

> ⚠️ A `return` inside `finally` overrides the `return` in the `try` — including overriding an exception on its way out, which makes it vanish silently. Never return from `finally`.

## Throwing well

An exception should say what went wrong, carry the data that explains it, and preserve the cause.

```php
<?php

final class ConfigError extends RuntimeException {
    public function __construct(
        public readonly string $key,
        ?Throwable $previous = null,
    ) {
        parent::__construct("Missing config key: $key", 0, $previous);
    }
}

function loadConfig(array $cfg, string $key): string {
    return $cfg[$key] ?? throw new ConfigError($key);   // throw is an expression
}

try {
    try {
        loadConfig([], 'database.host');
    } catch (ConfigError $e) {
        throw new RuntimeException('Could not start', previous: $e);
    }
} catch (RuntimeException $e) {
    echo $e->getMessage(), "\n";
    echo '  caused by: ', $e->getPrevious()?->getMessage(), "\n";
    echo '  key: ', $e->getPrevious()?->key, "\n";
}
```

Since PHP 8, `throw` is an **expression** — usable in `??`, `?:`, arrow functions and match arms.

## Reading a trace

```php
<?php

function level3(): void { throw new RuntimeException('deep failure'); }
function level2(): void { level3(); }
function level1(): void { level2(); }

try {
    level1();
} catch (RuntimeException $e) {
    echo get_debug_type($e), ': ', $e->getMessage(), "\n";
    echo 'thrown at line ', $e->getLine(), "\n";
    foreach ($e->getTrace() as $i => $frame) {
        printf("  #%d %s() line %s\n", $i, $frame['function'] ?? '?', $frame['line'] ?? '?');
    }
}
```

Read a trace **bottom-up**: the last frame is where it started, the first frame is where it blew up.

## Warnings are not exceptions

`fopen()` on a missing file emits a *warning* and returns `false`. Warnings do not stop the script and are not catchable — unless you convert them.

```php
<?php

set_error_handler(function (int $no, string $msg, string $file, int $line): bool {
    throw new ErrorException($msg, 0, $no, $file, $line);
});

try {
    echo $undefinedVariable;
} catch (ErrorException $e) {
    echo 'Converted to an exception: ', $e->getMessage(), "\n";
}

restore_error_handler();
echo "handler restored\n";
```

> 🧭 **Scenario:** A nightly import "succeeds" every night and imports nothing. The cause is a warning from `fopen()` that nobody sees because `display_errors` is off in production. Converting warnings to `ErrorException` in the bootstrap turns that silence into a stack trace on the first run.

## The `@` operator

`@expr` suppresses diagnostics from that expression. It is almost always the wrong tool: it hides the cause and costs performance.

```php
<?php

$data = ['a' => 1];

echo @$data['missing'] ?? 'nothing', "\n";   // works, but…
echo $data['missing'] ?? 'nothing', "\n";    // …?? already does it, without hiding anything
```

**Reference:** [Exceptions](https://www.php.net/manual/en/language.exceptions.php) and [Predefined Exceptions](https://www.php.net/manual/en/reserved.exceptions.php) in the PHP Manual.

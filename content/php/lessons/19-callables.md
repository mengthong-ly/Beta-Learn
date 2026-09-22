---
title: Callables & first-class callable syntax
section: 7 · Functions
---

A **callable** is anything PHP can call like a function: a closure, an arrow function, or a reference to an existing function or method. The `callable` type accepts any of them.

```php
<?php

function applyTwice(callable $f, int $x): int
{
    return $f($f($x));
}

echo applyTwice(fn($n) => $n + 3, 10), "\n";   // 16
```

## Turning a function into a value: `name(...)`

PHP 8.1 added the **first-class callable syntax**: write a function or method call with a literal `...` in the parentheses, and instead of calling it you get a `Closure` you can pass around.

```php
<?php

$len = strlen(...);
echo $len("hello"), "\n";

$words = ["kiwi", "banana", "fig"];
print_r(array_map(strtoupper(...), $words));
print_r(array_map(strlen(...), $words));
```

The `...` isn't an omission here; it's part of the syntax. It works for your own functions and for methods too.

```php
<?php

class Greeter
{
    public function hello(string $name): string
    {
        return "Hello, $name";
    }

    public static function shout(string $s): string
    {
        return strtoupper($s) . "!";
    }
}

$g = new Greeter();
$hello = $g->hello(...);
$shout = Greeter::shout(...);

echo $hello("Ada"), "\n";
echo $shout("hey"), "\n";
```

## The older forms

Before 8.1, callables were written as strings and arrays: `'strlen'`, `[$object, 'method']` or `'Greeter::shout'`. They still work and you'll see them in older code. `name(...)` is preferred: static analysis tools can follow it, and it respects the scope it was created in (so it can hand out a private method from inside its class).

```php
<?php

echo implode(",", array_map('strtoupper', ["a", "b"])), "\n";
var_dump(is_callable('strtoupper'), is_callable('no_such_function'));
```

## Challenge

> 🎯 **Challenge:** Write `slugify(string $title)` that trims the title, lowercases it and replaces spaces with dashes: `"  Hello World "` becomes `"hello-world"`. Build it by passing `trim(...)` and `strtolower(...)` to `array_reduce`, or any way you like, as long as the result is right.

```php starter
<?php

function slugify(string $title): string
{
    return $title;
}

echo slugify("  Hello World "), "\n";
```

```php solution
<?php

function slugify(string $title): string
{
    $steps = [trim(...), strtolower(...), fn($s) => str_replace(" ", "-", $s)];
    return array_reduce($steps, fn($carry, $step) => $step($carry), $title);
}

echo slugify("  Hello World "), "\n";
```

```php check
expect(slugify("  Hello World ") === "hello-world", "slugify('  Hello World ') should be 'hello-world'");
expect(slugify("PHP Is Fun") === "php-is-fun", "slugify('PHP Is Fun') should be 'php-is-fun'");
expect(slugify("x") === "x", "slugify('x') should be 'x'");
```

**Reference:** [First class callable syntax](https://www.php.net/manual/en/functions.first_class_callable_syntax.php) · [Callables](https://www.php.net/manual/en/language.types.callable.php) in the PHP Manual.

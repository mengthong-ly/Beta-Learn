---
title: Closures & arrow functions
section: 7 · Functions
---

An **anonymous function** has no name. You store it in a variable, or pass it straight to another function. Under the hood it's an object of the `Closure` class. Mind the semicolon after the closing brace: it ends an assignment statement.

```php
<?php

$greet = function (string $name): string {
    return "Hello, $name!";
};

echo $greet("Ada"), "\n";
echo get_debug_type($greet), "\n";   // Closure
```

## Passing functions around

Many built-ins take a function as an argument: `array_map` transforms every element, `array_filter` keeps the ones you approve, and `usort` sorts with your comparison.

```php
<?php

$nums = [1, 2, 3, 4, 5];

$doubled = array_map(function ($n) { return $n * 2; }, $nums);
$evens = array_filter($nums, function ($n) { return $n % 2 === 0; });

echo implode(",", $doubled), "\n";
echo implode(",", $evens), "\n";
```

## Capturing variables with use

A closure can't see outside variables unless you list them in `use`. The value is **copied when the closure is created**; `use (&$x)` captures the variable itself instead.

```php
<?php

$rate = 0.2;
$withTax = function (float $price) use ($rate) {
    return $price * (1 + $rate);
};

$rate = 0.5;               // too late: the closure copied 0.2
echo $withTax(100), "\n";  // 120

$count = 0;
$increment = function () use (&$count) {
    $count++;
};
$increment();
$increment();
echo $count, "\n";         // 2
```

## Arrow functions

`fn (params) => expression` (PHP 7.4) is the short form for a one-expression closure. It captures outside variables **automatically**, by value, so no `use` is needed.

```php
<?php

$rate = 0.2;
$withTax = fn($price) => $price * (1 + $rate);
echo $withTax(50), "\n";

$names = ["ada", "linus", "grace"];
print_r(array_map(fn($n) => ucfirst($n), $names));
```

Because it copies values, an arrow function can't change an outer variable, and its body must be a single expression. For anything longer, use `function () use (...) { }`.

## Challenge

> 🎯 **Challenge:** Write `multiplier(int $factor)` that **returns a function**. The returned function takes a number and multiplies it by `$factor`: `multiplier(3)(5)` is `15`.

```php starter
<?php

function multiplier(int $factor)
{
    return $factor;
}

$triple = multiplier(3);
```

```php solution
<?php

function multiplier(int $factor)
{
    return fn($n) => $n * $factor;
}

$triple = multiplier(3);
echo $triple(5), "\n";
```

```php check
$f = multiplier(3);
expect($f instanceof Closure, "multiplier() should return a function (a Closure).");
expect($f(5) === 15, "multiplier(3)(5) should be 15");
expect(multiplier(10)(7) === 70, "multiplier(10)(7) should be 70");
```

**Reference:** [Anonymous functions](https://www.php.net/manual/en/functions.anonymous.php) · [Arrow functions](https://www.php.net/manual/en/functions.arrow.php) in the PHP Manual.

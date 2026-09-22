---
title: Functions
section: 7 · Functions
---

`function` defines a reusable block of code. `return` hands a value back to the caller and ends the function right there.

```php
<?php

function square(int $n): int
{
    return $n * $n;
}

echo square(4), "\n";
echo square(square(2)), "\n";
```

The types are optional, but they document what the function expects and PHP enforces them. A function with no `return` gives back `null`; declare it `: void` to say so.

```php
<?php

function logLine(string $msg): void
{
    echo "[log] $msg\n";
}

logLine("started");
var_dump(logLine("again"));   // NULL
```

## Call before define

A top-level function can be called **before** the line that defines it: PHP reads the whole file first. The exception is a function defined inside an `if`, which only exists once that code has run.

```php
<?php

echo greet("Ada"), "\n";   // works: greet is defined below

function greet(string $name): string
{
    return "Hello, $name!";
}
```

Function names are case-insensitive (`GREET()` calls `greet()`), and you can't define two functions with the same name.

## Returning several values

A function returns one value, but that value can be an array. Destructure it on the way out.

```php
<?php

function minMax(array $nums): array
{
    return [min($nums), max($nums)];
}

[$low, $high] = minMax([7, 2, 9, 4]);
echo "low $low, high $high\n";
```

## Recursion

A function can call itself. Always give it a case that stops.

```php
<?php

function factorial(int $n): int
{
    return $n <= 1 ? 1 : $n * factorial($n - 1);
}

echo factorial(5), "\n";   // 120
```

## Challenge

> 🎯 **Challenge:** Write `stats(array $nums)` that returns `[sum, average]`, e.g. `stats([2, 4, 6])` returns `[12, 4]`. Return `[0, 0]` for an empty array.

```php starter
<?php

function stats(array $nums): array
{
    return [array_sum($nums), 0];
}

print_r(stats([2, 4, 6]));
```

```php solution
<?php

function stats(array $nums): array
{
    if (!$nums) {
        return [0, 0];
    }
    $sum = array_sum($nums);
    return [$sum, $sum / count($nums)];
}

print_r(stats([2, 4, 6]));
```

```php check
[$s, $a] = stats([2, 4, 6]);
expect($s == 12 && $a == 4, "stats([2, 4, 6]) should return [12, 4]");
[$s, $a] = stats([1, 2]);
expect($s == 3 && $a == 1.5, "stats([1, 2]) should return [3, 1.5]");
expect(stats([]) == [0, 0], "stats([]) should return [0, 0]");
```

**Reference:** [User-defined functions](https://www.php.net/manual/en/functions.user-defined.php) · [Returning values](https://www.php.net/manual/en/functions.returning-values.php) in the PHP Manual.

---
title: Integers & floats
section: 2 · Types
---

PHP has two number types: `int` for whole numbers and `float` for numbers with a fractional part.

```php
<?php

$year = 2025;
$price = 19.99;
$big = 1_000_000;     // underscores are just for readability
$tiny = 7E-10;        // scientific notation makes a float

var_dump($year, $price, $big, $tiny);
```

Integers can also be written in hex (`0x1A`), octal (`0o17`) and binary (`0b1010`). On a 64-bit machine the largest int is `PHP_INT_MAX`, about 9.2 × 10¹⁸. PHP has no unsigned integers.

## Overflow turns into a float

Go past `PHP_INT_MAX` and PHP doesn't wrap around or crash: the result silently becomes a `float`.

```php
<?php

var_dump(PHP_INT_MAX);
var_dump(PHP_INT_MAX + 1);    // float
var_dump(0x1A, 0o17, 0b1010); // 26, 15, 10
```

## Division

There's no integer-division operator. `/` gives an `int` only when both sides are ints and the division is exact. Otherwise you get a float. Use `intdiv()` for whole-number division, and `%` for the remainder.

```php
<?php

var_dump(10 / 2);         // int(5)
var_dump(25 / 7);         // float
var_dump(intdiv(25, 7));  // int(3)
var_dump(25 % 7);         // int(4)
var_dump((int) -8.9);     // int(-8): casting truncates toward zero
```

## Floats aren't exact

`0.1` and `0.7` have no exact binary form, so arithmetic on them is slightly off. The manual's own example: `floor((0.1 + 0.7) * 10)` is `7`, not `8`. **Never compare floats with `==`**; check that they're close enough instead.

```php
<?php

var_dump(floor((0.1 + 0.7) * 10));   // float(7)

$a = 0.1 + 0.2;
var_dump($a == 0.3);                          // false
var_dump(abs($a - 0.3) < PHP_FLOAT_EPSILON);  // true
```

> 💡 **Tip:** `round($x, 2)` rounds for display. For money, store whole cents as an `int`.

## Challenge

> 🎯 **Challenge:** Write `splitMinutes(int $total)` that returns an array `[hours, minutes]` of ints, e.g. `splitMinutes(135)` returns `[2, 15]`. Use `intdiv()` and `%`.

```php starter
<?php

function splitMinutes(int $total)
{
    return [$total / 60, 0];
}

print_r(splitMinutes(135));
```

```php solution
<?php

function splitMinutes(int $total)
{
    return [intdiv($total, 60), $total % 60];
}

print_r(splitMinutes(135));
```

```php check
expect(splitMinutes(135) === [2, 15], "splitMinutes(135) should return [2, 15]");
expect(splitMinutes(59) === [0, 59], "splitMinutes(59) should return [0, 59]");
expect(splitMinutes(120) === [2, 0], "splitMinutes(120) should return [2, 0]");
```

**Reference:** [Integers](https://www.php.net/manual/en/language.types.integer.php) · [Floating point numbers](https://www.php.net/manual/en/language.types.float.php) in the PHP Manual.

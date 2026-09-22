---
title: Expressions & operators
section: 5 · Expressions & Operators
---

The manual's definition of an **expression** is short: *anything that has a value*. `5` is an expression, so is `$price * 2`, and so is a function call. Add a semicolon and an expression becomes a **statement**.

## Arithmetic

| Operator | Meaning |
|---|---|
| `+` `-` `*` `/` | add, subtract, multiply, divide |
| `%` | remainder (the sign follows the left side) |
| `**` | power |

```php
<?php

echo 7 + 3, " ", 7 - 3, " ", 7 * 3, "\n";
echo 7 / 2, "\n";          // 3.5
echo 7 % 3, " ", -7 % 3, "\n";   // 1 -1
echo 2 ** 10, "\n";        // 1024
echo 2 ** 3 ** 2, "\n";    // 512: ** groups right-to-left
```

Dividing by zero, with `/` or `%`, throws a `DivisionByZeroError`.

## Assignment is an expression too

`$a = 5` has a value, 5, which is why `$b = $a = 5` sets both. Combined operators update a variable in place: `+=`, `-=`, `*=`, `/=`, `**=`, and `.=` for strings.

```php
<?php

$b = $a = 5;
$a += 10;              // same as $a = $a + 10
$label = "Total";
$label .= ": $a";      // append to a string
echo "$label, b is $b\n";
```

## Increment and decrement

`++` adds one and `--` subtracts one. Written **before** the variable (`++$i`) the expression gives the new value; written **after** (`$i++`) it gives the old value, then increments.

```php
<?php

$i = 5;
var_dump($i++);   // int(5), then $i becomes 6
var_dump(++$i);   // int(7)
var_dump($i--);   // int(7), then $i becomes 6
var_dump($i);     // int(6)
```

## Precedence

`*` binds tighter than `+`, as in maths. Since PHP 8, `.` binds **looser** than `+` and `-`, so `"Sum: " . 1 + 2` gives `"Sum: 3"`. When in doubt, add parentheses.

```php
<?php

echo 2 + 3 * 4, "\n";         // 14
echo (2 + 3) * 4, "\n";       // 20
echo "Sum: " . 1 + 2, "\n";   // Sum: 3
```

> ⚠️ **Gotcha:** PHP has word operators `and` and `or`, but they bind more loosely than `=`. `$ok = true and false;` stores `true`! Stick to `&&` and `||`.

## Challenge

> 🎯 **Challenge:** Write `compound(float $amount, float $rate, int $years)` that returns `$amount * (1 + $rate) ** $years`, rounded to 2 decimals with `round()`. For example `compound(1000, 0.05, 2)` returns `1102.5`.

```php starter
<?php

function compound(float $amount, float $rate, int $years): float
{
    return $amount * (1 + $rate) * $years;
}

echo compound(1000, 0.05, 2), "\n";
```

```php solution
<?php

function compound(float $amount, float $rate, int $years): float
{
    return round($amount * (1 + $rate) ** $years, 2);
}

echo compound(1000, 0.05, 2), "\n";
```

```php check
expect(abs(compound(1000, 0.05, 2) - 1102.5) < 0.001, "compound(1000, 0.05, 2) should return 1102.5");
expect(abs(compound(500, 0.1, 3) - 665.5) < 0.001, "compound(500, 0.1, 3) should return 665.5");
expect(compound(100, 0.5, 0) == 100, "Zero years should leave the amount unchanged.");
```

**Reference:** [Expressions](https://www.php.net/manual/en/language.expressions.php) · [Arithmetic operators](https://www.php.net/manual/en/language.operators.arithmetic.php) · [Operator precedence](https://www.php.net/manual/en/language.operators.precedence.php) in the PHP Manual.

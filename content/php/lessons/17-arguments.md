---
title: Arguments: defaults, named & variadic
section: 7 · Functions
---

A parameter can have a **default value**, used when the caller leaves that argument out. Required parameters come first, optional ones after.

```php
<?php

function coffee(string $type = "cappuccino", int $shots = 1): string
{
    return "$shots × $type";
}

echo coffee(), "\n";
echo coffee("latte"), "\n";
echo coffee("espresso", 2), "\n";
```

Passing `null` does **not** trigger the default: it passes `null`.

## Named arguments

Since PHP 8.0 you can pass arguments by **parameter name**. Order stops mattering, you can skip optional parameters, and the call explains itself.

```php
<?php

function coffee(string $type = "cappuccino", int $shots = 1, bool $oat = false): string
{
    return "$shots × $type" . ($oat ? " with oat milk" : "");
}

echo coffee(oat: true), "\n";
echo coffee("mocha", oat: true), "\n";   // positional first, then named
echo str_pad("7", 3, pad_type: STR_PAD_LEFT, pad_string: "0"), "\n";
```

Named arguments work with built-in functions too. Positional arguments have to come before named ones:

```php
<?php

function coffee(string $type = "cappuccino", int $shots = 1): string
{
    return "$shots × $type";
}

echo coffee(type: "latte", 2); // error! Cannot use positional argument after named argument
```

## Variadics: any number of arguments

`...$nums` collects the remaining arguments into an array. The same `...` in a call does the reverse and **spreads** an array into arguments.

```php
<?php

function total(int ...$nums): int
{
    return array_sum($nums);
}

echo total(1, 2, 3), "\n";
echo total(), "\n";

$prices = [5, 10, 15];
echo total(...$prices), "\n";
```

## By reference

Arguments are passed **by value**: the function gets a copy. Put `&` before a parameter and the function works on the caller's variable itself.

```php
<?php

function addTax(float &$price): void
{
    $price *= 1.2;
}

$cost = 100;
addTax($cost);
echo $cost, "\n";   // 120
```

> 💡 **Tip:** returning a new value is usually clearer than changing an argument. Built-ins like `sort()` take their array by reference, which is why `sort($list)` changes `$list`.

## Challenge

> 🎯 **Challenge:** Write `joinWords(string $separator = " ", string ...$words)` that joins the words with the separator. `joinWords("-", "a", "b", "c")` returns `"a-b-c"`.

```php starter
<?php

function joinWords(string $separator = " ", string ...$words): string
{
    return "";
}

echo joinWords("-", "a", "b", "c"), "\n";
```

```php solution
<?php

function joinWords(string $separator = " ", string ...$words): string
{
    return implode($separator, $words);
}

echo joinWords("-", "a", "b", "c"), "\n";
```

```php check
expect(joinWords("-", "a", "b", "c") === "a-b-c", "joinWords('-', 'a', 'b', 'c') should return 'a-b-c'");
expect(joinWords(", ", "x") === "x", "A single word needs no separator.");
expect(joinWords() === "", "No words gives an empty string.");
expect(joinWords(" ", ...["hi", "there"]) === "hi there", "Spreading an array should work too.");
```

**Reference:** [Function parameters and arguments](https://www.php.net/manual/en/functions.arguments.php) in the PHP Manual.

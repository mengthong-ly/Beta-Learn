---
title: Type juggling & declarations
section: 2 · Types
---

When a value is used somewhere that expects another type, PHP converts it for you. This is called **type juggling**. The original variable doesn't change; PHP converts only the value it uses right there.

```php
<?php

var_dump("42" + 1);      // int(43): a numeric string acts as a number
var_dump("3.5" + 1);     // float(4.5)
var_dump(1 . "");        // string(1) "1": . wants strings
var_dump((int) "12abc"); // int(12): an explicit cast
```

A string that isn't numeric at all, like `"abc"`, can't be used in arithmetic: PHP 8 throws a `TypeError`.

```php
<?php

echo "abc" + 1; // error! TypeError: Unsupported operand types
```

## Casts

Write a type in parentheses to convert on purpose: `(int)`, `(float)`, `(string)`, `(bool)`, `(array)` and `(object)`.

```php
<?php

var_dump((float) "1.5e3");  // float(1500)
var_dump((string) 3.0);     // string(1) "3"
var_dump((bool) "0");       // bool(false)
var_dump((array) "x");      // array with one element
```

## Type declarations

You can declare the types a function accepts and returns. PHP checks them on every call and throws a `TypeError` if a value doesn't fit.

```php
<?php

function area(float $w, float $h): float
{
    return $w * $h;
}

var_dump(area(3, 4));      // an int is fine where a float is expected
var_dump(area("2", "5"));  // coerced: numeric strings are converted
```

`?string` means "string or null", and `int|string` (a **union type**) accepts either. Other useful ones are `void` (returns nothing), `mixed` (anything) and `never` (the function never returns).

## Strict types

By default PHP **coerces** scalar arguments, as `area("2", "5")` showed. Put `declare(strict_types=1);` as the very first statement of a file and calls made from that file must pass the exact type. The one exception: an `int` is still accepted for a `float`.

```php
<?php
declare(strict_types=1);

function double(int $n): int
{
    return $n * 2;
}

echo double(21), "\n";
echo double("21"), "\n"; // error! TypeError: must be of type int, string given
```

> 💡 **Tip:** most modern PHP projects start every file with `declare(strict_types=1);`. It catches mistakes early instead of converting them quietly.

## Challenge

> 🎯 **Challenge:** Give `average()` type declarations: it takes an `array` of numbers and returns a `float`. `average([1, 2])` should return `1.5`, and `average([2, 4])` should return `3.0` (a float, not the int `3`).

```php starter
<?php

function average($numbers)
{
    return array_sum($numbers) / count($numbers);
}

var_dump(average([2, 4]));
```

```php solution
<?php

function average(array $numbers): float
{
    return array_sum($numbers) / count($numbers);
}

var_dump(average([2, 4]));
```

```php check
expect(average([1, 2]) === 1.5, "average([1, 2]) should return 1.5");
expect(average([2, 4]) === 3.0, "average([2, 4]) should return the float 3.0: declare the return type float.");
$param = (new ReflectionFunction('average'))->getParameters()[0];
expect((string) $param->getType() === 'array', "Declare the parameter as array.");
```

**Reference:** [Type Juggling](https://www.php.net/manual/en/language.types.type-juggling.php) · [Type declarations](https://www.php.net/manual/en/language.types.declarations.php) in the PHP Manual.

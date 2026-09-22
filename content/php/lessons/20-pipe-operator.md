---
title: The pipe operator
section: 7 · Functions
---

New in **PHP 8.5**: the pipe operator `|>` takes the value on its left and passes it to the callable on its right. The whole expression evaluates to whatever that callable returns.

```php
<?php

$length = "Hello World" |> strlen(...);
echo $length, "\n";   // 11, same as strlen("Hello World")
```

## Why bother?

Nested calls read inside-out: in `strtoupper(trim($s))` the first step, `trim`, is buried in the middle. A pipe chain reads top to bottom, in the order things happen, without temporary variables.

```php
<?php

$title = "  hello pipes  ";

$nested = str_replace(" ", "-", strtoupper(trim($title)));

$piped = $title
    |> trim(...)
    |> strtoupper(...)
    |> (fn($s) => str_replace(" ", "-", $s));

echo $nested, "\n";
echo $piped, "\n";
```

## The rules

- The right side must be a callable that takes **one** argument: a first-class callable like `trim(...)`, a closure, or an object with `__invoke()`.
- A function that needs more arguments goes inside an arrow function that fills them in, as `str_replace` does above.
- Arrow functions in a pipe **must be wrapped in parentheses**.
- Functions that take their parameter by reference, like `sort()`, aren't allowed.

```php
<?php

$scores = [72, 95, 88, 61];

$report = $scores
    |> (fn($xs) => array_filter($xs, fn($x) => $x >= 70))
    |> (fn($xs) => array_map(fn($x) => "$x%", $xs))
    |> (fn($xs) => implode(", ", $xs));

echo $report, "\n";   // 72%, 95%, 88%
```

> 💡 **Tip:** pipes shine for short, linear transformations. If a step needs a lot of logic, give it a name as a normal function and pipe into `thatFunction(...)`.

## Challenge

> 🎯 **Challenge:** Write `wordCount(string $text)` using a pipe chain: trim the text, split it on spaces with `explode(" ", ...)`, drop empty pieces with `array_filter`, then `count` them. `wordCount("  the quick  brown fox ")` is `4`.

```php starter
<?php

function wordCount(string $text): int
{
    return $text |> strlen(...);
}

echo wordCount("  the quick  brown fox "), "\n";
```

```php solution
<?php

function wordCount(string $text): int
{
    return $text
        |> trim(...)
        |> (fn($s) => explode(" ", $s))
        |> array_filter(...)
        |> count(...);
}

echo wordCount("  the quick  brown fox "), "\n";
```

```php check
expect(wordCount("  the quick  brown fox ") === 4, "wordCount('  the quick  brown fox ') should be 4");
expect(wordCount("one") === 1, "wordCount('one') should be 1");
expect(wordCount("   ") === 0, "Only spaces means 0 words.");
```

**Reference:** [Functional operators](https://www.php.net/manual/en/language.operators.functional.php) in the PHP Manual · [PHP 8.5 release notes](https://www.php.net/releases/8.5/).

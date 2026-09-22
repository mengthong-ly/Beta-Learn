---
title: Comparison & logic
section: 5 · Expressions & Operators
---

PHP has two kinds of equality. `==` compares values **after type juggling**; `===` also requires the **same type**.

```php
<?php

var_dump(1 == "1");     // true: "1" is juggled to 1
var_dump(1 === "1");    // false: int vs string
var_dump("1" == "01");  // true: numeric strings compare as numbers
var_dump(0 == "a");     // false in PHP 8: compared as strings
var_dump(null == []);   // true, which is exactly why === is safer
```

The manual's advice: use `===` and `!==` unless you truly want juggling. `<`, `>`, `<=` and `>=` work on numbers and strings as you'd expect.

## The spaceship operator

`$a <=> $b` returns `-1`, `0` or `1` when `$a` is less than, equal to or greater than `$b`. It's exactly what sorting functions want.

```php
<?php

echo 1 <=> 2, " ", 2 <=> 2, " ", 3 <=> 2, "\n";   // -1 0 1

$words = ["pear", "fig", "banana"];
usort($words, fn($a, $b) => strlen($a) <=> strlen($b));
echo implode(", ", $words), "\n";
```

## Logical operators

`&&` (and), `||` (or) and `!` (not) combine conditions. They **short-circuit**: in `false && f()` the call to `f()` never happens. Unlike JavaScript, they always return a `bool`.

```php
<?php

$age = 20;
$hasTicket = true;

var_dump($age >= 18 && $hasTicket);   // true
var_dump(!$hasTicket || $age < 12);   // false
var_dump(0 || "avocado");             // bool(true), not "avocado"
```

## Picking a value: ?:, ?? and ??=

- `cond ? a : b` is the ternary: `a` if `cond` is truthy, else `b`.
- `a ?: b` (the short ternary) gives `a` if it's truthy, else `b`.
- `a ?? b` (null coalescing) gives `a` if it exists and isn't `null`, else `b`, **without** an undefined-key warning.
- `$x ??= value` assigns only if `$x` is `null` or missing.

```php
<?php

$user = ["name" => "Ada", "nick" => ""];

echo isset($user["name"]) ? "named" : "anonymous", "\n";
echo $user["nick"] ?: "no nickname", "\n";           // "" is falsy
echo $user["email"] ?? "no email", "\n";             // missing key, no warning

$user["role"] ??= "reader";
echo $user["role"], "\n";
```

Reading a missing array key directly gives a warning. That's the reason `??` exists: reach for it whenever a key or variable might be missing.

## Challenge

> 🎯 **Challenge:** Write `displayName(array $user)` that returns the user's `"nick"` if it's a non-empty string, otherwise their `"name"`, otherwise `"Guest"`. The array may be missing either key.

```php starter
<?php

function displayName(array $user): string
{
    return $user["nick"] ?? "";
}

echo displayName(["name" => "Ada"]), "\n";
```

```php solution
<?php

function displayName(array $user): string
{
    return ($user["nick"] ?? "") ?: ($user["name"] ?? "Guest");
}

echo displayName(["name" => "Ada"]), "\n";
```

```php check
expect(displayName(["nick" => "ace", "name" => "Ada"]) === "ace", "Use the nick when it's set.");
expect(displayName(["nick" => "", "name" => "Ada"]) === "Ada", "An empty nick should fall back to the name.");
expect(displayName(["name" => "Ada"]) === "Ada", "A missing nick should fall back to the name.");
expect(displayName([]) === "Guest", "With neither key, return 'Guest'.");
```

**Reference:** [Comparison operators](https://www.php.net/manual/en/language.operators.comparison.php) · [Logical operators](https://www.php.net/manual/en/language.operators.logical.php) in the PHP Manual.

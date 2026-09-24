---
title: Types & type juggling
section: Guide Book
summary: The ten types, how PHP converts between them, why `0 == "abc"` changed in PHP 8, and what `declare(strict_types=1)` really does.
---
PHP is **dynamically typed**: a variable has no type, the *value* in it does. Assigning a new value can change the type at any moment.

## The types

| Type | Example | Notes |
| --- | --- | --- |
| `null` | `null` | the only value of its type — "no value" |
| `bool` | `true`, `false` | |
| `int` | `42`, `-7`, `0x2A` | platform-sized, 64-bit almost everywhere |
| `float` | `3.14`, `1e3` | IEEE-754 double |
| `string` | `'hi'`, `"hi"` | a byte string, not a character string |
| `array` | `[1, 2]` | an ordered map |
| `object` | `new stdClass` | |
| `callable` | `'strlen'`, `fn() => 1` | a type hint, not a storable type |
| `resource` | a file handle | a handle to something outside PHP |
| `never`, `void` | — | return types only |

```php
<?php

foreach ([null, true, 42, 3.14, 'hi', [1, 2], new stdClass] as $v) {
    printf("%-10s %s\n", get_debug_type($v), var_export($v, true));
}
```

> 💡 **Tip:** `get_debug_type()` is almost always what you want over `gettype()`. It returns the names you actually write — `int`, `bool`, `float`, and the class name for objects — where `gettype()` returns the historical `integer`, `boolean`, `double`.

## Type juggling

PHP converts values automatically when the context demands a particular type. The value itself never changes — the conversion is temporary.

```php
<?php

echo 5 + '3', "\n";          // numeric context:  8
echo 5 . '3', "\n";          // string context:   53
var_dump((bool) '0');        // logical context:  false
var_dump((bool) '0.0');      // ...but this one is true
```

### What counts as false

Only these are falsy. Everything else — including `'0.0'`, `'false'`, `-1` and `[0]` — is truthy.

```php
<?php

$falsy = [false, 0, -0.0, '', '0', [], null];

foreach ($falsy as $v) {
    printf("%-8s → %s\n", var_export($v, true), var_export((bool) $v, true));
}
```

> 🔍 **Behind the scenes: why `'0'` is false but `'0.0'` is true**
>
> The rule is not "does it look like zero". A string is falsy if it is empty **or** exactly the one character `"0"`. That is it. `'0.0'`, `'00'` and `' '` are all two-or-more characters that are not `"0"`, so they are true. This is a byte-level check the engine can do without parsing a number, and it dates back to PHP's earliest versions.

## Comparison: `==` versus `===`

`===` compares type *and* value. `==` converts first. Prefer `===`.

```php
<?php

var_dump(1 === '1');     // false — different types
var_dump(1 == '1');      // true  — '1' is a numeric string
var_dump('1' == '01');   // true  — both numeric, compared as numbers
var_dump('10' == '1e1'); // true  — 1e1 is numeric notation for 10
var_dump(100 == '1e2');  // true
```

### The PHP 8 change everyone should know

Before PHP 8, comparing a number with a string converted the *string to a number* — so `0 == "abc"` was `true`, because `"abc"` became `0`. Since PHP 8 the **number is converted to a string** when the string is not numeric, so the comparison is a string comparison.

```php
<?php

var_dump(0 == 'abc');     // false in PHP 8+ (was true before)
var_dump(0 == '');        // false in PHP 8+ (was true before)
var_dump('abc' == '0');   // false
var_dump(0 == '0');       // true — '0' IS numeric
```

> 🧭 **Scenario:** Old code guarded a login with `if ($password == 0)`. On PHP 7 any non-numeric password matched — a real vulnerability that shipped more than once. PHP 8 closes it, and `===` would have closed it a decade earlier.

## Casting explicitly

```php
<?php

var_dump((int) '42 apples');    // 42  — leading digits are taken
var_dump((int) 'apples 42');    // 0   — no leading digits
var_dump((float) '1.5e3');      // 1500.0
var_dump((string) true);        // "1"
var_dump((string) false);       // ""  — not "0"
var_dump((array) 'solo');       // ["solo"]
```

A non-numeric string in *arithmetic* is different from a cast: it throws.

```php
<?php

try {
    echo 'apples' + 1;      // throws: Unsupported operand types
} catch (\TypeError $e) {
    echo 'TypeError: ', $e->getMessage(), "\n";
}

echo '5 apples' + 1, "\n";  // 6, plus a Warning: the ' apples' was discarded
```

## Declared types and `strict_types`

Type declarations on parameters, returns and properties are checked at runtime. In the default **coercive** mode PHP will convert a value if it safely can.

```php
<?php

function half(int $n): float {
    return $n / 2;
}

echo half(7), "\n";       // 3.5
echo half('8'), "\n";     // 4   — the numeric string is coerced to int
```

`declare(strict_types=1)` — which must be the very first statement in a file — turns coercion off for calls made *from that file*. Only `int` → `float` widening survives.

```php
<?php

declare(strict_types=1);

function half(int $n): float {
    return $n / 2;
}

echo half(7), "\n";

try {
    echo half('8');      // throws: must be of type int, string given
} catch (\TypeError $e) {
    echo 'TypeError: ', $e->getMessage(), "\n";
}
```

> 🔍 **Behind the scenes: strict mode is per *calling* file, not per function**
>
> The check happens at the call site. If `a.php` declares `strict_types=1` and calls a function defined in `b.php`, the call is strict — even though `b.php` says nothing. And the reverse: a non-strict file calling a function in a strict file gets coercion. This lets you adopt strict types file by file in a large codebase, and it is why library authors declare it in every file rather than assuming their callers did.

## Union, nullable and intersection types

```php
<?php

function parseId(int|string $id): ?int {
    return is_int($id) ? $id : (ctype_digit($id) ? (int) $id : null);
}

var_dump(parseId(7), parseId('12'), parseId('x7'));
```

`?int` is shorthand for `int|null`. `A&B` requires a value satisfying both interfaces. `mixed` accepts anything and is the explicit way to say "no constraint".

**Reference:** [Types](https://www.php.net/manual/en/language.types.php) and [Type juggling](https://www.php.net/manual/en/language.types.type-juggling.php) in the PHP Manual.

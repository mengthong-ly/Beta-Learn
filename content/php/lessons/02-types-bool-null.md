---
title: Types, booleans & null
section: 2 · Types
---

PHP is **dynamically typed**: you never declare a variable's type, because PHP works it out at runtime from the value. There are nine built-in types:

| Kind | Types |
|---|---|
| scalar | `null`, `bool`, `int`, `float`, `string` |
| compound | `array`, `object`, `callable` |
| special | `resource` |

Two tools tell you what you've got: `var_dump()` shows the value **and** its type, and `get_debug_type()` returns the type name as a string.

```php
<?php

$ok = true;
$name = "Ada";
$age = 36;

var_dump($ok, $age);
echo get_debug_type($name), "\n";
echo get_debug_type(3.5), "\n";
```

The `is_*` functions (`is_int`, `is_string`, `is_bool`, …) answer yes or no for one type.

## Booleans

A `bool` is `true` or `false`. When PHP needs a yes/no, in an `if` for example, it converts the value to `bool`. These values count as **false**:

- `false` itself
- the integer `0` and the floats `0.0` and `-0.0`
- the empty string `""` **and the string `"0"`**
- an array with no elements
- `null`

Everything else is true, including `-1` and the string `"false"`.

```php
<?php

var_dump((bool) "");       // false
var_dump((bool) "0");      // false: a common surprise
var_dump((bool) "0.0");    // true: only "0" is special
var_dump((bool) []);       // false
var_dump((bool) -1);       // true
```

## null

`null` is the type with a single value: "no value here". A variable is `null` when you assign `null`, and also after `unset()` removes it. Check for it with `=== null` or `is_null()`.

```php
<?php

$middleName = null;
var_dump($middleName === null);   // true
var_dump(is_null($middleName));   // true
echo get_debug_type($middleName), "\n";
```

> 💡 **Tip:** reach for `var_dump()` whenever a value surprises you. `echo` prints `false` and `null` as an empty string, which hides exactly what you need to see.

## Challenge

> 🎯 **Challenge:** Write `isFalsy($value)` that returns `true` when PHP treats `$value` as false and `false` otherwise. Then output the type name of `3.5` with `get_debug_type()`.

```php starter
<?php

function isFalsy($value)
{
    return false;
}

// output the type name of 3.5
```

```php solution
<?php

function isFalsy($value)
{
    return !$value;
}

echo get_debug_type(3.5), "\n";
```

```php check
foreach ([0, 0.0, "", "0", [], null, false] as $v) {
    expect(isFalsy($v) === true, "isFalsy(" . var_export($v, true) . ") should be true");
}
foreach ([1, -1, "0.0", "false", [0], true, " "] as $v) {
    expect(isFalsy($v) === false, "isFalsy(" . var_export($v, true) . ") should be false");
}
expect(trim($output) === "float", "Output the type name of 3.5, which is 'float'.");
```

**Reference:** [Types](https://www.php.net/manual/en/language.types.intro.php) · [Booleans](https://www.php.net/manual/en/language.types.boolean.php) · [NULL](https://www.php.net/manual/en/language.types.null.php) in the PHP Manual.

---
title: Variables
section: 3 · Variables
---

Every variable starts with `$`, followed by a name that begins with a letter or underscore. Names are **case-sensitive**: `$name` and `$Name` are two different variables. You create a variable just by assigning to it.

```php
<?php

$name = "Ada";
$Name = "Grace";
$_count = 3;

echo "$name, $Name, $_count\n";
```

## Assignment copies the value

`$b = $a` copies the value, so changing `$b` later leaves `$a` alone. That holds for strings, numbers and arrays alike. (Objects behave differently; you'll meet them in the classes section.)

```php
<?php

$a = "Bob";
$b = $a;
$b = "Changed";
echo "$a / $b\n";   // Bob / Changed
```

## Undefined variables

Reading a variable that was never assigned gives `null` and raises a **warning**: `Undefined variable $x`. The script keeps running, but the warning points at a bug. `isset()` checks for a variable safely: it returns `true` only when the variable exists and isn't `null`. `unset()` destroys one.

```php
<?php

$city = "Oslo";
var_dump(isset($city));     // true
var_dump(isset($country));  // false, and no warning

unset($city);
var_dump(isset($city));     // false
```

## Variable variables

`$$a` uses the **value** of `$a` as a variable name. It exists, but code that uses it is hard to follow. An array with string keys is almost always clearer.

```php
<?php

$field = "color";
$$field = "teal";   // creates $color
echo $color, "\n";

// usually clearer:
$settings = [];
$settings[$field] = "teal";
echo $settings["color"], "\n";
```

## Challenge

> 🎯 **Challenge:** Write `describe($value)` that returns `"empty"` when `$value` is `null`, and otherwise `"set: "` followed by the value, e.g. `describe("PHP")` returns `"set: PHP"`. Use `isset()`.

```php starter
<?php

function describe($value)
{
    return "set: $value";
}

echo describe("PHP"), "\n";
echo describe(null), "\n";
```

```php solution
<?php

function describe($value)
{
    if (!isset($value)) {
        return "empty";
    }
    return "set: $value";
}

echo describe("PHP"), "\n";
echo describe(null), "\n";
```

```php check
expect(describe("PHP") === "set: PHP", "describe('PHP') should return 'set: PHP'");
expect(describe(null) === "empty", "describe(null) should return 'empty'");
expect(describe(0) === "set: 0", "describe(0) should return 'set: 0': 0 is set, just falsy.");
```

**Reference:** [Variables: Basics](https://www.php.net/manual/en/language.variables.basics.php) · [Variable variables](https://www.php.net/manual/en/language.variables.variable.php) in the PHP Manual.

---
title: Constants
section: 4 · Constants
---

A constant is a name for a value that **can't change** while the script runs. Constants have no `$`, are case-sensitive, and by convention are written in UPPERCASE.

```php
<?php

const TAX_RATE = 0.2;
const COLORS = ["red", "green", "blue"];   // arrays are allowed

$price = 50;
echo $price * (1 + TAX_RATE), "\n";
echo COLORS[1], "\n";
```

Constants are **global**: unlike variables, you can use them inside any function without passing them in.

```php
<?php

const APP_NAME = "ThongLearn";

function title(string $page): string
{
    return APP_NAME . " · " . $page;
}

echo title("Home"), "\n";
```

## const vs define()

`const` is processed when the file is compiled, so it must sit at the top level of a file or inside a class, not inside an `if` or a function. `define()` runs like a normal function call, so it works anywhere, including conditionally. `defined()` tells you whether a constant exists.

```php
<?php

if (!defined("DEBUG")) {
    define("DEBUG", false);
}

var_dump(DEBUG);
var_dump(defined("DEBUG"), defined("NOPE"));
```

In PHP 8, using a constant that doesn't exist throws an `Error`:

```php
<?php

echo MISSING_CONSTANT; // error! Undefined constant
```

## Magic constants

A few constants change depending on where you use them. They start and end with two underscores:

| Constant | Value |
|---|---|
| `__LINE__` | the current line number |
| `__FILE__` / `__DIR__` | the current file's path and its folder |
| `__FUNCTION__` | the current function's name |
| `__CLASS__` / `__METHOD__` | the current class and method |

```php
<?php

function whereAmI(): string
{
    return __FUNCTION__ . " on line " . __LINE__;
}

echo whereAmI(), "\n";
```

## Challenge

> 🎯 **Challenge:** Define a constant `MAX_LOGIN_ATTEMPTS` equal to `3`, and write `isLocked(int $attempts)` that returns `true` once `$attempts` reaches the constant.

```php starter
<?php

// define MAX_LOGIN_ATTEMPTS here

function isLocked(int $attempts): bool
{
    return false;
}

var_dump(isLocked(3));
```

```php solution
<?php

const MAX_LOGIN_ATTEMPTS = 3;

function isLocked(int $attempts): bool
{
    return $attempts >= MAX_LOGIN_ATTEMPTS;
}

var_dump(isLocked(3));
```

```php check
expect(defined('MAX_LOGIN_ATTEMPTS') && MAX_LOGIN_ATTEMPTS === 3, "Define the constant MAX_LOGIN_ATTEMPTS as 3.");
expect(isLocked(2) === false, "isLocked(2) should be false.");
expect(isLocked(3) === true, "isLocked(3) should be true.");
expect(isLocked(5) === true, "isLocked(5) should be true.");
```

**Reference:** [Constants](https://www.php.net/manual/en/language.constants.php) · [Magic constants](https://www.php.net/manual/en/language.constants.magic.php) in the PHP Manual.

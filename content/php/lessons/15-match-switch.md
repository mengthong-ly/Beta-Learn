---
title: match & switch
section: 6 · Control Structures
---

`match` (PHP 8.0) picks a value by comparing one subject against several arms. It's an **expression**, so it produces a value you can assign or return.

```php
<?php

$status = 404;

$message = match ($status) {
    200, 201 => "OK",
    301, 302 => "Redirect",
    404 => "Not found",
    default => "Something else",
};

echo $message, "\n";
```

What makes `match` safe:

- It compares with `===`, so `"1"` doesn't match `1`.
- Only one arm runs. There's no fall-through and no `break` to forget.
- Commas list several values for one arm.
- If nothing matches and there's no `default`, it throws an `UnhandledMatchError`.

```php
<?php

$size = "XL";

echo match ($size) {
    "S" => "small",
    "M" => "medium",
    "L" => "large",
}; // error! UnhandledMatchError
```

## Ranges with match (true)

`match` only checks identity, but `match (true)` runs the first arm whose condition is `true`: a tidy replacement for a long `if`/`elseif` chain.

```php
<?php

$age = 23;

echo match (true) {
    $age >= 65 => "senior",
    $age >= 25 => "adult",
    $age >= 18 => "young adult",
    default => "kid",
}, "\n";
```

## switch

`switch` is the older statement. It compares with **loose** `==`, and once a `case` matches, execution **falls through** into the following cases until it meets a `break`. Stacking empty cases is how you share code between them.

```php
<?php

$day = "Sat";

switch ($day) {
    case "Sat":
    case "Sun":
        echo "Weekend\n";
        break;
    default:
        echo "Weekday\n";
}
```

> 💡 **Tip:** prefer `match` when you want a value back. It's shorter and it can't fall through by accident.

## Challenge

> 🎯 **Challenge:** Write `httpClass(int $code)` using `match (true)` that returns `"success"` for 200–299, `"redirect"` for 300–399, `"client error"` for 400–499, `"server error"` for 500–599 and `"unknown"` otherwise.

```php starter
<?php

function httpClass(int $code): string
{
    return match ($code) {
        200 => "success",
        default => "unknown",
    };
}

echo httpClass(404), "\n";
```

```php solution
<?php

function httpClass(int $code): string
{
    return match (true) {
        $code >= 200 && $code < 300 => "success",
        $code >= 300 && $code < 400 => "redirect",
        $code >= 400 && $code < 500 => "client error",
        $code >= 500 && $code < 600 => "server error",
        default => "unknown",
    };
}

echo httpClass(404), "\n";
```

```php check
$cases = [200 => "success", 204 => "success", 301 => "redirect", 404 => "client error", 499 => "client error", 500 => "server error", 100 => "unknown", 600 => "unknown"];
foreach ($cases as $code => $want) {
    expect(httpClass($code) === $want, "httpClass($code) should be '$want', got '" . httpClass($code) . "'");
}
```

**Reference:** [match](https://www.php.net/manual/en/control-structures.match.php) · [switch](https://www.php.net/manual/en/control-structures.switch.php) in the PHP Manual.

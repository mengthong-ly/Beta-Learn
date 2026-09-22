---
title: foreach
section: 6 · Control Structures
---

`foreach` walks through an array one element at a time. It's the loop you'll use most, because you don't manage a counter or worry about which keys exist.

```php
<?php

$langs = ["PHP", "Go", "Rust"];

foreach ($langs as $lang) {
    echo "I like $lang\n";
}
```

Add `$key =>` to get each key as well as its value.

```php
<?php

$stock = ["apples" => 12, "pears" => 0, "plums" => 5];

foreach ($stock as $fruit => $count) {
    echo str_pad($fruit, 8), $count, "\n";
}
```

## Unpacking each row

When every element is itself an array, you can destructure it right in the loop header.

```php
<?php

$points = [[1, 2], [3, 4], [5, 6]];
foreach ($points as [$x, $y]) {
    echo "($x, $y) ";
}
echo "\n";

$users = [["name" => "Ada", "role" => "admin"], ["name" => "Linus", "role" => "dev"]];
foreach ($users as ["name" => $name, "role" => $role]) {
    echo "$name is $role\n";
}
```

## Changing elements with &

`$value` is a **copy**, so assigning to it doesn't touch the array. To change the array itself, loop by reference with `&$value`, then `unset($value)` right after the loop.

```php
<?php

$prices = [10, 20, 30];

foreach ($prices as &$price) {
    $price *= 2;
}
unset($price);   // break the link to the last element

print_r($prices);
```

> ⚠️ **Gotcha:** skip that `unset()` and `$price` still points at the last element. A later `foreach ($prices as $price)` then overwrites it on every pass, and your array ends up with a duplicated value.

## Challenge

> 🎯 **Challenge:** Write `totalValue(array $cart)` where `$cart` maps item names to `[price, quantity]` pairs, e.g. `["pen" => [1.5, 4]]`. Return the total price × quantity across all items.

```php starter
<?php

function totalValue(array $cart): float
{
    $total = 0;
    return $total;
}

echo totalValue(["pen" => [1.5, 4], "book" => [12, 1]]), "\n";
```

```php solution
<?php

function totalValue(array $cart): float
{
    $total = 0;
    foreach ($cart as $item => [$price, $qty]) {
        $total += $price * $qty;
    }
    return $total;
}

echo totalValue(["pen" => [1.5, 4], "book" => [12, 1]]), "\n";
```

```php check
expect(totalValue(["pen" => [1.5, 4], "book" => [12, 1]]) == 18, "pen 1.5×4 + book 12×1 should be 18");
expect(totalValue([]) == 0, "An empty cart is worth 0.");
expect(totalValue(["x" => [2, 3]]) == 6, "2×3 should be 6");
```

**Reference:** [foreach](https://www.php.net/manual/en/control-structures.foreach.php) in the PHP Manual.

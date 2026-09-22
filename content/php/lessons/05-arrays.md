---
title: Arrays
section: 2 · Types
---

A PHP array is an **ordered map**: every value sits under a key, and the order you add things is kept. The same type works as a list, a dictionary, a stack or a queue.

```php
<?php

$langs = ["PHP", "Go", "Rust"];          // keys 0, 1, 2
$ages = ["Ada" => 36, "Linus" => 54];    // string keys

echo $langs[0], "\n";
echo $ages["Ada"], "\n";
echo count($langs), "\n";

$langs[] = "Zig";           // append with the next integer key
$ages["Grace"] = 85;        // add or overwrite a key
print_r($langs);
print_r($ages);
```

`print_r()` is handy for looking at arrays. `var_dump()` also shows every type.

## Keys get converted

Keys can only be `int` or `string`, and PHP converts other values: `"8"` becomes `8`, `true` becomes `1`, `1.5` becomes `1`, and `null` becomes `""`. If two keys end up the same, the later value wins.

```php
<?php

$a = [1 => "a", "1" => "b", true => "c"];
var_dump($a);   // a single element: [1 => "c"]
```

## Removing doesn't renumber

`unset()` removes an element but leaves the other keys alone. `array_values()` renumbers from 0.

```php
<?php

$queue = ["a", "b", "c"];
unset($queue[1]);
print_r($queue);                 // keys 0 and 2
print_r(array_values($queue));   // keys 0 and 1
```

## Destructuring and spread

`[$a, $b] = $array` unpacks an array into variables, and `...` spreads one array into another.

```php
<?php

[$first, $second] = ["gold", "silver", "bronze"];
["name" => $name] = ["name" => "Ada", "age" => 36];
echo "$first $second $name\n";

$more = [0, ...[1, 2, 3], 4];
echo implode(", ", $more), "\n";
```

> 💡 **Tip:** arrays are copied when you assign them: `$b = $a` gives `$b` its own array, and changing `$b` leaves `$a` alone.

## Challenge

> 🎯 **Challenge:** Write `addScore(array $scores, string $name, int $points)` that returns the array with `$points` added to `$name`'s score. A name that isn't there yet starts at 0. (Hint: `$scores[$name] ?? 0` gives `0` when the key is missing.)

```php starter
<?php

function addScore(array $scores, string $name, int $points)
{
    $scores[$name] = $points;
    return $scores;
}

print_r(addScore(["Ada" => 10], "Ada", 5));
```

```php solution
<?php

function addScore(array $scores, string $name, int $points)
{
    $scores[$name] = ($scores[$name] ?? 0) + $points;
    return $scores;
}

print_r(addScore(["Ada" => 10], "Ada", 5));
```

```php check
expect(addScore(["Ada" => 10], "Ada", 5) === ["Ada" => 15], "Adding 5 to Ada's 10 should give 15.");
expect(addScore([], "Linus", 3) === ["Linus" => 3], "A new name should start at 0.");
$orig = ["Ada" => 1];
addScore($orig, "Ada", 1);
expect($orig === ["Ada" => 1], "The original array should not change.");
```

**Reference:** [Arrays](https://www.php.net/manual/en/language.types.array.php) in the PHP Manual.

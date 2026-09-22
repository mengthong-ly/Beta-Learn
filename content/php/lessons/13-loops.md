---
title: while, do-while & for
section: 6 · Control Structures
---

`while` repeats a block **as long as** its condition is true. The condition is checked before each pass, so if it starts out false the body never runs.

```php
<?php

$countdown = 3;

while ($countdown > 0) {
    echo "$countdown...\n";
    $countdown--;
}
echo "Liftoff!\n";
```

`do { } while (...)` checks the condition **after** each pass, so the body always runs at least once.

```php
<?php

$n = 10;

do {
    echo "ran once with n = $n\n";
} while ($n < 5);
```

## for

`for (init; condition; step)` packs the three parts of a counting loop into one line. `init` runs once, `condition` is checked before each pass, and `step` runs after each pass.

```php
<?php

for ($i = 1; $i <= 5; $i++) {
    echo $i * $i, " ";
}
echo "\n";

$people = ["Ada", "Linus", "Grace"];
for ($i = 0, $n = count($people); $i < $n; $i++) {
    echo "$i: {$people[$i]}\n";
}
```

Storing `count($people)` in `$n` once is a habit the manual recommends: the condition is re-evaluated on **every** pass.

## break and continue

`break` leaves the loop immediately; `continue` skips to the next pass. Both take an optional number for nested loops: `break 2` leaves two levels at once.

```php
<?php

for ($i = 1; $i <= 10; $i++) {
    if ($i % 2 === 0) {
        continue;       // skip even numbers
    }
    if ($i > 7) {
        break;          // stop completely
    }
    echo $i, " ";
}
echo "\n";

foreach ([1, 2, 3] as $row) {
    foreach ([1, 2, 3] as $col) {
        if ($row * $col === 4) {
            echo "found 4 at $row×$col\n";
            break 2;    // leave both loops
        }
    }
}
```

## Challenge

> 🎯 **Challenge:** Write `collatzSteps(int $n)` that counts how many steps it takes to reach 1, where each step turns an even `$n` into `$n / 2` and an odd `$n` into `3 * $n + 1`. `collatzSteps(6)` is `8` (6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1).

```php starter
<?php

function collatzSteps(int $n): int
{
    $steps = 0;
    // loop until $n is 1
    return $steps;
}

echo collatzSteps(6), "\n";
```

```php solution
<?php

function collatzSteps(int $n): int
{
    $steps = 0;
    while ($n !== 1) {
        $n = $n % 2 === 0 ? intdiv($n, 2) : 3 * $n + 1;
        $steps++;
    }
    return $steps;
}

echo collatzSteps(6), "\n";
```

```php check
expect(collatzSteps(6) === 8, "collatzSteps(6) should be 8");
expect(collatzSteps(1) === 0, "collatzSteps(1) should be 0");
expect(collatzSteps(27) === 111, "collatzSteps(27) should be 111");
```

**Reference:** [while](https://www.php.net/manual/en/control-structures.while.php) · [do-while](https://www.php.net/manual/en/control-structures.do.while.php) · [for](https://www.php.net/manual/en/control-structures.for.php) · [break](https://www.php.net/manual/en/control-structures.break.php) in the PHP Manual.

---
title: Control flow
section: Guide Book
summary: if/else, the three loops, foreach's copy semantics, break and continue with levels, and why `match` beats `switch`.
---
## Branching

```php
<?php

$score = 72;

if ($score >= 90) {
    echo "A\n";
} elseif ($score >= 70) {
    echo "B\n";
} else {
    echo "C\n";
}

echo $score >= 70 ? "pass\n" : "fail\n";
```

`elseif` and `else if` are the same thing in brace syntax. In the alternative (template) syntax only `elseif` is allowed — `else if` is a parse error there.

```php
<?php

$user = ['admin' => true];
?>
<?php if ($user['admin']): ?>
Welcome, admin.
<?php elseif (isset($user['name'])): ?>
Welcome back.
<?php else: ?>
Please sign in.
<?php endif; ?>
```

## `while` and `do…while`

```php
<?php

$n = 3;
while ($n > 0) {
    echo $n--, ' ';
}
echo "\n";

$tries = 0;
do {
    $tries++;             // the body always runs at least once
} while ($tries < 3);
echo "$tries tries\n";
```

## `for`

All three clauses are optional, and each may hold several comma-separated expressions.

```php
<?php

for ($i = 0; $i < 5; $i++) {
    echo $i;
}
echo "\n";

for ($lo = 0, $hi = 5; $lo < $hi; $lo++, $hi--) {
    echo "$lo-$hi ";
}
echo "\n";

$i = 0;
for (;;) {                 // an infinite loop; break gets you out
    if (++$i > 3) break;
    echo $i;
}
echo "\n";
```

> ⚠️ The condition is re-evaluated every iteration. `for ($i = 0; $i < count($big); $i++)` calls `count()` on every pass. Hoist it: `for ($i = 0, $n = count($big); $i < $n; $i++)`.

## `foreach`

The loop for arrays and objects, and the one you will use most.

```php
<?php

$ages = ['Ada' => 36, 'Grace' => 85];

foreach ($ages as $age) {
    echo $age, ' ';
}
echo "\n";

foreach ($ages as $name => $age) {
    echo "$name is $age\n";
}

foreach ([[1, 'one'], [2, 'two']] as [$n, $word]) {
    echo "$n=$word ";
}
echo "\n";
```

> 🔍 **Behind the scenes: `foreach` iterates a snapshot**
>
> `foreach ($a as $v)` works on the array *as it was when the loop started*. Adding to `$a` inside the loop does not extend the iteration, and removing from it does not cut it short — because the loop holds its own reference and copy-on-write splits the two the moment you write. Iterate **by reference** (`as &$v`) and that protection is gone: you are now walking the live array, and modifying it mid-loop is genuinely undefined. Build a new array instead.

```php
<?php

$a = [1, 2, 3];
foreach ($a as $v) {
    $a[] = $v * 10;     // does not extend the loop
    if (count($a) > 20) break;
}
echo count($a), " elements, loop ran 3 times\n";
```

## `break` and `continue` take a level

A plain `break` leaves the innermost loop. `break 2` leaves two levels — which saves the flag variable that nested loops otherwise need.

```php
<?php

$grid = [[1, 2], [3, 4], [5, 6]];

foreach ($grid as $row) {
    foreach ($row as $cell) {
        if ($cell === 4) {
            echo "found 4, leaving both loops\n";
            break 2;
        }
        echo $cell, ' ';
    }
}
echo "\n";

for ($i = 1; $i <= 6; $i++) {
    if ($i % 2 === 0) continue;
    echo $i, ' ';
}
echo "\n";
```

> ⚠️ `continue` inside a `switch` behaves like `break` — the switch counts as a loop level. If you mean "next iteration of the loop around this switch", write `continue 2`. PHP 7.3+ warns about the ambiguous case.

## `switch`

`switch` compares with **loose** `==`, and cases fall through unless you `break`.

```php
<?php

$code = '2';          // a STRING

switch ($code) {
    case 1:
        echo "one\n";
        break;
    case 2:               // matches: '2' == 2 is true
    case 3:
        echo "two or three\n";       // deliberate fall-through
        break;
    default:
        echo "something else\n";
}
```

## `match` — what `switch` should have been

`match` is an **expression**, compares with `===`, does not fall through, and throws if nothing matches.

```php
<?php

$code = 2;

$label = match ($code) {
    1       => 'one',
    2, 3    => 'two or three',
    default => 'other',
};
echo $label, "\n";

$n = 73;
echo match (true) {
    $n >= 90 => "A\n",
    $n >= 70 => "B\n",
    default  => "C\n",
};

try {
    echo match ('2') { 1 => 'int one', 2 => 'int two' };
} catch (\UnhandledMatchError $e) {
    echo 'UnhandledMatchError: ', $e->getMessage(), "\n";
}
```

| | `switch` | `match` |
| --- | --- | --- |
| Compares with | `==` | `===` |
| Is an | statement | expression |
| Falls through | yes, without `break` | never |
| No match | silently does nothing | throws `UnhandledMatchError` |
| Body | statements | a single expression |

> 💡 **Tip:** `match (true)` with boolean arms replaces a chain of `if`/`elseif` when every branch produces a value. It reads as a table, and the compiler guarantees exactly one arm is taken.

## `goto`

PHP has it. It can only jump forward, and only within the same file and function — never into a loop.

```php
<?php

for ($i = 0; $i < 10; $i++) {
    if ($i === 3) goto done;
}
done:
echo "jumped out at $i\n";
```

In practice `break 2` covers everything `goto` is good for. Mention it so you recognise it; do not reach for it.

**Reference:** [Control Structures](https://www.php.net/manual/en/language.control-structures.php) in the PHP Manual.

---
title: if, elseif & else
section: 6 · Control Structures
---

`if` runs a block only when its condition is truthy. `elseif` adds more conditions, checked in order, and `else` catches everything left over. Only the **first** matching branch runs.

```php
<?php

$temp = 23;

if ($temp > 30) {
    echo "Hot\n";
} elseif ($temp > 15) {
    echo "Pleasant\n";
} else {
    echo "Cold\n";
}
```

The condition goes through the same boolean conversion you saw earlier, so `if ($items)` means "if the array isn't empty".

```php
<?php

$cart = [];

if ($cart) {
    echo count($cart), " items\n";
} else {
    echo "Your cart is empty\n";
}
```

## The alternative syntax

When PHP is mixed with HTML, braces get hard to match up. PHP lets you replace `{` with `:` and the closing `}` with `endif;`. `while`, `for`, `foreach` and `switch` have the same form, ending in `endwhile;`, `endfor;`, `endforeach;` and `endswitch;`.

```php
<?php $loggedIn = true; ?>
<?php if ($loggedIn): ?>
<p>Welcome back!</p>
<?php else: ?>
<p>Please sign in.</p>
<?php endif; ?>
```

> ⚠️ **Gotcha:** with the colon syntax you must write `elseif` as one word. `else if` is fine with braces but a parse error after a colon.

## Challenge

> 🎯 **Challenge:** Write `grade(int $score)` that returns `"A"` for 90 and above, `"B"` for 80–89, `"C"` for 70–79 and `"F"` below 70.

```php starter
<?php

function grade(int $score): string
{
    if ($score >= 90) {
        return "A";
    }
    return "F";
}

echo grade(85), "\n";
```

```php solution
<?php

function grade(int $score): string
{
    if ($score >= 90) {
        return "A";
    } elseif ($score >= 80) {
        return "B";
    } elseif ($score >= 70) {
        return "C";
    } else {
        return "F";
    }
}

echo grade(85), "\n";
```

```php check
$cases = [95 => "A", 90 => "A", 89 => "B", 80 => "B", 75 => "C", 70 => "C", 69 => "F", 0 => "F"];
foreach ($cases as $score => $want) {
    expect(grade($score) === $want, "grade($score) should be '$want', got '" . grade($score) . "'");
}
```

**Reference:** [elseif/else if](https://www.php.net/manual/en/control-structures.elseif.php) · [Alternative syntax for control structures](https://www.php.net/manual/en/control-structures.alternative-syntax.php) in the PHP Manual.

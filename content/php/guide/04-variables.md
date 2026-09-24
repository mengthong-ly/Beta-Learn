---
title: Variables, scope & references
section: Guide Book
summary: Assignment copies, objects are handles, `&` makes an alias — and why PHP has no block scope but does have `static`.
---
A PHP variable is a name bound to a value. `$` starts the name; the rest is a letter or `_` followed by letters, digits or `_`.

```php
<?php

$name = 'Ada';
$_private = 1;
$year2026 = 2026;

echo "$name $_private $year2026\n";
echo isset($undefined) ? 'set' : 'not set', "\n";
```

## Assignment copies — lazily

`$b = $a` gives `$b` its own copy. Changing one never changes the other.

```php
<?php

$a = [1, 2, 3];
$b = $a;
$b[] = 4;

echo count($a), ' vs ', count($b), "\n";   // 3 vs 4
```

> 🔍 **Behind the scenes: copy-on-write**
>
> Copying a 10,000-element array on every assignment would be ruinous, so PHP does not. `$b = $a` makes both names point at the *same* array and bumps a reference count. Only when one of them is **written to** does the engine split them — copy-on-write. This is why passing big arrays around is cheap as long as nobody modifies them, and why a single innocent `$copy[] = $x` inside a loop can suddenly cost real memory.

## Objects are the exception

An object variable holds a **handle**, not the object. Copying the variable copies the handle; both names still reach the same object.

```php
<?php

class Counter {
    public int $n = 0;
}

$a = new Counter();
$b = $a;          // copies the handle
$b->n = 5;

echo $a->n, "\n";   // 5 — same object

$c = clone $a;    // a real copy
$c->n = 99;
echo $a->n, ' ', $c->n, "\n";   // 5 99
```

> ⚠️ `clone` is **shallow**: properties holding objects are still shared with the original. Define `__clone()` to deep-copy the ones that matter.

## References: a second name for the same slot

`&` makes two names refer to one value. Unlike an object handle, this works for *any* type, and unsetting one name leaves the other alone.

```php
<?php

$a = 1;
$b = &$a;      // $b is another name for $a
$b = 42;

echo $a, "\n";     // 42

unset($b);         // breaks the link, not the value
echo $a, "\n";     // 42
```

References appear in three more places: `foreach` by reference, reference parameters, and reference returns.

```php
<?php

$prices = [10, 20, 30];

foreach ($prices as &$p) {
    $p *= 2;
}
unset($p);            // always unset after a by-reference foreach

print_r($prices);

function addTax(array &$cart): void {
    $cart['tax'] = 5;
}

$cart = ['items' => 2];
addTax($cart);
print_r($cart);
```

> 🔍 **Behind the scenes: the `foreach` reference trap**
>
> After `foreach ($a as &$v)`, `$v` is still a reference to the **last** element. A second `foreach ($a as $v)` then writes each value into that last slot, and the array quietly ends with its second-to-last value duplicated. It is one of the most-reported "PHP is weird" bugs, and the fix is one line: `unset($v);` immediately after the loop.

```php
<?php

$a = [1, 2, 3];
foreach ($a as &$v) {}
foreach ($a as $v) {}
print_r($a);          // [1, 2, 2] — not [1, 2, 3]
```

## Scope: functions, and nothing else

PHP has **function scope**. A function cannot see the variables around it, and — unlike C, Java or JavaScript's `let` — an `if` or `for` block creates no scope of its own.

```php
<?php

$outer = 'global';

function show(): void {
    echo isset($outer) ? 'visible' : "not visible inside a function\n";
}
show();

for ($i = 0; $i < 3; $i++) {
    $insideLoop = $i;
}
echo "after the loop: \$i is $i, \$insideLoop is $insideLoop\n";
```

To reach a global from inside a function, say so — with `global` or `$GLOBALS`.

```php
<?php

$config = ['debug' => true];

function readConfig(): void {
    global $config;
    echo 'debug: ', var_export($config['debug'], true), "\n";
}
readConfig();
```

> 💡 **Tip:** Almost every use of `global` is better as a parameter. It makes the dependency visible, testable and safe to call twice.

## `static`: a variable that outlives the call

A `static` local is initialised once and keeps its value between calls to that function — but only within a single run of the script.

```php
<?php

function nextId(): int {
    static $id = 0;
    return ++$id;
}

echo nextId(), nextId(), nextId(), "\n";   // 123
```

## Variable variables

`$$name` uses the *value* of `$name` as a variable name. It exists, it is occasionally useful in templating, and it makes code impossible to grep.

```php
<?php

$field = 'email';
$$field = 'ada@example.com';

echo $email, "\n";
echo ${'fi' . 'eld'}, "\n";
```

> ⚠️ Reach for an array before reaching for a variable variable. `$data['email']` does the same job and can be searched, typed and iterated.

**Reference:** [Variables](https://www.php.net/manual/en/language.variables.php) and [References Explained](https://www.php.net/manual/en/language.references.php) in the PHP Manual.

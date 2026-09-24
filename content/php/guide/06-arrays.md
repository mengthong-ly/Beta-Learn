---
title: Arrays
section: Guide Book
summary: One type doing the work of list, dictionary, stack and queue — how it is stored, how keys are coerced, and the function set worth memorising.
---
PHP has one collection type. An **array** is an ordered map from keys to values: insertion order is preserved, keys may be `int` or `string`, and the same structure serves as list, dictionary, stack, queue and record.

```php
<?php

$list = ['PHP', 'Go', 'Rust'];             // keys 0, 1, 2
$map  = ['Ada' => 36, 'Linus' => 54];      // string keys
$mix  = [10 => 'ten', 'name' => 'Ada'];    // both at once

print_r($list);
print_r($map);
print_r($mix);
```

## Keys are coerced

Only `int` and `string` may be keys. Everything else is converted, and two values that convert to the same key collide — last one wins.

| You write | Key becomes |
| --- | --- |
| `"8"` | `8` (an integer-like string becomes an int) |
| `"08"` | `"08"` (leading zero — stays a string) |
| `true` / `false` | `1` / `0` |
| `1.9` | `1` (truncated, not rounded) — **deprecated in PHP 8.5**, because it loses precision silently |
| `null` | `""` |

```php
<?php

$a = [1 => 'a', '1' => 'b', true => 'c', 1.9 => 'd'];
var_dump($a);      // one element: [1 => "d"]
                   // (PHP 8.5 also warns about the 1.9 → 1 conversion)

$b = ['8' => 'int key', '08' => 'string key'];
var_dump(array_keys($b));
```

> 🔍 **Behind the scenes: an array is a hash table with a twist**
>
> Internally an array is a hash table *plus* an insertion-ordered bucket list. Lookup by key is O(1) through the hash; iteration walks the buckets in insertion order, which is why `foreach` is reliably ordered where a hash map in most languages is not. Packed integer-keyed arrays starting at 0 skip the hash entirely and are stored as a plain C vector — so `[0,1,2,…]` really is as cheap as a real list.

## Appending and the next key

`$a[] = $v` appends under "the next integer key" — one more than the **highest integer key ever used**, not the current count.

```php
<?php

$a = [];
$a[] = 'first';       // key 0
$a[10] = 'tenth';
$a[] = 'next';        // key 11, not 2

print_r($a);

unset($a[11]);
$a[] = 'after unset'; // key 12 — the counter does not go back
print_r($a);
```

## Removing does not renumber

```php
<?php

$q = ['a', 'b', 'c'];
unset($q[1]);
print_r($q);                    // keys 0 and 2

print_r(array_values($q));      // renumbered 0, 1
var_dump(array_is_list($q));    // false
var_dump(array_is_list(array_values($q)));
```

> 💡 **Tip:** `array_is_list()` answers "is this a real list?" — keys `0…n-1` in order. It is the check to use before handing an array to `json_encode()`, which turns a list into `[…]` and anything else into `{…}`.

## Destructuring and spread

```php
<?php

[$gold, $silver] = ['first', 'second', 'third'];
['name' => $name, 'age' => $age] = ['age' => 36, 'name' => 'Ada'];
echo "$gold $silver $name $age\n";

foreach ([[1, 'one'], [2, 'two']] as [$n, $word]) {
    echo "$n=$word ";
}
echo "\n";

$base  = ['a', 'b'];
$more  = [...$base, 'c'];
$merge = [...['x' => 1], ...['y' => 2]];    // string keys spread too (PHP 8.1+)
print_r($more);
print_r($merge);
```

## The function set

PHP's array functions are famously inconsistent in argument order. These are the ones worth knowing by heart.

```php
<?php

$n = [5, 3, 9, 1];

print_r(array_map(fn($x) => $x * 2, $n));
print_r(array_filter($n, fn($x) => $x > 3));
echo array_reduce($n, fn($carry, $x) => $carry + $x, 0), "\n";
echo array_sum($n), ' ', max($n), ' ', min($n), "\n";
var_dump(in_array(9, $n, true));
var_dump(array_search(9, $n, true));
```

> ⚠️ `array_filter()` **keeps the original keys**. Filtering `[5,3,9,1]` down to `[9]` gives you `[2 => 9]`, not `[0 => 9]`. Wrap it in `array_values()` when the result must stay a list.

```php
<?php

$people = [
    ['name' => 'Ada',   'age' => 36],
    ['name' => 'Grace', 'age' => 85],
];

print_r(array_column($people, 'age', 'name'));
print_r(array_combine(['a', 'b'], [1, 2]));
print_r(array_flip(['a' => 1, 'b' => 2]));
print_r(array_unique([1, 1, 2, 2, 3]));
print_r(array_slice([1, 2, 3, 4, 5], 1, 3));
print_r(array_chunk([1, 2, 3, 4, 5], 2));
```

## Sorting

Sorts modify the array **in place** and return `bool`, which is why `$sorted = sort($a)` is always a bug.

| Function | Sorts by | Keeps keys |
| --- | --- | --- |
| `sort` / `rsort` | value | no |
| `asort` / `arsort` | value | yes |
| `ksort` / `krsort` | key | yes |
| `usort` | your callback, by value | no |
| `uasort` / `uksort` | your callback | yes |

```php
<?php

$n = [5, 3, 9, 1];
sort($n);
print_r($n);

$ages = ['Grace' => 85, 'Ada' => 36];
asort($ages);
print_r($ages);

$people = [['n' => 'Ada', 'a' => 36], ['n' => 'Grace', 'a' => 85]];
usort($people, fn($x, $y) => $y['a'] <=> $x['a']);
echo $people[0]['n'], " is oldest\n";
```

> 🔍 **Behind the scenes: `<=>` exists for exactly this**
>
> A comparator must return a negative number, zero or a positive number. Writing that with `if`s is three lines and easy to get backwards; `$a <=> $b` is the whole thing. Reverse the operands to reverse the order. Since PHP 8.0 the sorts are also **stable**: equal elements keep their original relative order, so sorting by name then by age gives a predictable result.

## Merging: `+` is not `array_merge()`

```php
<?php

$a = ['x' => 1, 'y' => 2];
$b = ['y' => 99, 'z' => 3];

print_r(array_merge($a, $b));   // later wins:  y => 99
print_r($a + $b);               // FIRST wins:  y => 2

print_r(array_merge([1, 2], [3]));   // list keys renumbered
print_r([1, 2] + [3, 4, 5]);         // keys kept: [1, 2, 5]
```

**Reference:** [Arrays](https://www.php.net/manual/en/language.types.array.php) and [Array functions](https://www.php.net/manual/en/ref.array.php) in the PHP Manual.

---
title: All the operators
section: Guide Book
summary: Arithmetic, comparison, logical, string, bitwise, null-safe, spaceship and pipe — what each one really does, and the precedence that decides who wins.
---
## Arithmetic

```php
<?php

echo 7 + 2, ' ', 7 - 2, ' ', 7 * 2, "\n";
echo 7 / 2, "\n";          // 3.5  — always a float unless it divides exactly
echo intdiv(7, 2), "\n";   // 3    — integer division
echo 7 % 2, "\n";          // 1    — int modulo, sign follows the LEFT operand
echo -7 % 2, "\n";         // -1
echo fmod(7.5, 2), "\n";   // 1.5  — float modulo
echo 2 ** 10, "\n";        // 1024 — right-associative
```

> 🔍 **Behind the scenes: `/` never truncates**
>
> In C, Java and Go, `7 / 2` on two integers is `3`. In PHP it is `3.5`. PHP's `/` produces an int only when the division is exact; otherwise it promotes to float. `intdiv()` is the explicit "I want truncation" operator, and it throws on division by zero rather than returning a surprising value.

## Assignment

```php
<?php

$a = 10;
$a += 5;  $a -= 3;  $a *= 2;  $a /= 4;  $a **= 2;
echo $a, "\n";

$s = 'Hello';
$s .= ', world';
echo $s, "\n";

$x = null;
$x ??= 'default';     // assign only if null or unset
$x ??= 'ignored';
echo $x, "\n";
```

## Comparison

| Operator | True when |
| --- | --- |
| `==` | equal after type juggling |
| `===` | equal **and** same type |
| `!=`, `<>` | not equal after juggling |
| `!==` | not identical |
| `<`, `>`, `<=`, `>=` | ordering |
| `<=>` | `-1`, `0` or `1` — the spaceship |

```php
<?php

var_dump(1 == '1', 1 === '1');
var_dump(0 == 'abc');           // false since PHP 8
var_dump('abc' <=> 'abd');      // -1
var_dump([1, 2] == [1, 2]);     // true — same pairs
var_dump([1, 2] === [2 => 1]);  // false — order and keys must match
```

> ⚠️ `==` on arrays compares key/value pairs in any order; `===` also requires the same order *and* the same key types. Two arrays that print identically can still be `!==`.

## Logical

`&&`/`||` and `and`/`or` do the same thing at very different precedence — low enough that `and` binds *looser than assignment*.

```php
<?php

$a = true && false;
$b = true and false;    // parses as ($b = true) and false

var_dump($a, $b);       // false, TRUE — the classic trap
```

Both forms **short-circuit**: the right side is not evaluated if the left already decides the answer.

```php
<?php

function loud(bool $v): bool {
    echo "  evaluated\n";
    return $v;
}

echo "false && …\n";
var_dump(false && loud(true));   // right side never runs

echo "true || …\n";
var_dump(true || loud(true));
```

> 💡 **Tip:** Use `&&` and `||`. The only common use for `or` is the idiom `$fh = fopen(…) or die(…)`, where the loose precedence is the point — and exceptions are a better answer than `die()`.

## Null handling

```php
<?php

$config = ['name' => 'Ada'];

echo $config['name'] ?? 'anonymous', "\n";     // 'Ada'
echo $config['email'] ?? 'none', "\n";         // 'none' — no warning
echo $config['a']['b']['c'] ?? 'deep', "\n";   // safe all the way down

class User {
    public function __construct(public ?User $manager = null) {}
    public function name(): string { return 'Ada'; }
}

$u = new User();
echo $u->manager?->name() ?? 'no manager', "\n";   // ?-> stops at null
```

> 🔍 **Behind the scenes: `??` is not the same as `?:`**
>
> `?:` (the "Elvis" operator) falls back when the left side is **falsy** — so `0`, `''` and `'0'` all trigger the fallback. `??` falls back only when the left side is **null or undefined**, and it suppresses the undefined-index warning. For a quantity or a user-supplied string, `??` is almost always the one you meant: `$qty = $_GET['qty'] ?: 1` silently turns a legitimate `0` into `1`.

```php
<?php

$qty = '0';
echo 'with ?: ', $qty ?: 1, "\n";    // 1  — probably wrong
echo 'with ??: ', $qty ?? 1, "\n";   // 0  — probably right
```

## Bitwise

```php
<?php

$a = 0b1100;   // 12
$b = 0b1010;   // 10

printf("AND %04b\n", $a & $b);
printf("OR  %04b\n", $a | $b);
printf("XOR %04b\n", $a ^ $b);
printf("<<1 %05b\n", $a << 1);
printf(">>1 %04b\n", $a >> 1);

const READ = 1, WRITE = 2, EXEC = 4;
$perm = READ | WRITE;
var_dump(($perm & WRITE) !== 0, ($perm & EXEC) !== 0);
```

## Type and existence

```php
<?php

$obj = new stdClass();
$arr = [1, 2];

var_dump($obj instanceof stdClass);
var_dump(isset($arr[0]), isset($arr[9]));
var_dump(empty($arr), empty([]));
var_dump(array_key_exists(0, $arr));

$maybeNull = ['k' => null];
var_dump(isset($maybeNull['k']));               // false — isset means "set AND not null"
var_dump(array_key_exists('k', $maybeNull));    // true
```

## The pipe operator

PHP 8.5 adds `|>`, which feeds the left value into the callable on the right. It turns inside-out nesting into left-to-right reading.

```php
<?php

$result = '  Hello World  '
    |> trim(...)
    |> strtolower(...)
    |> str_split(...)
    |> array_unique(...)
    |> count(...);

echo $result, "\n";

echo strlen(strtoupper(trim('  abc  '))), "\n";       // nested
echo '  abc  ' |> trim(...) |> strtoupper(...) |> strlen(...), "\n";   // piped
```

## Precedence, shortened

Highest to lowest. When in doubt, parenthesise — the reader should not have to consult this table.

```text
**                        (right)
! ++ -- (casts) @
instanceof
* / %
+ -
<< >>
. (concatenation)
< <= > >=
== != === !== <=>
&  ^  |
&&
||
??
?: ?->
|>
= += -= …            (right)
and
xor
or
```

```php
<?php

echo 2 + 3 * 4, "\n";              // 14 — * binds tighter
echo (2 + 3) * 4, "\n";            // 20
echo 2 ** 3 ** 2, "\n";            // 512 — right-associative: 2 ** 9
echo 'sum: ' . 1 + 2, "\n";        // since PHP 8: '.' binds LOOSER than '+' → "sum: 3"
var_dump(true ? 'a' : (false ? 'b' : 'c'));
```

> ⚠️ Before PHP 8, `'sum: ' . 1 + 2` parsed as `('sum: ' . 1) + 2` and produced `2` with a warning. PHP 8 lowered `.` below `+`/`-` so it now means `'sum: ' . (1 + 2)`. Old code that relied on the old grouping changes behaviour silently.

**Reference:** [Operators](https://www.php.net/manual/en/language.operators.php) in the PHP Manual.

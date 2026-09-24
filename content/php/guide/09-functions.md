---
title: Functions, closures & callables
section: Guide Book
summary: Every kind of parameter, what a closure captures, the four ways to name a callable, and first-class callable syntax.
---
## Declaring

```php
<?php

function add(int $a, int $b): int {
    return $a + $b;
}

echo add(2, 3), "\n";

function shout(string $s): string {
    return strtoupper($s) . '!';
}

echo shout('hello'), "\n";
```

A function with no `return` returns `null`. Declaring `: void` says so and makes `return $x;` a compile error.

## Parameters

### Defaults

Defaults must be constant expressions, and any parameter with a default should come last.

```php
<?php

function greet(string $name, string $greeting = 'Hello', string $punct = '!'): string {
    return "$greeting, $name$punct";
}

echo greet('Ada'), "\n";
echo greet('Ada', 'Hi'), "\n";
```

### Named arguments

Pass by parameter name and skip the ones you do not care about. The name is part of your public API — renaming a parameter is a breaking change.

```php
<?php

function greet(string $name, string $greeting = 'Hello', string $punct = '!'): string {
    return "$greeting, $name$punct";
}

echo greet('Ada', punct: '?'), "\n";
echo greet(greeting: 'Yo', name: 'Grace'), "\n";
echo str_pad('7', length: 4, pad_string: '0', pad_type: STR_PAD_LEFT), "\n";
```

### Variadics and spread

```php
<?php

function total(int ...$nums): int {
    return array_sum($nums);
}

echo total(1, 2, 3), "\n";
echo total(...[4, 5, 6]), "\n";          // spread an array in

function tag(string $name, string ...$classes): string {
    return $name . ($classes ? ' .' . implode(' .', $classes) : '');
}
echo tag('div', 'card', 'wide'), "\n";
```

### By reference

```php
<?php

function push(array &$stack, mixed $v): void {
    $stack[] = $v;
}

$s = [];
push($s, 'a');
push($s, 'b');
print_r($s);
```

> 💡 **Tip:** Returning a new value beats mutating a parameter. `$s = push($s, 'a')` is obvious at the call site; `push($s, 'a')` hides that `$s` changed. Reserve `&` for cases where copying would genuinely hurt.

## Closures

An anonymous function is an object of class `Closure`. It does **not** see the surrounding scope unless you say so with `use`.

```php
<?php

$factor = 3;

$times = function (int $n) use ($factor): int {
    return $n * $factor;
};

echo $times(5), "\n";

$factor = 100;
echo $times(5), "\n";     // still 15 — $factor was captured BY VALUE at creation
```

Capture by reference with `use (&$x)` when you want the live variable.

```php
<?php

$count = 0;

$tick = function () use (&$count): void {
    $count++;
};

$tick(); $tick(); $tick();
echo $count, "\n";      // 3
```

> 🔍 **Behind the scenes: `use` is a copy, made when the closure is created**
>
> The values are bound at the moment the `function` expression is evaluated, not when the closure is called. That is why building closures in a loop with `use ($i)` gives each one its own `$i` — the behaviour people expect — while `use (&$i)` gives all of them the *same* `$i`, which after the loop holds the final value. Arrow functions capture by value, always, and cannot opt out.

## Arrow functions

`fn()` captures the enclosing scope automatically, by value, and its body is a single expression.

```php
<?php

$factor = 3;
$times = fn(int $n): int => $n * $factor;   // no `use` needed

echo $times(5), "\n";

$people = [['n' => 'Ada', 'a' => 36], ['n' => 'Grace', 'a' => 85]];
print_r(array_map(fn($p) => $p['n'], $people));
print_r(array_filter($people, fn($p) => $p['a'] > 50));
```

## Callables

Four things count as callable, and every one works with `array_map`, `usort` and friends.

```php
<?php

class Math {
    public static function double(int $n): int { return $n * 2; }
    public function triple(int $n): int { return $n * 3; }
}

$nums = [1, 2, 3];

print_r(array_map('strval', $nums));                    // function name as a string
print_r(array_map(fn($n) => $n + 1, $nums));            // a closure
print_r(array_map([Math::class, 'double'], $nums));     // [class, static method]
print_r(array_map([new Math(), 'triple'], $nums));      // [object, method]
```

## First-class callable syntax

`strlen(...)` — with a literal `...` — makes a `Closure` out of any callable. It is checked at compile time, works with private methods in scope, and survives renaming better than a string.

```php
<?php

$len = strlen(...);
echo $len('hello'), "\n";

class Math {
    public static function double(int $n): int { return $n * 2; }
    public function triple(int $n): int { return $n * 3; }
}

$double = Math::double(...);
$triple = (new Math())->triple(...);

print_r(array_map($double, [1, 2, 3]));
echo $triple(5), "\n";
```

> 🧭 **Scenario:** A refactor renames `Math::double` to `Math::twice`. Every `'Math::double'` string callable keeps compiling and fails at run time, possibly in production. Every `Math::double(...)` fails immediately, at the call site, with the class name and line number.

## Recursion and static functions

```php
<?php

function factorial(int $n): int {
    return $n <= 1 ? 1 : $n * factorial($n - 1);
}

echo factorial(10), "\n";

$fib = function (int $n) use (&$fib): int {
    return $n < 2 ? $n : $fib($n - 1) + $fib($n - 2);
};
echo $fib(20), "\n";
```

> ⚠️ PHP has no tail-call optimisation and no configurable stack depth: deep recursion segfaults rather than raising an error. Anything that could recurse thousands of levels deep belongs in a loop with an explicit stack.

## Generators

A function containing `yield` returns a `Generator` — values are produced lazily, one at a time, and never all held in memory.

```php
<?php

function countTo(int $n): Generator {
    for ($i = 1; $i <= $n; $i++) {
        yield $i;
    }
}

foreach (countTo(5) as $v) {
    echo $v, ' ';
}
echo "\n";

function evens(): Generator {
    $n = 0;
    while (true) {          // infinite, but lazy
        yield $n += 2;
    }
}

foreach (evens() as $v) {
    if ($v > 10) break;
    echo $v, ' ';
}
echo "\n";
```

**Reference:** [Functions](https://www.php.net/manual/en/language.functions.php) in the PHP Manual.

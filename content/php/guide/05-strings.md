---
title: Strings & text
section: Guide Book
summary: Four ways to write a string, what interpolation really does, why a PHP string is bytes rather than characters, and the functions worth knowing.
---
A PHP string is a sequence of **bytes**. Not characters — bytes. That one fact explains most of what follows.

## Four kinds of literal

```php
<?php

$who = 'world';

echo 'single: no $who, no \n escapes', "\n";
echo "double: hello $who, and a real newline\n";

echo <<<TEXT
    heredoc: behaves like double quotes,
    interpolates $who, and the closing marker's
    indentation is stripped from every line.
    TEXT;

echo "\n";

echo <<<'TEXT'
    nowdoc: behaves like single quotes.
    $who stays literal.
    TEXT;

echo "\n";
```

> 🔍 **Behind the scenes: why single quotes are not "faster"**
>
> You will read that single quotes are quicker because PHP does not scan them for variables. That scan happens at **compile** time, not at run time: `"hello $who"` compiles to a concatenation of two known pieces, and with OPcache the compile happens once. Choose quotes for readability — single when the text has no variables and lots of `$`, double when it has variables — not for speed.

## Interpolation

Inside double quotes and heredocs, `$name` is replaced by its value. Simple array and property access works bare; anything more needs braces.

```php
<?php

$user = ['name' => 'Ada', 'langs' => ['PHP', 'Go']];
$n = 2;

echo "Name: $user[name]\n";            // bare key — no quotes inside!
echo "First: {$user['langs'][0]}\n";   // braces for anything nested
echo "Double: {$n}00\n";               // braces to end the name early
```

> ⚠️ `"$user['name']"` is a parse error, but `"$user[name]"` works. That is a genuine inconsistency in the syntax: unquoted keys are only legal inside a simple interpolation. Use `{$user['name']}` everywhere and you never have to remember which is which.

## Bytes, not characters

`strlen()` counts bytes. For anything that might not be ASCII, you want the `mb_` functions.

```php
<?php

$s = 'café';

echo 'strlen:     ', strlen($s), "\n";        // 5 — é is two bytes in UTF-8
echo 'mb_strlen:  ', mb_strlen($s), "\n";     // 4 characters
echo 'strtoupper: ', strtoupper($s), "\n";    // mangles the é
echo 'mb_strtoupper: ', mb_strtoupper($s), "\n";
echo 'substr:     ', substr($s, 0, 4), "\n";  // cuts é in half
echo 'mb_substr:  ', mb_substr($s, 0, 4), "\n";
```

> 🧭 **Scenario:** A form truncates names to 20 "characters" with `substr()`. A user called *José* near the limit gets a broken byte at the end, the database rejects the invalid UTF-8, and the bug only ever reproduces for non-English names. `mb_substr()` is the whole fix.

## Indexing

A string can be indexed like an array — by byte offset. Negative offsets count from the end.

```php
<?php

$s = 'PHP';

echo $s[0], $s[1], $s[2], "\n";
echo $s[-1], "\n";          // P

$s[0] = 'p';                // strings are mutable in place
echo $s, "\n";
```

## Concatenation and building

```php
<?php

$a = 'Hello';
$b = 'world';

echo $a . ', ' . $b . "!\n";

$out = '';
foreach (range(1, 5) as $i) {
    $out .= $i;
}
echo $out, "\n";

echo implode(', ', ['a', 'b', 'c']), "\n";
print_r(explode(',', 'a,b,c'));
```

> 💡 **Tip:** Building a long string with `.=` in a loop is fine in PHP — the engine grows the buffer in place. Collecting into an array and calling `implode()` once is still clearer when the pieces need a separator.

## Formatting

```php
<?php

printf("%s is %d years old\n", 'Ada', 36);
printf("%05.2f | %-8s| %'*10s\n", 3.14159, 'left', 'right');
printf("%b %o %x %X\n", 250, 250, 250, 250);

echo sprintf('%s', number_format(1234567.891, 2)), "\n";
echo str_pad('7', 3, '0', STR_PAD_LEFT), "\n";
```

## The functions you will actually use

```php
<?php

$s = '  The Quick Brown Fox  ';

echo '[', trim($s), "]\n";
echo strtolower(trim($s)), "\n";
echo ucwords('ada lovelace'), "\n";
echo str_replace('Quick', 'Slow', trim($s)), "\n";
echo strrev('stressed'), "\n";
echo str_repeat('-', 20), "\n";

var_dump(str_contains($s, 'Brown'));
var_dump(str_starts_with(trim($s), 'The'));
var_dump(str_ends_with(trim($s), 'Fox'));
echo strpos($s, 'Brown'), "\n";
```

> 🔍 **Behind the scenes: why `str_contains()` was such a relief**
>
> Before PHP 8 the idiom was `strpos($h, $n) !== false`. `strpos()` returns the *offset*, and an offset of `0` is a perfectly valid match — but `0` is also falsy. `if (strpos($h, $n))` therefore silently missed every match at the start of the string. `str_contains()`, `str_starts_with()` and `str_ends_with()` return real booleans and remove the whole class of bug.

## Comparing

```php
<?php

var_dump('a' === 'a');
var_dump(strcmp('apple', 'banana') < 0);       // ordering
var_dump(strcasecmp('PHP', 'php') === 0);      // case-insensitive
var_dump(hash_equals('secret', 'secret'));     // constant-time, for tokens
```

> ⚠️ Compare secrets — tokens, signatures, password hashes — with `hash_equals()`. `===` stops at the first differing byte, and the time it takes leaks how much of the guess was right.

**Reference:** [Strings](https://www.php.net/manual/en/language.types.string.php) in the PHP Manual.

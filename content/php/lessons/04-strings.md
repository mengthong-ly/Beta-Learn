---
title: Strings
section: 2 · Types
---

A string is a sequence of characters. PHP gives you four ways to write one, and the difference that matters is whether variables and escapes like `\n` get filled in.

```php
<?php

$lang = "PHP";

echo 'Single: $lang\n', "\n";   // taken literally
echo "Double: $lang\n";          // $lang and \n are interpreted
echo "Joined: " . $lang . "!\n"; // . joins strings
```

- **Single quotes** only understand `\'` and `\\`. Everything else, `$` and `\n` included, is literal.
- **Double quotes** expand variables and escapes such as `\n`, `\t`, `\$` and `\u{1F418}`.
- `.` is the concatenation operator. `+` never joins strings.

## Curly braces for anything complex

A plain `$name` works inside double quotes. For array keys with quotes, nested lookups or properties, wrap the expression in `{$...}`.

```php
<?php

$user = ["name" => "Ada", "langs" => ["PHP", "C"]];

echo "Hi {$user['name']}, you know {$user['langs'][0]}\n";
echo "Total: {$user['name']}'s " . count($user["langs"]) . " languages\n";
```

## Heredoc and nowdoc

For multi-line text, **heredoc** (`<<<ID`) behaves like double quotes and **nowdoc** (`<<<'ID'`) like single quotes. Since PHP 7.3 the closing identifier can be indented, and that indentation is removed from every line.

```php
<?php

$name = "Ada";

echo <<<TEXT
    Dear $name,
      thanks for signing up!
    TEXT;
echo "\n";

echo <<<'RAW'
    No $interpolation in here.
    RAW;
echo "\n";
```

## Characters by offset

`$str[0]` is the first character and `$str[-1]` the last. PHP strings are **bytes**, so offsets and `strlen()` count bytes, not letters. That matters for text like `é`, as the guide explains.

```php
<?php

$word = "Hello";
echo $word[0], $word[-1], "\n";  // Ho
echo strlen($word), "\n";        // 5
echo strtoupper($word), "\n";
var_dump(str_contains($word, "ell"));
```

## Challenge

> 🎯 **Challenge:** Write `badge(string $name, int $points)` that returns `"Ada has 30 points"` for `badge("Ada", 30)`, using a double-quoted string with interpolation.

```php starter
<?php

function badge(string $name, int $points)
{
    return '$name has $points points';
}

echo badge("Ada", 30), "\n";
```

```php solution
<?php

function badge(string $name, int $points)
{
    return "$name has $points points";
}

echo badge("Ada", 30), "\n";
```

```php check
expect(badge("Ada", 30) === "Ada has 30 points", "badge('Ada', 30) should return 'Ada has 30 points'");
expect(badge("Linus", 7) === "Linus has 7 points", "badge('Linus', 7) should return 'Linus has 7 points'");
```

**Reference:** [Strings](https://www.php.net/manual/en/language.types.string.php) in the PHP Manual.

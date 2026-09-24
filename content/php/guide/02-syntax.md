---
title: Syntax, tags & structure
section: Guide Book
summary: Tags, statements, expressions, blocks, comments and the escaping rules — the grammar everything else is written in.
---
PHP's grammar is small. Almost everything is a **statement** ending in `;`, statements group into **blocks** with `{ }`, and the whole thing lives inside `<?php … ?>` tags.

## Tags: code inside text

A PHP file starts as text. `<?php` switches to code; `?>` switches back.

```php
<?php

$name = 'Ada';
?>
Hello, <?= $name ?>!
<?php

echo "\nBack in code.\n";
```

`<?=` is shorthand for `<?php echo` — always available, and the normal way to print a value inside markup.

> ⚠️ In a file that is only PHP, leave the closing `?>` off. Any whitespace after it is output, and output sent early breaks headers, redirects and file downloads. Omitting the tag makes that impossible.

## Statements and semicolons

A statement is an instruction. The `;` terminates it. The last statement before `?>` may omit it, because the tag terminates it — but do not rely on that.

```php
<?php

$a = 1; $b = 2;          // two statements on one line is legal
$sum =
    $a
    + $b;                // one statement across three lines is legal too

echo $sum, "\n";
```

Whitespace and newlines carry no meaning. Indentation is for humans; the lexer throws it away.

## Expressions: anything with a value

An expression is anything that evaluates to a value. `1`, `$a + $b`, `strlen($s)`, `$x = 5` — assignment is itself an expression, which is why `$a = $b = 0` works.

```php
<?php

$b = 0;
$a = $b = 5;             // assignment returns the assigned value
echo $a, ' ', $b, "\n";

$ok = ($a > 1);          // comparison is an expression
var_dump($ok);

echo (int) ('7 apples' === '7 apples'), "\n";
```

> 🔍 **Behind the scenes: statement vs expression matters more than it looks**
>
> Because assignment is an expression, `if ($row = fetch())` is legal — and so is the classic typo `if ($x = 5)`, which assigns and then tests `5` (truthy). Some languages forbid this; PHP does not. That is why `if (5 === $x)` — the constant first — is a habit worth having: `if (5 = $x)` is a parse error, so the typo cannot compile.

## Blocks

Curly braces group statements into a block. `if`, `while`, `for`, `foreach`, functions and classes all take one.

```php
<?php

$scores = [12, 7, 30];

foreach ($scores as $s) {
    if ($s > 10) {
        echo $s, " is high\n";
    } else {
        echo $s, " is low\n";
    }
}
```

PHP also has an **alternative syntax** that replaces `{` with `:` and `}` with `endif` / `endforeach` / `endwhile` / `endfor` / `endswitch`. It exists for templates, where a stray `}` is easy to lose in markup.

```php
<?php

$items = ['tea', 'coffee'];
?>
<ul>
<?php foreach ($items as $item): ?>
  <li><?= $item ?></li>
<?php endforeach; ?>
</ul>
```

## Comments

```php
<?php

// a single-line comment, to the end of the line
# also a single-line comment, rarely used

/*
   a block comment
   over several lines
*/

/** A doc comment. Tools and reflection read these. */
function greet(string $who): string {
    return "Hello, $who";
}

echo greet('world'), "\n";
echo (new ReflectionFunction('greet'))->getDocComment(), "\n";
```

> 🔍 **Behind the scenes: a doc comment is data, not a comment**
>
> `/** … */` immediately before a declaration is kept by the compiler and handed back by reflection, which is how IDEs, documentation generators and some frameworks read type hints and annotations. Ordinary `//` and `/* */` comments are discarded by the lexer and cost nothing at runtime.
>
> One trap: `//` and `#` also end at `?>`. `// this ?> is not a comment` switches back to HTML mid-comment.

## Case sensitivity

This catches everyone once:

| Case-**in**sensitive | Case-**sensitive** |
| --- | --- |
| keywords (`IF`, `echo`, `Function`) | variables (`$name` ≠ `$Name`) |
| function names | constants (by default) |
| class and method names | array string keys |

```php
<?php

function Shout(string $s): string { return strtoupper($s); }

echo SHOUT('quiet'), "\n";       // calling with different case: fine

$name = 'Ada';
$Name = 'Grace';
echo $name, ' and ', $Name, "\n";   // two different variables
```

> 💡 **Tip:** Write everything in the case you declared it. Relying on the insensitivity makes code harder to grep and harder to read.

## Escaping from a string

Inside double quotes, `\n`, `\t`, `\\`, `\"` and `\$` are escapes, and `$name` is interpolated. Inside single quotes only `\\` and `\'` mean anything — everything else is literal.

```php
<?php

$who = 'world';

echo "double: hello $who\n";
echo 'single: hello $who', "\n";
echo "a tab\there, a dollar \$here\n";
```

**Reference:** [Basic syntax](https://www.php.net/manual/en/language.basic-syntax.php) in the PHP Manual.

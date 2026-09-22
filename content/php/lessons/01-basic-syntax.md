---
title: Tags, echo & comments
section: 1 · Getting Started
---

PHP code lives between the tags `<?php` and `?>`. Everything outside them is sent as-is, which is how PHP mixes with HTML. `echo` outputs text.

```php
<?php

echo "Hello, PHP!\n";
echo "Sum: ", 2 + 3, "\n";
```

Every statement ends with a semicolon. `echo` takes several values separated by commas and outputs them one after another, with nothing in between: add your own spaces and `"\n"` line breaks.

## The closing tag

A whitespace character (a space, tab or newline) must follow `<?php`. In a file that's only PHP, the manual recommends **leaving out** the closing `?>`: stray whitespace after it would be sent as output before you meant to send anything.

```php
<?php

$name = "Ada";
echo "Hi, $name!\n"; // double quotes fill in variables
```

## Comments

```php
<?php

// a one-line comment
# also a one-line comment
/* a comment that can
   span several lines */
echo "comments are ignored\n";
```

## Challenge

> 🎯 **Challenge:** Output `Hello, PHP!` on the first line and `1 + 2 = 3` on the second, computing the `3` with PHP.

```php starter
<?php

// Line 1: Hello, PHP!
// Line 2: 1 + 2 = 3
```

```php solution
<?php

echo "Hello, PHP!\n";
echo "1 + 2 = ", 1 + 2, "\n";
```

```php check
$lines = explode("\n", trim($output));
expect(count($lines) >= 2, "Output two lines.");
expect($lines[0] === "Hello, PHP!", "Line 1 should be 'Hello, PHP!'");
expect($lines[1] === "1 + 2 = 3", "Line 2 should be '1 + 2 = 3'");
```

**Reference:** [PHP tags](https://www.php.net/manual/en/language.basic-syntax.phptags.php) · [Comments](https://www.php.net/manual/en/language.basic-syntax.comments.php) in the PHP Manual.

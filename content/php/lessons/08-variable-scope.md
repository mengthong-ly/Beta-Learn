---
title: Variable scope
section: 3 · Variables
---

A function in PHP has its own, separate set of variables. Unlike JavaScript or Python, a function does **not** see variables from the code around it.

```php
<?php

$greeting = "Hello";

function greet()
{
    // $greeting doesn't exist in here
    return isset($greeting) ? "found it" : "not visible";
}

echo greet(), "\n";
```

That's deliberate: a function only depends on what you pass in, so it can't break because some far-away code renamed a variable. **Pass values as arguments** and return results.

## global and $GLOBALS

If you really need a global variable, `global $name;` pulls it into the function. The `$GLOBALS` array holds every global variable by name. Both work, and both make code harder to test, so use them rarely.

```php
<?php

$total = 10;

function addFive()
{
    global $total;
    $total += 5;
}

addFive();
echo $total, "\n";          // 15
echo $GLOBALS['total'], "\n";
```

## Static variables

A `static` variable inside a function is created on the first call and **keeps its value** between calls. It's still local: no other code can see it.

```php
<?php

function nextId()
{
    static $id = 0;
    $id++;
    return $id;
}

echo nextId(), nextId(), nextId(), "\n";   // 123
```

> 💡 **Tip:** static variables in a class method are shared by every object of that class, because they belong to the method, not to one object.

## Challenge

> 🎯 **Challenge:** Write `tally()` that returns how many times it has been called: `1` the first time, then `2`, `3` and so on. Use a static variable.

```php starter
<?php

function tally()
{
    $count = 0;
    $count++;
    return $count;
}

echo tally(), tally(), tally(), "\n";
```

```php solution
<?php

function tally()
{
    static $count = 0;
    $count++;
    return $count;
}

echo tally(), tally(), tally(), "\n";
```

```php check
$next = tally();
expect($next === 4, "After three calls, the fourth call to tally() should return 4, got " . var_export($next, true));
expect(tally() === 5, "The fifth call should return 5.");
```

**Reference:** [Variable scope](https://www.php.net/manual/en/language.variables.scope.php) in the PHP Manual.

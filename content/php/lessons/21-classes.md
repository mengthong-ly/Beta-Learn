---
title: Classes & objects
section: 8 · Classes & Objects
---

A **class** is a blueprint: it declares the data an object holds (**properties**) and what it can do (**methods**). `new` builds an object from it, and `->` reaches into the object.

```php
<?php

class Counter
{
    public int $count = 0;

    public function increment(): void
    {
        $this->count++;
    }
}

$clicks = new Counter();
$clicks->increment();
$clicks->increment();
echo $clicks->count, "\n";   // 2
```

Inside a method, `$this` is the object the method was called on. Properties are declared with a visibility keyword, an optional type and an optional default value. Note there's no `$` after `->`: it's `$this->count`, not `$this->$count`.

## Visibility

- `public`: usable from anywhere.
- `protected`: this class and classes that extend it.
- `private`: this class only.

Keep data `private` and expose methods: the class stays in charge of its own rules.

```php
<?php

class BankAccount
{
    private float $balance = 0;

    public function deposit(float $amount): void
    {
        if ($amount <= 0) {
            throw new InvalidArgumentException("Deposit must be positive");
        }
        $this->balance += $amount;
    }

    public function balance(): float
    {
        return $this->balance;
    }
}

$acct = new BankAccount();
$acct->deposit(50);
echo $acct->balance(), "\n";
echo $acct->balance; // error! Cannot access private property
```

## Objects are handles

Assigning an object to another variable does **not** copy it. Both variables point at the same object, so a change through one shows through the other. Use `clone` when you want a real copy.

```php
<?php

class Point
{
    public int $x = 0;
}

$a = new Point();
$b = $a;          // same object
$c = clone $a;    // a separate copy

$b->x = 5;
echo $a->x, " ", $c->x, "\n";   // 5 0
```

## The nullsafe operator

`?->` stops and gives `null` if the thing on its left is `null`, instead of throwing an error.

```php
<?php

class User
{
    public string $name = "Ada";
}

$found = new User();
$missing = null;

var_dump($found?->name);    // string(3) "Ada"
var_dump($missing?->name);  // NULL
```

## Challenge

> 🎯 **Challenge:** Write a class `Cart` with a private array `$items`, a method `add(string $name, float $price)` and a method `total()` that returns the sum of the prices.

```php starter
<?php

class Cart
{
    private array $items = [];

    public function add(string $name, float $price): void
    {
    }

    public function total(): float
    {
        return 0;
    }
}
```

```php solution
<?php

class Cart
{
    private array $items = [];

    public function add(string $name, float $price): void
    {
        $this->items[$name] = $price;
    }

    public function total(): float
    {
        return array_sum($this->items);
    }
}

$cart = new Cart();
$cart->add("pen", 1.5);
$cart->add("book", 12);
echo $cart->total(), "\n";
```

```php check
$c = new Cart();
expect($c->total() == 0, "A new cart should total 0.");
$c->add("pen", 1.5);
$c->add("book", 12);
expect(abs($c->total() - 13.5) < 0.001, "pen 1.5 + book 12 should total 13.5");
expect(!(new ReflectionProperty(Cart::class, 'items'))->isPublic(), "Keep \$items private.");
```

**Reference:** [Classes and objects: the basics](https://www.php.net/manual/en/language.oop5.basic.php) · [Properties](https://www.php.net/manual/en/language.oop5.properties.php) · [Visibility](https://www.php.net/manual/en/language.oop5.visibility.php) in the PHP Manual.

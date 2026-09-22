---
title: Constructors & readonly
section: 8 · Classes & Objects
---

`__construct()` runs automatically when you call `new`. It's where an object gets its starting values, so it's never left half-built.

```php
<?php

class Point
{
    private int $x;
    private int $y;

    public function __construct(int $x, int $y = 0)
    {
        $this->x = $x;
        $this->y = $y;
    }

    public function describe(): string
    {
        return "($this->x, $this->y)";
    }
}

echo (new Point(4, 5))->describe(), "\n";
echo (new Point(y: 7, x: 1))->describe(), "\n";   // named arguments work too
```

## Constructor promotion

Declaring a property, taking a parameter and copying one into the other is so common that PHP 8.0 lets you do all three at once. Put a visibility keyword in front of a constructor parameter and it becomes a property.

```php
<?php

class Point
{
    public function __construct(
        public int $x,
        public int $y = 0,
    ) {
    }
}

$p = new Point(3);
echo "$p->x, $p->y\n";
```

The modifier is what makes it a promoted property. You can mix promoted and ordinary parameters in the same constructor.

## readonly properties

A `readonly` property (PHP 8.1) can be set **once**, from inside the class, and never changed again. It must have a type. Any later write throws an `Error`, even from inside the class.

```php
<?php

class Money
{
    public function __construct(
        public readonly int $cents,
        public readonly string $currency = "EUR",
    ) {
    }
}

$price = new Money(1999);
echo $price->cents, " ", $price->currency, "\n";
$price->cents = 0; // error! Cannot modify readonly property Money::$cents
```

Mark the whole class `readonly class Money` and every property becomes readonly.

## Changing a readonly object: clone with

To "change" an immutable object, you make a modified copy. PHP 8.5's `clone($object, [...])` copies the object and overrides the listed properties, readonly ones included, as long as it's called from inside the class.

```php
<?php

final class Money
{
    public function __construct(
        public readonly int $cents,
        public readonly string $currency = "EUR",
    ) {
    }

    public function add(int $more): static
    {
        return clone($this, ["cents" => $this->cents + $more]);
    }
}

$a = new Money(500);
$b = $a->add(250);
echo $a->cents, " → ", $b->cents, " ", $b->currency, "\n";   // 500 → 750 EUR
```

## Challenge

> 🎯 **Challenge:** Write a class `Temperature` with a promoted `public readonly float $celsius` and a method `toFahrenheit()` that returns `$celsius * 9 / 5 + 32`.

```php starter
<?php

class Temperature
{
    public function __construct(float $celsius)
    {
    }
}
```

```php solution
<?php

class Temperature
{
    public function __construct(public readonly float $celsius)
    {
    }

    public function toFahrenheit(): float
    {
        return $this->celsius * 9 / 5 + 32;
    }
}

echo (new Temperature(100))->toFahrenheit(), "\n";
```

```php check
$t = new Temperature(100);
expect(property_exists($t, 'celsius') && $t->celsius == 100, "Promote \$celsius to a property.");
expect((new ReflectionProperty(Temperature::class, 'celsius'))->isReadOnly(), "Make \$celsius readonly.");
expect(method_exists($t, 'toFahrenheit') && $t->toFahrenheit() == 212, "100°C should be 212°F.");
expect((new Temperature(-40))->toFahrenheit() == -40, "-40°C should be -40°F.");
```

**Reference:** [Constructors and destructors](https://www.php.net/manual/en/language.oop5.decon.php) · [Properties: readonly](https://www.php.net/manual/en/language.oop5.properties.php#language.oop5.properties.readonly-properties) · [Object cloning](https://www.php.net/manual/en/language.oop5.cloning.php) in the PHP Manual.

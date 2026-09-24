---
title: Classes & objects
section: Guide Book
summary: Properties, visibility, inheritance, interfaces, traits, enums and the magic methods — plus what `static` and `self` really resolve to.
---
## A class and its instances

```php
<?php

class Point {
    public function __construct(
        public float $x = 0,
        public float $y = 0,
    ) {}

    public function distanceTo(Point $other): float {
        return sqrt(($this->x - $other->x) ** 2 + ($this->y - $other->y) ** 2);
    }

    public function __toString(): string {
        return "($this->x, $this->y)";
    }
}

$a = new Point(0, 0);
$b = new Point(3, 4);

echo $a, ' → ', $b, ' is ', $a->distanceTo($b), "\n";
```

Constructor **property promotion** — declaring the property in the signature — replaces the declare-then-assign boilerplate that used to be three lines per property.

## Visibility

| Modifier | Reachable from |
| --- | --- |
| `public` | anywhere |
| `protected` | the class and its subclasses |
| `private` | only the declaring class |

```php
<?php

class Account {
    private int $balance = 0;

    public function deposit(int $amount): static {
        if ($amount <= 0) {
            throw new InvalidArgumentException('Deposit must be positive');
        }
        $this->balance += $amount;
        return $this;
    }

    public function balance(): int {
        return $this->balance;
    }
}

$acc = (new Account())->deposit(50)->deposit(25);
echo $acc->balance(), "\n";

try {
    echo $acc->balance;
} catch (\Error $e) {
    echo 'Error: ', $e->getMessage(), "\n";
}
```

`readonly` properties may be written once, from inside the declaring class, and never again.

```php
<?php

final class Money {
    public function __construct(
        public readonly int $amount,
        public readonly string $currency,
    ) {}

    public function plus(Money $other): self {
        return new self($this->amount + $other->amount, $this->currency);
    }
}

$m = new Money(100, 'EUR');
echo $m->plus(new Money(50, 'EUR'))->amount, "\n";

try {
    $m->amount = 999;
} catch (\Error $e) {
    echo 'Error: ', $e->getMessage(), "\n";
}
```

## Static members

Static properties and methods belong to the class, not to any instance.

```php
<?php

class Counter {
    private static int $total = 0;

    public static function bump(): int {
        return ++self::$total;
    }
}

echo Counter::bump(), Counter::bump(), Counter::bump(), "\n";
```

## Inheritance, `self` and `static`

```php
<?php

abstract class Shape {
    abstract public function area(): float;

    public function describe(): string {
        return static::class . ' with area ' . round($this->area(), 2);
    }
}

class Circle extends Shape {
    public function __construct(private float $r) {}
    public function area(): float { return M_PI * $this->r ** 2; }
}

class Square extends Shape {
    public function __construct(private float $side) {}
    public function area(): float { return $this->side ** 2; }
    public function describe(): string {
        return 'A ' . parent::describe();
    }
}

foreach ([new Circle(1), new Square(3)] as $s) {
    echo $s->describe(), "\n";
}
```

> 🔍 **Behind the scenes: `self` is where it was written, `static` is what was called**
>
> `self::` resolves at compile time to the class the code is *written in*. `static::` resolves at run time to the class that was actually instantiated — **late static binding**. In a base class factory, `return new self()` always builds the base class no matter which subclass you called it on; `return new static()` builds the subclass. This single distinction is behind most "why is my factory returning the wrong type?" confusion.

```php
<?php

class Base {
    public static function makeSelf(): self { return new self(); }
    public static function makeStatic(): static { return new static(); }
}
class Child extends Base {}

echo get_class(Child::makeSelf()), "\n";     // Base
echo get_class(Child::makeStatic()), "\n";   // Child
```

## Interfaces

An interface is a contract: method signatures with no bodies. A class may implement many.

```php
<?php

interface Describable {
    public function describe(): string;
}

interface Comparable {
    public function compareTo(self $other): int;
}

final class Version implements Describable, Comparable {
    public function __construct(public readonly int $major, public readonly int $minor) {}
    public function describe(): string { return "v$this->major.$this->minor"; }
    public function compareTo(Comparable $other): int {
        return [$this->major, $this->minor] <=> [$other->major, $other->minor];
    }
}

// `self` inside an interface means the INTERFACE, so the implementation
// widens the parameter to `Comparable` — narrowing it to `Version` would not compile.
$versions = [new Version(2, 1), new Version(1, 9), new Version(2, 0)];
usort($versions, fn(Version $a, Version $b) => $a->compareTo($b));

echo implode(' < ', array_map(fn(Version $v) => $v->describe(), $versions)), "\n";
var_dump($versions[0] instanceof Describable);
```

## Traits

A trait is a block of methods copied into a class at compile time. It is code reuse without inheritance — and it is not a type, so you cannot type-hint one.

```php
<?php

trait Timestamped {
    private ?string $createdAt = null;

    public function touch(): void { $this->createdAt = '2026-01-01'; }
    public function createdAt(): ?string { return $this->createdAt; }
}

trait Sluggable {
    public function slug(): string {
        return strtolower(str_replace(' ', '-', $this->title));
    }
}

class Post {
    use Timestamped, Sluggable;
    public function __construct(public string $title) {}
}

$p = new Post('Hello PHP World');
$p->touch();
echo $p->slug(), ' at ', $p->createdAt(), "\n";
```

> ⚠️ A trait that reads `$this->title` — as `Sluggable` does — has an invisible requirement on the using class. Declare it with an `abstract` method in the trait so the compiler enforces it, instead of failing at run time in one caller.

## Enums

An enum is a type with a fixed set of instances. **Pure** enums have names only; **backed** enums carry an `int` or `string` value.

```php
<?php

enum Status: string {
    case Draft     = 'draft';
    case Published = 'published';
    case Archived  = 'archived';

    public function label(): string {
        return match ($this) {
            Status::Draft     => 'Work in progress',
            Status::Published => 'Live',
            Status::Archived  => 'Hidden',
        };
    }

    public function isVisible(): bool {
        return $this === Status::Published;
    }
}

$s = Status::from('published');
echo $s->name, ' / ', $s->value, ' / ', $s->label(), "\n";
var_dump($s->isVisible());
var_dump(Status::tryFrom('nope'));       // null instead of throwing

foreach (Status::cases() as $case) {
    echo $case->value, ' ';
}
echo "\n";
```

> 💡 **Tip:** Enums are the reason `match` throws on an unhandled case. Add `case Deleted` to the enum above and every `match ($this)` that does not handle it fails loudly — a compile-time-ish guarantee you never get from string constants.

## Magic methods

Methods the engine calls for you. The useful ones:

```php
<?php

class Bag implements Countable {
    private array $items = [];

    public function __get(string $k): mixed  { return $this->items[$k] ?? null; }
    public function __set(string $k, mixed $v): void { $this->items[$k] = $v; }
    public function __isset(string $k): bool { return isset($this->items[$k]); }
    public function __unset(string $k): void { unset($this->items[$k]); }
    public function count(): int             { return count($this->items); }
    public function __toString(): string     { return 'Bag(' . count($this) . ')'; }
    public function __invoke(string $k): mixed { return $this->$k; }
}

$b = new Bag();
$b->colour = 'red';
$b->size = 'L';

echo $b->colour, "\n";
var_dump(isset($b->colour), isset($b->missing));
echo count($b), "\n";
echo $b, "\n";
echo $b('size'), "\n";     // __invoke — the object is callable
```

| Method | Called when |
| --- | --- |
| `__construct` / `__destruct` | creation / destruction |
| `__get` / `__set` / `__isset` / `__unset` | accessing an inaccessible property |
| `__call` / `__callStatic` | calling an inaccessible method |
| `__toString` | used in a string context |
| `__invoke` | the object is called like a function |
| `__clone` | after `clone` |

> ⚠️ Magic properties are invisible to IDEs, static analysers and reflection. They are right for a genuine dynamic container and wrong for "I did not want to declare five properties".

**Reference:** [Classes and Objects](https://www.php.net/manual/en/language.oop5.php) and [Enumerations](https://www.php.net/manual/en/language.enumerations.php) in the PHP Manual.

---
title: Classes
section: Guide Book
summary: Fields, the four visibility levels, `implements` versus `extends`, abstract classes, and why `private` is not private at run time.
---
Classes are one of the few TypeScript constructs that survive to run time — they are JavaScript classes with types layered on.

## Fields and constructors

```typescript
class Account {
  readonly id: string
  balance = 0                     // inferred: number
  owner?: string                  // optional

  constructor(id: string) {
    this.id = id
  }

  deposit(amount: number): this {
    this.balance += amount
    return this
  }
}

const a = new Account("acc-1").deposit(50).deposit(25)
console.log(a.id, a.balance, a.owner ?? "(unowned)")
```

**Parameter properties** collapse the declare-and-assign pair into the signature:

```typescript
class Point {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  plus(other: Point): Point {
    return new Point(this.x + other.x, this.y + other.y)
  }

  toString(): string {
    return `(${this.x}, ${this.y})`
  }
}

console.log(String(new Point(1, 2).plus(new Point(3, 4))))
```

## Visibility

| Modifier | Checked by | Visible at run time |
| --- | --- | --- |
| `public` (default) | — | yes |
| `protected` | compiler | yes |
| `private` | compiler | **yes** |
| `#field` | the JavaScript engine | **no** |

```typescript
class Secret {
  private compilerOnly = "visible at run time"
  #truly = "hidden"

  reveal(): string {
    return `${this.compilerOnly} / ${this.#truly}`
  }
}

const s = new Secret()
console.log(s.reveal())
console.log(Object.keys(s))                          // ["compilerOnly"] — # is absent
console.log((s as unknown as Record<string, string>).compilerOnly)
```

```typescript
class Secret {
  private compilerOnly = "x"
}

console.log(new Secret().compilerOnly) // error! Property 'compilerOnly' is private and only accessible within class 'Secret'.
```

> 🔍 **Behind the scenes: `private` is a lint rule, `#` is enforcement**
>
> TypeScript's `private` is erased — the property is an ordinary field that `JSON.stringify`, `Object.keys` and a cast can all reach. ECMAScript's `#name` is a genuinely private slot the engine enforces: reading it from outside is a *syntax* error, and it never appears in serialisation. Use `#` for anything that must actually stay hidden — secrets, invariants, library internals — and `private` when you only want to signal intent to your own team.

## Getters and setters

```typescript
class Temperature {
  #celsius = 0

  get celsius(): number {
    return this.#celsius
  }

  set celsius(v: number) {
    if (Number.isNaN(v)) throw new RangeError("Not a number")
    this.#celsius = v
  }

  get fahrenheit(): number {
    return this.#celsius * 1.8 + 32
  }
}

const t = new Temperature()
t.celsius = 100
console.log(t.celsius, t.fahrenheit)

try {
  t.celsius = NaN
} catch (e) {
  console.log((e as Error).message)
}
```

A getter with no setter infers a `readonly`-like property from the outside — assignment is a compile error.

## `implements` versus `extends`

`implements` is a **check**, not inheritance. It brings in nothing.

```typescript
interface Serialisable {
  serialise(): string
}

interface Comparable<T> {
  compareTo(other: T): number
}

class Version implements Serialisable, Comparable<Version> {
  constructor(
    readonly major: number,
    readonly minor: number,
  ) {}

  serialise(): string {
    return `${this.major}.${this.minor}`
  }

  compareTo(other: Version): number {
    return this.major - other.major || this.minor - other.minor
  }
}

const versions = [new Version(2, 1), new Version(1, 9), new Version(2, 0)]
versions.sort((a, b) => a.compareTo(b))
console.log(versions.map((v) => v.serialise()).join(" < "))
```

> ⚠️ `implements` does not add inferred parameter types. `class C implements Handler { handle(e) {} }` leaves `e` implicitly `any` — the interface is checked *against* the class, not used to type it. Annotate the parameters.

## Abstract classes

```typescript
abstract class Shape {
  abstract area(): number
  abstract readonly name: string

  describe(): string {
    return `${this.name} with area ${this.area().toFixed(2)}`
  }
}

class Circle extends Shape {
  readonly name = "circle"
  constructor(private r: number) {
    super()
  }
  area(): number {
    return Math.PI * this.r ** 2
  }
}

class Square extends Shape {
  readonly name = "square"
  constructor(private side: number) {
    super()
  }
  area(): number {
    return this.side ** 2
  }
  override describe(): string {
    return `A ${super.describe()}`
  }
}

for (const s of [new Circle(1), new Square(3)]) {
  console.log(s.describe())
}
```

```typescript
abstract class Shape {
  abstract area(): number
}

new Shape() // error! Cannot create an instance of an abstract class.
```

> 💡 **Tip:** Turn on `noImplicitOverride`. It makes the `override` keyword mandatory, so renaming a base method turns every stale subclass method into a compile error instead of a silently-dead one.

## Static members and `this` types

```typescript
class Registry {
  static #instances = 0
  static readonly version = "1.0"

  static create(): Registry {
    Registry.#instances++
    return new Registry()
  }

  static get count(): number {
    return Registry.#instances
  }
}

Registry.create()
Registry.create()
console.log(Registry.count, Registry.version)
```

Returning `this` — rather than the class name — keeps method chains working in subclasses:

```typescript
class Builder {
  protected parts: string[] = []

  add(part: string): this {
    this.parts.push(part)
    return this
  }

  build(): string {
    return this.parts.join(" ")
  }
}

class HtmlBuilder extends Builder {
  tag(name: string): this {
    return this.add(`<${name}>`)
  }
}

console.log(new HtmlBuilder().tag("p").add("hello").tag("/p").build())
```

Had `add()` been typed `: Builder`, the chain above would stop compiling at `.tag()` — the return type would have forgotten the subclass.

## Classes are structural too

A class type is still just a shape. Anything with the right members is assignable, whether or not it was built with `new`.

```typescript
class Logger {
  log(message: string): void {
    console.log(`[log] ${message}`)
  }
}

function run(l: Logger): void {
  l.log("running")
}

run(new Logger())
run({ log: (m: string) => console.log(`[plain] ${m}`) })   // no `new` in sight
```

The exception is a class with `private` or `#` members: those are compared *nominally*, so only the declaring class can satisfy them.

**Reference:** [Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) in the TypeScript Handbook.

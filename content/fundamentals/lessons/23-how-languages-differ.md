---
title: How programming languages differ
section: 6 · Becoming a programmer
---

There are hundreds of programming languages, and that can feel overwhelming. Here's the good news: they're built from the **same ideas** you've learned in this course.

Values, variables, decisions, loops, functions, lists: once you know them, a new language is mostly new spelling.

---

## One program, six languages

Here's a tiny program: store a name, then say hello. In Python:

```python
name = "Ana"
print(f"Hello, {name}!")
```

The `f` before the quotes lets Python put the value of `name` inside the text. Now the same program in **TypeScript** and **PHP**:

```text
TypeScript
    const name = "Ana"
    console.log(`Hello, ${name}!`)

PHP
    <?php
    $name = "Ana";
    echo "Hello, $name!\n";
```

---

## And three more

The same program in **C++**, **Rust** and **Dart**:

```text
C++
    #include <iostream>
    #include <string>

    int main() {
        std::string name = "Ana";
        std::cout << "Hello, " << name << "!\n";
    }

Rust
    fn main() {
        let name = "Ana";
        println!("Hello, {name}!");
    }

Dart
    void main() {
      var name = 'Ana';
      print('Hello, $name!');
    }
```

All six do the same two things: make a variable, show some text. Only the spelling is different.

---

## Spot the differences

Look back at the six versions. The differences are small and mostly about style:

| Difference | Examples |
| --- | --- |
| How you **show text** | `print`, `console.log`, `echo`, `std::cout`, `println!` |
| How you **make a variable** | `name =`, `const`, `$name`, `let`, `var` |
| Lines end with `;` | PHP, C++, Rust, Dart: yes. Python: no |
| A **`main` function** to start | C++, Rust, Dart: yes. Python, PHP, TypeScript: no |
| How **blocks** are marked | Python: indentation. Most others: `{ }` braces |

> 💡 **Key idea:** Learn the ideas once, and every new language is easier. Your second language takes a fraction of the time your first one did.

---

## Compiled or interpreted

Remember [How computers run code](/fundamentals/lesson/how-computers-run-code): the computer only understands machine code, so your code has to be translated. Languages do it in two main ways:

| | How it works | Languages |
| --- | --- | --- |
| **Compiled** | translated into machine code *before* it runs, into a program file | C++, Rust |
| **Interpreted** | another program reads and runs your code as it goes | Python, PHP |

In practice it's blurry. Python turns your code into an in-between form (bytecode) first. TypeScript is translated into JavaScript, which the browser then runs. Dart can do both: quick and interactive while you work, compiled to machine code for the finished app.

> 📝 **Note:** Compiled programs usually run faster. Interpreted ones are usually quicker to try out and change.

---

## Typed or dynamic

Every value has a type: a number, some text, a list. Languages differ in **when** they check that types fit.

- **Static typing** (C++, Rust, TypeScript, Dart): types are checked *before* the program runs. Adding text to a number is caught early, by the compiler.
- **Dynamic typing** (Python, PHP, JavaScript): types are checked *while* it runs. The same variable can hold a number now and text later:

```python
x = 5
print(type(x))
x = "five"
print(type(x))
```

In TypeScript, the second line would be rejected before running:

```text
let x = 5
x = "five"   // Error: Type 'string' is not assignable to type 'number'.
```

Static types catch mistakes early; dynamic types are quicker to write. Python and PHP also let you add optional type hints.

---

## What each is mostly used for

Every language here can do far more than one job, but each has a home:

| Language | Mostly used for |
| --- | --- |
| **Python** | data, AI, science, automating boring tasks |
| **TypeScript** (and JavaScript) | websites, in the browser and on servers |
| **React** | building website interfaces, written in TypeScript |
| **PHP**, with **Laravel** | websites and the servers behind them |
| **Dart**, with **Flutter** | phone apps for iPhone and Android from one codebase |
| **C++** | games, game engines, software that must be very fast |
| **Rust** | fast, reliable systems software and tools |

> 📝 **Note:** React, Laravel and Flutter aren't languages; they're **frameworks**: big toolkits written in a language (TypeScript, PHP and Dart) that do a lot of the work for you.

**Reference:** [Python glossary: interpreted](https://docs.python.org/3/glossary.html#term-interpreted)

```quiz
? easy: Two different programming languages usually share...
+ The same ideas: variables, decisions, loops, functions
- Exactly the same spelling
- Nothing at all
- The same file name
> The ideas carry over between languages. Mostly the spelling changes.
? easy: Which of these is a compiled language?
+ Rust
- Python
- PHP
> Rust (like C++) is translated into machine code before it runs. Python and PHP are run by an interpreter.
? medium: What does "static typing" mean?
+ Types are checked before the program runs
- Values can never change
- The program can't use numbers
- Types are only checked while the program runs
> In statically typed languages like TypeScript, C++, Rust and Dart, the types are checked before running, so some mistakes are caught early.
? medium: What does this print?
~~~python
x = 5
x = "five"
print(x)
~~~
+ five
- 5
- 5five
- An error, x is a number
> Python is dynamically typed, so x can hold a number first and text later. The last value wins.
? hard: You want to build a phone app for both iPhone and Android from one codebase. Which pair from this course fits best?
+ Dart and Flutter
- PHP and Laravel
- C++ and Rust
- Python and pandas
> Flutter is a framework, written in Dart, for building apps for many platforms from one codebase.
```

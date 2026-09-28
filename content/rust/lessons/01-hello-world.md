---
title: Hello, world
section: 1 · Basics
---

Rust is **compiled ahead of time**: `rustc` reads your whole file, checks it, and turns it into a native program before anything runs. Most mistakes show up as *compile errors*, with the line number and usually a suggested fix.

Every program starts at `main`:

```rust
fn main() {
    println!("Hello, world!");
}
```

- `fn` declares a function. `main` is special: it's always the first code that runs.
- `println!` prints a line. The `!` means it's a **macro**, not a function. Macros can do things functions can't, like accept a varying number of arguments.
- The statement ends with a semicolon. Most lines of Rust do.
- The style is four spaces of indentation, with the opening `{` on the same line as `fn main()`. The `rustfmt` tool that comes with Rust formats code this way for you.

## Leaving out the `!`

The `!` is part of the name. Without it, Rust looks for a *function* called `println`, and there isn't one:

```rust
fn main() {
    println("Hello, world!"); // error! expected function, found macro `println`
}
```

Read the whole message when this happens. It points at the line and suggests `use `!` to invoke the macro`.

## Printing more than one line

Each `println!` ends its line. `print!` doesn't, so the next output carries on where it stopped:

```rust
fn main() {
    print!("Hello, ");
    print!("Ferris");
    println!("!");
    println!("Welcome to Rust.");
}
```

## Comments

`//` comments to the end of the line, and `/* … */` can span several lines. `///` is a **doc comment**: it documents the item below it, and `cargo doc` turns it into HTML documentation.

```rust
/// Prints a greeting. This line shows up in the generated docs.
fn main() {
    // A normal comment: the compiler ignores it.
    /* So is this one,
       across two lines. */
    println!("Comments don't print anything");
}
```

## rustc and Cargo

Here, **Run** compiles your file with `rustc --edition 2024` and runs the result. On your own computer, most projects use **Cargo**, Rust's build tool and package manager:

```text
cargo new hello     creates hello/Cargo.toml and hello/src/main.rs
cargo run           builds the project, then runs it
cargo check         checks that it compiles, without building a program (fast)
cargo build --release   builds an optimised program into target/release/
```

`cargo new` writes a `Cargo.toml` that names the package and its **edition**:

```toml
[package]
name = "hello"
version = "0.1.0"
edition = "2024"

[dependencies]
```

An edition is a set of language rules that a crate opts into. Every lesson here uses the 2024 edition, the current one.

## Challenge

> 🎯 **Challenge:** Print exactly two lines: `Hello, Rust!`, then `I'm learning Rust.`

```rust starter
fn main() {
    // your code here
}
```

```rust solution
fn main() {
    println!("Hello, Rust!");
    println!("I'm learning Rust.");
}
```

```rust check
        expect(output.len() == 2, format!("Print exactly two lines, not {}", output.len()));
        expect(output[0] == "Hello, Rust!", format!("Line 1 should be 'Hello, Rust!' but was {:?}", output[0]));
        expect(output[1] == "I'm learning Rust.", format!("Line 2 should be \"I'm learning Rust.\" but was {:?}", output[1]));
```

```quiz
? easy: Where does a Rust program start running?
+ The `main` function
- The first line of the file
- Whichever function is written first
- The function marked `pub`
> `main` is always the first code that runs in a Rust program, wherever it is in the file.
? easy: What does the `!` in `println!` mean?
+ `println!` is a macro, not a function
- The output is printed in bold
- The call can't fail
- The line is printed to stderr
> A `!` after a name calls a macro. Without it, Rust looks for a function with that name.
? medium: What does this print?
~~~rust
fn main() {
    print!("a");
    print!("b");
    println!("c");
    println!("d");
}
~~~
+ abc\nd
- a\nb\nc\nd
- abcd
- abc d
> `print!` doesn't end the line and `println!` does, so `a`, `b` and `c` share a line and `d` starts a new one.
? medium: What does `cargo check` do?
+ Checks that the code compiles, without building a program
- Runs the tests
- Formats the code
- Builds an optimised release program
> `cargo check` skips producing a binary, so it's much faster than `cargo build` for "does this still compile?".
```

**Reference:** [Hello, World!](https://doc.rust-lang.org/book/ch01-02-hello-world.html) and [Hello, Cargo!](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html) in the Rust Book.

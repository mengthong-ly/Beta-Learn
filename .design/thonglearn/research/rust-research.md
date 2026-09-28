# Course research: Rust

Researched 2026-09-25 against primary sources (doc.rust-lang.org, blog.rust-lang.org, the `rust-lang/*` repos, `LyonSyonII/rubri`, `bjorn3/browser_wasi_shim`). Anything not confirmed from a primary source is marked **UNVERIFIED**.

**What was actually run.** `rustc` and `cargo` are not installed on this machine. Instead, every program in §3 was run through **rubri's Miri-in-wasm build** (it reports `rustc 1.78.0-dev`, host `wasm32-wasi`, Cranelift 0.104.1). It ran under Node 23.7 with `@bjorn3/browser_wasi_shim` 0.4.2 from this repo's `node_modules` and `--edition 2021`. That is a real Rust front end and borrow checker, but it is **an old nightly and an interpreter**, not rustc 1.98 codegen. Where §3 shows compile errors or panics in 1.98 format, those come from the Rust Book's `listings/**/output.txt`, which the Book records with its pinned toolchain (`rust-toolchain` = `1.98`, repo commit `1500248`, 2026-09-02). Programs that need 2024-edition or post-1.78 features could not run and are marked **not run**. Nothing was POSTed to the Playground: only one CORS preflight (`OPTIONS`) was sent.

## 1. Summary

| | |
|---|---|
| Stable version | **Rust 1.98.1**, released 2026-09-03 ([blog](https://blog.rust-lang.org/2026/09/03/Rust-1.98.1/); `static.rust-lang.org/dist/channel-rust-stable.toml`: `rustc 1.98.1 (48a229cea 2026-09-01)`, cargo `0.99.0`). 1.98.0 came out 2026-08-20. Releases come every 6 weeks, from 1.90 (2025-09-18) to 1.98 ([releases](https://blog.rust-lang.org/releases/)). |
| Edition | **2024** (stable since 1.85.0, 2025-02-20: [blog](https://blog.rust-lang.org/2025/02/20/Rust-1.85.0/)). `cargo new` writes `edition = "2024"` ([Book 1.3](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html)). Plain `rustc` **defaults to 2015** ([rustc CLI](https://doc.rust-lang.org/rustc/command-line-arguments.html)), so every runner must pass `--edition 2024`. |
| Official curriculum | *The Rust Programming Language* ("the Book"). The online stable copy assumes Rust **1.90.0** + edition 2024 ([title page](https://doc.rust-lang.org/stable/book/title-page.html)); the repo's `main` has moved to **1.98.0** ([title-page.md](https://github.com/rust-lang/book/blob/main/src/title-page.md)). Companions: [Rust by Example](https://doc.rust-lang.org/rust-by-example/), [Rustlings](https://github.com/rust-lang/rustlings) (MIT, v6.5.0), the [Reference](https://doc.rust-lang.org/reference/), [std docs](https://doc.rust-lang.org/std/), and the [Edition Guide](https://doc.rust-lang.org/edition-guide/). |
| Runtime options | (a) Learner's own `rustc` through the local runner: exact, needs rustup plus a C linker. (b) Rust Playground `POST /execute`: exact 1.98 and 2024 edition, CORS `*`, 10 s limit, **no published terms or rate limits**. (c) Miri in wasm (rubri): **~42 MB brotli**, stuck on 1.78-dev, so no 2024 edition, panics abort, and it's slow. (d) No official rustc build runs *on* wasm: `wasm32-wasip1(-threads)` are Tier 2 **without host tools**. |
| Recommendation | **Local runner** (like Dart and Flutter), write-only on the website, plus an **"Open in Playground"** deep link per example. Don't ship rubri. See §5. |
| Risk | **Medium-high** for in-browser running: there's no maintained wasm rustc, and the only exact hosted option is a third-party service with no stated policy. **Low** for content: the Book, RBE and Rustlings line up closely, and the Book's recorded outputs give exact 1.98 error text. |

### Surprises (contradict common assumptions)

- **Panic messages now include a thread ID** (since 1.91: "[Print thread ID in panic message](https://github.com/rust-lang/rust/pull/115746)", [RELEASES.md](https://github.com/rust-lang/rust/blob/master/RELEASES.md)). In 1.98 it looks like `thread 'main' (6018279) panicked at src/main.rs:2:5:` ([Book listing](https://github.com/rust-lang/book/blob/main/listings/ch09-error-handling/no-listing-01-panic/output.txt)). The number changes on every run, so a check must not compare panic lines verbatim.
- **`rustc` without `--edition` compiles as Rust 2015** ([rustc CLI](https://doc.rust-lang.org/rustc/command-line-arguments.html)). Rubri passes no edition flag, so its site runs 2015-edition Rust.
- **The Book's async chapter needs a crate.** Ch. 17 uses `trpl` (tokio + futures + reqwest + scraper; [packages/trpl/Cargo.toml](https://github.com/rust-lang/book/blob/main/packages/trpl/Cargo.toml)), because "Rust does not" bundle a runtime ([ch17-01](https://doc.rust-lang.org/book/ch17-01-futures-and-syntax.html)). The Playground explicitly adds `trpl` to its crate set ([crate-modifications.toml](https://github.com/rust-lang/rust-playground/blob/main/top-crates/crate-modifications.toml)). Rustlings' new `24_async` (main branch only, not in v6.5.0) uses tokio.
- **The Playground's HTTP API is CORS-open.** A live preflight to `https://play.rust-lang.org/execute` from `Origin: https://example.com` returned `access-control-allow-origin: *`, `access-control-allow-methods: GET,POST`, `access-control-allow-headers: content-type`, `access-control-max-age: 3600`. That matches `CorsLayer::new().allow_origin(cors::Any)` in [server_axum.rs](https://github.com/rust-lang/rust-playground/blob/main/ui/src/server_axum.rs) and `PLAYGROUND_CORS_ENABLED=1` in [deployment/playground.service](https://github.com/rust-lang/rust-playground/blob/main/deployment/playground.service).
- **Let chains are 2024-edition only** (stable since 1.88, [blog](https://blog.rust-lang.org/2025/06/26/Rust-1.88.0/)), and `if let` guards in `match` arrived in 1.95.

---

## 2. Official curriculum

### 2.1 The Book: full table of contents

From [`src/SUMMARY.md`](https://raw.githubusercontent.com/rust-lang/book/main/src/SUMMARY.md) (main, 2026-09-02). Online: `https://doc.rust-lang.org/book/<file>.html`.

0. Foreword · Introduction
1. **Getting Started**: Installation · Hello, World! · Hello, Cargo!
2. **Programming a Guessing Game** (single page; uses the `rand` crate)
3. **Common Programming Concepts**: Variables and Mutability · Data Types · Functions · Comments · Control Flow
4. **Understanding Ownership**: What is Ownership? · References and Borrowing · The Slice Type
5. **Using Structs to Structure Related Data**: Defining and Instantiating Structs · An Example Program Using Structs · Methods
6. **Enums and Pattern Matching**: Defining an Enum · The `match` Control Flow Construct · Concise Control Flow with `if let` and `let...else`
7. **Packages, Crates, and Modules**: Packages and Crates · Control Scope and Privacy with Modules · Paths for Referring to an Item in the Module Tree · Bringing Paths Into Scope with the `use` Keyword · Separating Modules into Different Files
8. **Common Collections**: Storing Lists of Values with Vectors · Storing UTF-8 Encoded Text with Strings · Storing Keys with Associated Values in Hash Maps
9. **Error Handling**: Unrecoverable Errors with `panic!` · Recoverable Errors with `Result` · To `panic!` or Not to `panic!`
10. **Generic Types, Traits, and Lifetimes**: Generic Data Types · Defining Shared Behavior with Traits · Validating References with Lifetimes
11. **Writing Automated Tests**: How to Write Tests · Controlling How Tests Are Run · Test Organization
12. **An I/O Project: Building a Command Line Program**: Accepting Command Line Arguments · Reading a File · Refactoring to Improve Modularity and Error Handling · Adding Functionality with Test Driven Development · Working with Environment Variables · Redirecting Errors to Standard Error
13. **Functional Language Features: Iterators and Closures**: Closures · Processing a Series of Items with Iterators · Improving Our I/O Project · Performance in Loops vs. Iterators
14. **More about Cargo and Crates.io**: Customizing Builds with Release Profiles · Publishing a Crate to Crates.io · Cargo Workspaces · Installing Binaries with `cargo install` · Extending Cargo with Custom Commands
15. **Smart Pointers**: Using `Box<T>` to Point to Data on the Heap · Treating Smart Pointers Like Regular References · Running Code on Cleanup with the `Drop` Trait · `Rc<T>`, the Reference Counted Smart Pointer · `RefCell<T>` and the Interior Mutability Pattern · Reference Cycles Can Leak Memory
16. **Fearless Concurrency**: Using Threads to Run Code Simultaneously · Transfer Data Between Threads with Message Passing · Shared-State Concurrency · Extensible Concurrency with `Send` and `Sync`
17. **Fundamentals of Asynchronous Programming: Async, Await, Futures, and Streams**: Futures and the Async Syntax · Applying Concurrency with Async · Working With Any Number of Futures · Streams: Futures in Sequence · A Closer Look at the Traits for Async · Futures, Tasks, and Threads
18. **Object Oriented Programming Features**: Characteristics of Object-Oriented Languages · Using Trait Objects to Abstract over Shared Behavior · Implementing an Object-Oriented Design Pattern
19. **Patterns and Matching**: All the Places Patterns Can Be Used · Refutability: Whether a Pattern Might Fail to Match · Pattern Syntax
20. **Advanced Features**: Unsafe Rust · Advanced Traits · Advanced Types · Advanced Functions and Closures · Macros
21. **Final Project: Building a Multithreaded Web Server**: Building a Single-Threaded Web Server · From Single-Threaded to Multithreaded Server · Graceful Shutdown and Cleanup
- **Appendix**: A Keywords · B Operators and Symbols · C Derivable Traits · D Useful Development Tools · E Editions · F Translations of the Book · G How Rust is Made and "Nightly Rust"

Not in the Book (look elsewhere): `std::thread::scope` (std, stable since 1.63: [docs](https://doc.rust-lang.org/std/thread/fn.scope.html)); let chains ([Edition Guide](https://doc.rust-lang.org/edition-guide/rust-2024/let-chains.html)); formatting details (`std::fmt`: [docs](https://doc.rust-lang.org/std/fmt/index.html); RBE [Formatted print](https://doc.rust-lang.org/rust-by-example/hello/print.html)); conversions (`From`/`Into`/`TryFrom`, RBE [Conversion](https://doc.rust-lang.org/rust-by-example/conversion.html)).

The title page also points readers to Brown University's interactive edition with quizzes and visualisations (https://rust-book.cs.brown.edu), which is worth studying as UX prior art.

### 2.2 Rust by Example: top-level TOC

From [`src/SUMMARY.md`](https://raw.githubusercontent.com/rust-lang/rust-by-example/master/src/SUMMARY.md): Hello World · Primitives · Custom Types · Variable Bindings · Types · Conversion · Expressions · Flow of Control · Functions · Modules · Crates · Cargo · Attributes · Generics · Scoping rules (RAII, ownership, borrowing, lifetimes) · Traits · `macro_rules!` · Error handling · Std library types · Std misc (threads, channels, file I/O, processes) · Testing · Unsafe Operations · Compatibility · Meta.

### 2.3 Rustlings: exercise order

Repo [rust-lang/rustlings](https://github.com/rust-lang/rustlings): MIT; latest release **v6.5.0** (2025-08-21); last commit on `main` 2026-08-29; the workspace sets `edition = "2024"`, `rust-version = "1.88"` ([Cargo.toml](https://github.com/rust-lang/rustlings/blob/main/Cargo.toml)). The order comes from [`rustlings-macros/info.toml`](https://github.com/rust-lang/rustlings/blob/main/rustlings-macros/info.toml), and the chapter mapping from [`exercises/README.md`](https://github.com/rust-lang/rustlings/blob/main/exercises/README.md).

| # | Folder (exercises) | Book § (Rustlings' own mapping) |
|---|---|---|
| 00 | intro (1–2) | – |
| 01 | variables (1–6) | §3.1 |
| 02 | functions (1–5) | §3.3 |
| 03 | if (1–3) → **quiz1** | §3.5 |
| 04 | primitive_types (1–6) | §3.2, §4.3 |
| 05 | vecs (1–2) | §8.1 |
| 06 | move_semantics (1–5) | §4.1–2 |
| 07 | structs (1–3) | §5.1, §5.3 |
| 08 | enums (1–3) | §6, §19.3 |
| 09 | strings (1–4) | §8.2 |
| 10 | modules (1–3) | §7 |
| 11 | hashmaps (1–3) → **quiz2** | §8.3 |
| 12 | options (1–3) | §10.1 (sic) |
| 13 | error_handling (errors1–6) | §9 |
| 14 | generics (1–2) | §10 |
| 15 | traits (1–5) → **quiz3** | §10.2 |
| 16 | lifetimes (1–3) | §10.3 |
| 17 | tests (1–3) | §11.1 |
| 18 | iterators (1–5) | §13.2–4 |
| 19 | smart_pointers (1–4) | §15, §16.3 |
| 20 | threads (1–3) | §16.1–3 |
| 21 | macros (1–4) | §20.5 |
| 22 | clippy (1–3) | Appendix D |
| 23 | conversions (1–5) | n/a |
| 24 | async (1) | ch. 17 + tokio (**`main` only**, not in v6.5.0) |

That is 95 exercises on `main` and 94 in v6.5.0.

### 2.4 How they map

| Topic | Book | RBE | Rustlings |
|---|---|---|---|
| Hello / Cargo | 1.2–1.3, 14 | Hello World, Cargo | 00 |
| Variables, types, functions, control flow | 3.1–3.5 | Variable Bindings, Primitives, Types, Functions, Flow of Control, Expressions | 01–04 |
| Ownership, borrowing, slices | 4 | Scoping rules | 06, 04 (slices) |
| Structs, methods | 5 | Custom Types, Functions/Methods | 07 |
| Enums, match, if let | 6, 19 | Custom Types/Enums, Flow of Control/match | 08, 12 |
| Modules | 7 | Modules, Crates | 10 |
| Vec, String, HashMap | 8 | Std library types | 05, 09, 11 |
| Errors | 9 | Error handling | 13 |
| Generics, traits, lifetimes | 10, 20.2 | Generics, Traits, Scoping rules/Lifetimes | 14–16 |
| Tests | 11 | Testing | 17 |
| Closures, iterators | 13 | Functions/Closures, Traits/Iterators | 18 |
| Smart pointers | 15 | Std library types (Box, Rc) | 19 |
| Threads | 16 | Std misc/Threads, Channels | 20 |
| Async | 17 (needs `trpl`) | – | 24 (tokio) |
| Trait objects | 18.2 | Traits/`dyn` | 15 (traits4–5) |
| Patterns | 19 | Flow of Control/match | 08 |
| Unsafe, macros | 20.1, 20.5 | Unsafe Operations, `macro_rules!` | 21 |
| Conversions | – | Conversion | 23 |

---

## 3. Syntax map

Each entry has a status tag:
- **Ran**: executed through Miri-wasm (rustc 1.78.0-dev, `--edition 2021`) as described at the top. The output shown is what it printed.
- **Book 1.98**: compiler or panic text copied from the Book's recorded `output.txt`.
- **Not run**: needs a post-1.78 feature. The output shown is derived from the docs, so it's **UNVERIFIED**.

Before publishing, re-run every example on rustc 1.98.1 with `--edition 2024` (`check:content`). Panic lines will then gain the `(thread-id)` described in §4.

### 3.1 Comments and doc comments
`//` line, `/* */` block; `///` documents the next item, `//!` the enclosing item. Doc comments are Markdown and are rendered by rustdoc (and their code blocks run as doctests).
```rust
//! Inner doc comment: documents the enclosing item (here, the crate).

/// Outer doc comment: documents the next item. Markdown, shown by rustdoc.
fn add_one(x: i32) -> i32 {
    x + 1 // line comment
}

fn main() {
    /* block comment */
    println!("{}", add_one(41));
}
```
```text
42
```
**Ran.** Sources: [Book 3.4](https://doc.rust-lang.org/book/ch03-04-comments.html) · [Reference: comments](https://doc.rust-lang.org/reference/comments.html) · [Book 14.2 doc comments](https://doc.rust-lang.org/book/ch14-02-publishing-to-crates-io.html)

### 3.2 `println!`, `format!`, `{}` `{:?}` `{:#?}`, inline args, width and precision
`{}` uses `Display`, `{:?}` `Debug`, `{:#?}` pretty `Debug`. `{name}` captures a variable in scope. `{:>6}` `{:<6}` `{:^6}` align in a width; `{:.2}` is precision; `{:05}` zero-pads. `format!` returns a `String`; `eprintln!` writes to stderr.
```rust
fn main() {
    let name = "Ferris";
    let pi = 3.14159;
    let v = vec![1, 2];
    println!("Hello, {name}!"); // inline (captured) argument
    println!("{} + {} = {}", 1, 2, 1 + 2);
    println!("{0} {1} {0}", "a", "b");
    println!("{v:?}");
    println!("[{:>6}] [{:<6}] [{:^6}]", "r", "l", "c");
    println!("{:.2} {pi:8.3} {:05}", pi, 42);
    let s = format!("{name} has {} items", v.len());
    println!("{s}");
    println!("{:#?}", (1, "two"));
    eprintln!("this goes to stderr");
}
```
```text
Hello, Ferris!
1 + 2 = 3
a b a
[1, 2]
[     r] [l     ] [  c   ]
3.14    3.142 00042
Ferris has 2 items
(
    1,
    "two",
)
this goes to stderr        ← on stderr
```
**Ran.** Sources: [std::fmt](https://doc.rust-lang.org/std/fmt/index.html) (Width, Fill/Alignment, Precision) · [RBE Formatted print](https://doc.rust-lang.org/rust-by-example/hello/print.html) · [Book 5.2 `{:#?}`](https://doc.rust-lang.org/book/ch05-02-example-structs.html) (Book 1.98 output: `rect1 is Rectangle {\n    width: 30,\n    height: 50,\n}`)

### 3.3 `let`, `mut`, shadowing, `const`, `static`
Bindings are immutable by default. `let x = …` again *shadows*: it creates a new binding, which may have a new type. `const` needs a type and is inlined at every use. `static` has one fixed address for the whole program.
```rust
const MAX_POINTS: u32 = 100_000;
static GREETING: &str = "hi";

fn main() {
    let x = 5;
    let mut y = 10;
    y += x;
    let x = x * 2; // shadowing: a new binding named x
    let spaces = "   ";
    let spaces = spaces.len(); // shadowing may change the type
    println!("{x} {y} {spaces} {MAX_POINTS} {GREETING}");
}
```
```text
10 15 3 100000 hi
```
**Ran.** Assigning to an immutable binding gives **E0384** (**Book 1.98**): `error[E0384]: cannot assign twice to immutable variable `x`` … `help: consider making this binding mutable` … `let mut x = 5;` ([output.txt](https://github.com/rust-lang/book/blob/main/listings/ch03-common-programming-concepts/no-listing-01-variables-are-immutable/output.txt)). Sources: [Book 3.1](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html) · [Reference: constant items](https://doc.rust-lang.org/reference/items/constant-items.html) · [static items](https://doc.rust-lang.org/reference/items/static-items.html)

### 3.4 Scalar types, overflow, casts
Integers: `i8`…`i128`, `u8`…`u128`, `isize`/`usize`; default `i32`. Floats: `f32`, `f64` (default). `bool`. `char` is **4 bytes, a Unicode scalar value** (U+0000–U+D7FF, U+E000–U+10FFFF). **Overflow:** in debug builds it's a panic; in `--release` it wraps (two's complement), and "relying on integer overflow's wrapping behavior is considered an error". Use `wrapping_*`, `checked_*` (→ `Option`), `overflowing_*` or `saturating_*` to handle it on purpose. `as` truncates integers and saturates float-to-int.
```rust
fn main() {
    let a: u8 = 255;
    println!("{}", a.wrapping_add(1));
    println!("{:?}", a.checked_add(1));
    println!("{:?}", a.checked_sub(5));
    println!("{:?}", a.overflowing_add(1));
    println!("{}", a.saturating_add(10));
    println!("{} {}", i32::MAX, u64::MAX);
    let f = 7.0 / 2.0; // f64 by default
    let q = 7 / 2; // integer division truncates
    println!("{f} {q} {}", 7 % 2);
    let heart = '❤';
    println!("{} {}", std::mem::size_of::<char>(), heart as u32);
    println!("{} {} {}", 3.99_f64 as i32, -1i32 as u8, 300i32 as u8);
    println!("{}", true && !false);
}
```
```text
0
None
Some(250)
(0, true)
255
2147483647 18446744073709551615
3.5 3 1
4 10084
3 255 44
true
```
**Ran.** Debug-build overflow (**Ran**, with 1.78's format; 1.98 adds a thread ID):
```rust
fn main() {
    let a: u8 = "255".parse().unwrap(); // not a constant, so the compiler can't reject it
    let b = a + 1; // debug build: panics
    println!("{b}");
}
```
```text
thread 'main' panicked at main.rs:3:13:
attempt to add with overflow
```
Sources: [Book 3.2 Data Types](https://doc.rust-lang.org/book/ch03-02-data-types.html) (integer overflow box, `char`) · [Reference: numeric types](https://doc.rust-lang.org/reference/types/numeric.html) · [Reference: `as` casts](https://doc.rust-lang.org/reference/expressions/operator-expr.html#type-cast-expressions) · [std `u8`](https://doc.rust-lang.org/std/primitive.u8.html) · [std `char`](https://doc.rust-lang.org/std/primitive.char.html)

### 3.5 Tuples, arrays, `[T; N]`
```rust
fn main() {
    let tup: (i32, f64, char) = (500, 6.4, 'z');
    let (x, y, z) = tup;
    println!("{x} {y} {z} {}", tup.0);
    let a = [1, 2, 3, 4, 5];
    let zeros = [0; 3]; // [T; N]: three zeros
    println!("{} {} {:?} {}", a[0], a.len(), zeros, a.iter().sum::<i32>());
    let unit = ();
    println!("{unit:?}");
}
```
```text
500 6.4 z 500
1 5 [0, 0, 0] 15
()
```
**Ran.** An out-of-bounds index with a runtime value panics (**Book 1.98**): `index out of bounds: the len is 3 but the index is 99` ([listing 9-1 output](https://github.com/rust-lang/book/blob/main/listings/ch09-error-handling/listing-09-01/output.txt)). Sources: [Book 3.2 Compound Types](https://doc.rust-lang.org/book/ch03-02-data-types.html#compound-types) · [Reference: tuple](https://doc.rust-lang.org/reference/types/tuple.html) · [array](https://doc.rust-lang.org/reference/types/array.html)

### 3.6 Functions, statements vs expressions, tail return
A block `{}` is an expression. The last expression *without* a semicolon is its value, and a function returns that value. Parameters need type annotations.
```rust
fn plus_one(x: i32) -> i32 {
    x + 1 // no semicolon: the tail expression is the return value
}

fn print_labeled(value: i32, unit: char) {
    println!("The measurement is: {value}{unit}");
}

fn main() {
    let y = {
        let x = 3;
        x + 1
    }; // a block is an expression
    print_labeled(5, 'h');
    println!("{y} {}", plus_one(5));
}
```
```text
The measurement is: 5h
4 6
```
**Ran.** Adding `;` after `x + 1` gives E0308 "mismatched types" (**Book 1.98**, [no-listing-23](https://github.com/rust-lang/book/blob/main/listings/ch03-common-programming-concepts/no-listing-23-statements-dont-return-values/output.txt)). Sources: [Book 3.3](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html) · [Reference: statements](https://doc.rust-lang.org/reference/statements.html) · [block expressions](https://doc.rust-lang.org/reference/expressions/block-expr.html)

### 3.7 `if` expressions, `loop`/`break value`, labels, `while`, `for` over ranges
```rust
fn main() {
    let n = 7;
    let kind = if n % 2 == 0 { "even" } else { "odd" };
    let mut counter = 0;
    let result = loop {
        counter += 1;
        if counter == 10 {
            break counter * 2; // loop is an expression: break with a value
        }
    };
    let mut k = 3;
    while k != 0 {
        print!("{k} ");
        k -= 1;
    }
    println!("liftoff");
    for i in 1..4 {
        print!("{i} ");
    }
    for i in (1..=3).rev() {
        print!("{i} ");
    }
    println!();
    println!("{kind} {result}");
}
```
```text
3 2 1 liftoff
1 2 3 3 2 1 
odd 20
```
**Ran.** Loop labels (`'counting_up: loop { … break 'counting_up; }`) are in the Book with a recorded run ending `End count = 2` (**Book 1.98**, [no-listing-32-5](https://github.com/rust-lang/book/blob/main/listings/ch03-common-programming-concepts/no-listing-32-5-loop-labels/output.txt)). A non-`bool` condition gives E0308, and mismatched `if`/`else` arm types give "E0308 `if` and `else` have incompatible types". Sources: [Book 3.5](https://doc.rust-lang.org/book/ch03-05-control-flow.html) · [Reference: loop expressions](https://doc.rust-lang.org/reference/expressions/loop-expr.html) · [if expressions](https://doc.rust-lang.org/reference/expressions/if-expr.html)

### 3.8 Ownership: move, `Copy`, `Clone`, drop at scope end
Each value has one owner. Assigning or passing a non-`Copy` value **moves** it. `.clone()` deep-copies. Scalar types are `Copy`. A value is dropped when its owner goes out of scope.
```rust
fn takes(s: String) -> usize {
    s.len()
} // s goes out of scope here and is dropped

fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone(); // deep copy of the heap data
    let n = takes(s1); // s1 is moved into the function
    let x = 5;
    let y = x; // i32 is Copy: x is still usable
    println!("{s2} {n} {x} {y}");
}
```
```text
hello 5 5 5
```
**Ran.** Using a moved value gives **E0382** (**Book 1.98**, exact):
```text
error[E0382]: borrow of moved value: `s1`
 --> src/main.rs:5:16
  |
2 |     let s1 = String::from("hello");
  |         -- move occurs because `s1` has type `String`, which does not implement the `Copy` trait
3 |     let s2 = s1;
  |              -- value moved here
4 |
5 |     println!("{s1}, world!");
  |                ^^ value borrowed here after move
  |
help: consider cloning the value if the performance cost is acceptable
  |
3 |     let s2 = s1.clone();
  |                ++++++++

For more information about this error, try `rustc --explain E0382`.
```
([output.txt](https://github.com/rust-lang/book/blob/main/listings/ch04-understanding-ownership/no-listing-04-cant-use-after-move/output.txt)). Sources: [Book 4.1](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html) · [E0382](https://doc.rust-lang.org/error_codes/E0382.html) · [Reference: destructors](https://doc.rust-lang.org/reference/destructors.html)

### 3.9 References and borrowing (E0499, E0502, E0106)
At any time you can have **either** one `&mut` **or** any number of `&`, and references must always be valid. A borrow ends at its last use (non-lexical lifetimes).
```rust
fn calculate_length(s: &String) -> usize {
    s.len()
}

fn change(s: &mut String) {
    s.push_str(", world");
}

fn main() {
    let mut s = String::from("hello");
    let len = calculate_length(&s);
    change(&mut s);
    let r1 = &s;
    let r2 = &s; // any number of shared borrows
    println!("{r1} {r2} {len}");
    let r3 = &mut s; // fine: r1 and r2 are not used after this point
    r3.push('!');
    println!("{s}");
}
```
```text
hello, world hello, world 5
hello, world!
```
**Ran.** The three canonical errors (**Book 1.98**, first lines):
- `error[E0499]: cannot borrow `s` as mutable more than once at a time` ([output](https://github.com/rust-lang/book/blob/main/listings/ch04-understanding-ownership/no-listing-10-multiple-mut-not-allowed/output.txt))
- `error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable` ([output](https://github.com/rust-lang/book/blob/main/listings/ch04-understanding-ownership/no-listing-12-immutable-and-mutable-not-allowed/output.txt))
- `fn dangle() -> &String` → `error[E0106]: missing lifetime specifier` … `= help: this function's return type contains a borrowed value, but there is no value for it to be borrowed from` … `help: instead, you are more likely to want to return an owned value` ([output](https://github.com/rust-lang/book/blob/main/listings/ch04-understanding-ownership/no-listing-14-dangling-reference/output.txt))
- Also: mutating through `&` gives `E0596: cannot borrow `*some_string` as mutable, as it is behind a `&` reference` (listing 4-6).

Sources: [Book 4.2](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html) · [E0499](https://doc.rust-lang.org/error_codes/E0499.html) · [E0502](https://doc.rust-lang.org/error_codes/E0502.html) · [E0106](https://doc.rust-lang.org/error_codes/E0106.html)

### 3.10 Slices: `&str`, `&[T]`
```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    &s[..]
}

fn main() {
    let s = String::from("hello world");
    let word = first_word(&s); // &String coerces to &str
    let literal = first_word("hi there"); // string literals are &str
    let a = [1, 2, 3, 4, 5];
    let slice: &[i32] = &a[1..3];
    println!("{word} {literal} {:?} {}", slice, &s[6..]);
}
```
```text
hello hi [2, 3] world
```
**Ran.** Calling `s.clear()` while `word` is alive gives E0502 (**Book 1.98**, [no-listing-19](https://github.com/rust-lang/book/blob/main/listings/ch04-understanding-ownership/no-listing-19-slice-error/output.txt)). Sources: [Book 4.3](https://doc.rust-lang.org/book/ch04-03-slices.html) · [Reference: slice types](https://doc.rust-lang.org/reference/types/slice.html)

### 3.11 Structs: named, tuple, unit; field init shorthand; update syntax; `#[derive(Debug)]`
```rust
#[derive(Debug)]
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

struct Color(i32, i32, i32); // tuple struct
struct AlwaysEqual; // unit-like struct

fn build_user(email: String, username: String) -> User {
    User { active: true, username, email, sign_in_count: 1 } // field init shorthand
}

fn main() {
    let user1 = build_user(String::from("a@example.com"), String::from("ann"));
    let user2 = User { email: String::from("b@example.com"), ..user1 }; // update syntax
    let black = Color(0, 0, 0);
    let _subject = AlwaysEqual;
    println!("{} {} {}", user2.username, user2.sign_in_count, black.0);
    println!("{user2:?}");
}
```
```text
ann 1 0
User { active: true, username: "ann", email: "b@example.com", sign_in_count: 1 }
```
**Ran.** The compile also printed two `dead_code` **warnings** on stderr ("fields `active` and `email` are never read", "fields `1` and `2` are never read"). The runner must show warnings apart from program output, or lessons must avoid them. `..user1` *moves* `username` out of `user1`. Without `#[derive(Debug)]`, `{:?}` gives ``E0277: `Rectangle` doesn't implement `Debug` `` (**Book 1.98**). Sources: [Book 5.1](https://doc.rust-lang.org/book/ch05-01-defining-structs.html) · [5.2](https://doc.rust-lang.org/book/ch05-02-example-structs.html) · [Reference: structs](https://doc.rust-lang.org/reference/items/structs.html)

### 3.12 `impl`, methods (`&self`, `&mut self`, `self`), associated functions
```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn new(width: u32, height: u32) -> Self {
        Self { width, height } // associated function (no self): called as Rectangle::new
    }
    fn square(size: u32) -> Self {
        Self::new(size, size)
    }
    fn area(&self) -> u32 {
        self.width * self.height // &self: reads
    }
    fn grow(&mut self, by: u32) {
        self.width += by; // &mut self: changes
        self.height += by;
    }
    fn into_tuple(self) -> (u32, u32) {
        (self.width, self.height) // self: consumes the value
    }
}

fn main() {
    let mut r = Rectangle::new(3, 4);
    println!("{}", r.area());
    r.grow(1);
    println!("{r:?} {}", Rectangle::square(2).area());
    let (w, h) = r.into_tuple();
    println!("{w}x{h}");
}
```
```text
12
Rectangle { width: 4, height: 5 } 4
4x5
```
**Ran.** Sources: [Book 5.3](https://doc.rust-lang.org/book/ch05-03-method-syntax.html) · [Reference: implementations](https://doc.rust-lang.org/reference/items/implementations.html)

### 3.13 Enums with data, `Option<T>`
```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn describe(m: &Message) -> String {
    match m {
        Message::Quit => String::from("quit"),
        Message::Move { x, y } => format!("move to {x},{y}"),
        Message::Write(text) => format!("write {text}"),
        Message::ChangeColor(r, g, b) => format!("color {r} {g} {b}"),
    }
}

fn main() {
    let msgs = [
        Message::Quit,
        Message::Move { x: 1, y: 2 },
        Message::Write(String::from("hi")),
        Message::ChangeColor(0, 128, 255),
    ];
    for m in &msgs {
        println!("{}", describe(m));
    }
    let some: Option<i32> = Some(5);
    let none: Option<i32> = None;
    println!("{:?} {:?} {}", some.map(|n| n + 1), none, none.unwrap_or(0));
}
```
```text
quit
move to 1,2
write hi
color 0 128 255
Some(6) None 0
```
**Ran.** `i8 + Option<i8>` gives ``E0277: cannot add `Option<i8>` to `i8` `` (**Book 1.98**, [no-listing-07](https://github.com/rust-lang/book/blob/main/listings/ch06-enums-and-pattern-matching/no-listing-07-cant-use-option-directly/output.txt)). Sources: [Book 6.1](https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html) · [Reference: enumerations](https://doc.rust-lang.org/reference/items/enumerations.html) · [std Option](https://doc.rust-lang.org/std/option/enum.Option.html)

### 3.14 `match`, exhaustiveness, `_`
```rust
fn main() {
    for n in [1, 3, 7, 42] {
        let s = match n {
            1 => "one",
            2 | 3 => "two or three",
            4..=9 => "a few",
            _ => "lots", // catch-all: without it the match is not exhaustive
        };
        println!("{n}: {s}");
    }
}
```
```text
1: one
3: two or three
7: a few
42: lots
```
**Ran.** A missing arm gives (**Book 1.98**): ``error[E0004]: non-exhaustive patterns: `None` not covered`` … `help: ensure that all possible cases are being handled by adding a match arm with a wildcard pattern or an explicit pattern as shown` … `None => todo!(),` ([output](https://github.com/rust-lang/book/blob/main/listings/ch06-enums-and-pattern-matching/no-listing-10-non-exhaustive-match/output.txt)). Its `note:` lines point into `/rustc/<hash>/library/core/src/option.rs`, which is toolchain-specific, so a check must not compare them. Sources: [Book 6.2](https://doc.rust-lang.org/book/ch06-02-match.html) · [Reference: match](https://doc.rust-lang.org/reference/expressions/match-expr.html) · [E0004](https://doc.rust-lang.org/error_codes/E0004.html)

### 3.15 `if let`, `let…else`, `while let` (and let chains)
```rust
fn parse_pair(s: &str) -> Option<(i32, i32)> {
    let Some((a, b)) = s.split_once(',') else {
        return None; // the else block must diverge
    };
    let (Ok(a), Ok(b)) = (a.trim().parse::<i32>(), b.trim().parse::<i32>()) else {
        return None;
    };
    Some((a, b))
}

fn main() {
    let config_max = Some(3u8);
    if let Some(max) = config_max {
        println!("max is {max}");
    } else {
        println!("no max");
    }
    println!("{:?} {:?}", parse_pair("4, 5"), parse_pair("oops"));
    let mut stack = vec![1, 2, 3];
    while let Some(top) = stack.pop() {
        print!("{top} ");
    }
    println!();
}
```
```text
max is 3
Some((4, 5)) None
3 2 1 
```
**Ran.** Let chains, **2024 edition only** (**Not run**: 1.78 rejects them with ``E0658: `let` expressions in this position are unstable``):
```rust
fn main() {
    let config_max = Some(3u8);
    if let Some(max) = config_max && max > 2 {
        println!("max {max} is big");
    }
}
```
```text
max 3 is big
```
Sources: [Book 6.3](https://doc.rust-lang.org/book/ch06-03-if-let.html) · [Book 19.1 `while let`](https://doc.rust-lang.org/book/ch19-01-all-the-places-for-patterns.html) · [Edition Guide: let chains](https://doc.rust-lang.org/edition-guide/rust-2024/let-chains.html) · [Reference: if-let / let-else](https://doc.rust-lang.org/reference/statements.html#let-statements)

### 3.16 Modules, `pub`, `use`, `crate`/`super`/`self`, `mod` files
Items are private to their module by default. `pub` exposes them. Paths start at `crate::` (the root), `super::` (the parent) or `self::` (the current module). `mod foo;` (no body) loads `foo.rs` or `foo/mod.rs`, which a single-file runner can't do. Lessons should use inline `mod foo { … }` and show file layout as a snippet.
```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() -> &'static str {
            "added"
        }
    }

    pub fn serve() -> String {
        format!("{} then served", self::hosting::add_to_waitlist())
    }
}

mod back_of_house {
    pub fn fix_order() -> String {
        super::front_of_house::serve() // super: the parent module
    }
}

use crate::front_of_house::hosting; // crate: the root of this crate

fn main() {
    println!("{}", hosting::add_to_waitlist());
    println!("{}", back_of_house::fix_order());
}
```
```text
added
added then served
```
**Ran.** Privacy errors (**Book 1.98**): ``E0603: module `hosting` is private`` (listing 7-3), ``E0603: function `add_to_waitlist` is private`` (7-5); a `use` in the wrong module gives ``E0433: cannot find module or crate `hosting` in this scope`` (7-12). Sources: [Book 7.2–7.5](https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html) · [Reference: modules](https://doc.rust-lang.org/reference/items/modules.html) · [paths](https://doc.rust-lang.org/reference/paths.html) · [use declarations](https://doc.rust-lang.org/reference/items/use-declarations.html)

### 3.17 `Vec<T>`
```rust
fn main() {
    let mut v: Vec<i32> = Vec::new();
    v.push(5);
    v.push(6);
    let w = vec![1, 2, 3];
    let third: &i32 = &w[2];
    println!("{third} {:?} {:?}", w.get(2), w.get(100));
    for i in &mut v {
        *i += 50;
    }
    println!("{v:?} {}", v.len());
}
```
```text
3 Some(3) None
[55, 56] 2
```
**Ran.** Holding `&v[0]` across `v.push(6)` gives E0502 (**Book 1.98**, listing 8-6). Sources: [Book 8.1](https://doc.rust-lang.org/book/ch08-01-vectors.html) · [std Vec](https://doc.rust-lang.org/std/vec/struct.Vec.html)

### 3.18 `String` vs `&str`: UTF-8, no indexing, `.chars()`
`String` is an owned, growable UTF-8 buffer; `&str` is a borrowed slice of UTF-8. `.len()` counts **bytes**. `s[0]` doesn't compile. Byte ranges must fall on char boundaries.
```rust
fn main() {
    let mut s = String::from("foo");
    s.push_str("bar");
    s.push('!');
    let s1 = String::from("Hello, ");
    let s2 = String::from("world");
    let s3 = s1 + &s2; // s1 is moved; s2 is borrowed
    let s4 = format!("{s3}-{s2}");
    let hello = "Здравствуйте";
    println!("{s} {s3} {s4}");
    println!("{} bytes, {} chars, first {:?}", hello.len(), hello.chars().count(), hello.chars().next());
    println!("{}", &hello[0..4]); // byte range: must land on char boundaries
    for c in "नमस्ते".chars().take(2) {
        print!("{c} ");
    }
    println!();
}
```
```text
foobar! Hello, world Hello, world-world
24 bytes, 12 chars, first Some('З')
Зд
न म 
```
**Ran.** From **Book 1.98**:
- ``error[E0277]: the type `str` cannot be indexed by `{integer}` `` … `= note: you can use `.chars().nth()` or `.bytes().nth()`` ([listing 8-19](https://github.com/rust-lang/book/blob/main/listings/ch08-common-collections/listing-08-19/output.txt))
- `&hello[0..1]` panics with `end byte index 1 is not a char boundary; it is inside 'З' (bytes 0..2 of string)` ([output](https://github.com/rust-lang/book/blob/main/listings/ch08-common-collections/output-only-01-not-char-boundary/output.txt))

Sources: [Book 8.2](https://doc.rust-lang.org/book/ch08-02-strings.html) · [std String](https://doc.rust-lang.org/std/string/struct.String.html)

### 3.19 `HashMap` and the entry API
```rust
use std::collections::HashMap;

fn main() {
    let text = "hello world wonderful world";
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Blue"), 25); // insert overwrites
    scores.entry(String::from("Yellow")).or_insert(50);
    scores.entry(String::from("Blue")).or_insert(50); // present: unchanged
    println!("{:?} {:?}", scores.get("Blue"), scores.get("Red"));
    let mut pairs: Vec<_> = counts.into_iter().collect();
    pairs.sort(); // HashMap iteration order is unspecified
    println!("{pairs:?}");
}
```
```text
Some(25) None
[("hello", 1), ("wonderful", 1), ("world", 2)]
```
**Ran.** Iteration order is random per run, so printing a `HashMap` directly makes a check flaky. Sort first, or use `BTreeMap`. Sources: [Book 8.3](https://doc.rust-lang.org/book/ch08-03-hash-maps.html) · [std Entry](https://doc.rust-lang.org/std/collections/hash_map/enum.Entry.html)

### 3.20 `panic!`
```rust
fn main() {
    let v = vec![1, 2, 3];
    let i = v.len() + 96;
    println!("before");
    v[i];
}
```
```text
before
thread 'main' panicked at main.rs:5:6:
index out of bounds: the len is 3 but the index is 99
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```
**Ran** (the first four lines; Miri then aborts because it can't unwind, see §5c). On 1.98 the line reads `thread 'main' (6017887) panicked at src/main.rs:4:6:` (**Book 1.98**, [listing 9-1](https://github.com/rust-lang/book/blob/main/listings/ch09-error-handling/listing-09-01/output.txt)); `panic!("crash and burn")` prints `crash and burn` on the next line ([no-listing-01](https://github.com/rust-lang/book/blob/main/listings/ch09-error-handling/no-listing-01-panic/output.txt)). Exit code 101 (**UNVERIFIED** here). Sources: [Book 9.1](https://doc.rust-lang.org/book/ch09-01-unrecoverable-errors-with-panic.html) · [Book 9.3](https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html)

### 3.21 `Result`, `?`, `unwrap`/`expect`, `Box<dyn Error>` from `main`
`?` returns the `Err` early, converting it with `From`. `main` may return `Result<(), E>` for any `E: Debug`. On `Err`, std prints `Error: {err:?}` to stderr and exits with failure (`impl Termination for Result`, [process.rs](https://github.com/rust-lang/rust/blob/stable/library/std/src/process.rs)).
```rust
use std::error::Error;
use std::num::ParseIntError;

fn parse_and_double(s: &str) -> Result<i32, ParseIntError> {
    let n: i32 = s.trim().parse()?; // on Err, return it from this function
    Ok(n * 2)
}

fn main() -> Result<(), Box<dyn Error>> {
    println!("{:?}", parse_and_double("21"));
    println!("{:?}", parse_and_double("x"));
    match parse_and_double("abc") {
        Ok(n) => println!("got {n}"),
        Err(e) => println!("error: {e}"),
    }
    let n = parse_and_double("5").expect("should be a number");
    println!("{n}");
    let bad: i32 = "zz".parse()?; // main returns Err: prints "Error: …", exit code 1
    println!("unreachable {bad}");
    Ok(())
}
```
```text
Ok(42)
Err(ParseIntError { kind: InvalidDigit })
error: invalid digit found in string
10
Error: ParseIntError { kind: InvalidDigit }
```
**Ran** (exit code 1). `?` in a `main` returning `()` gives ``E0277: the `?` operator can only be used in a function that returns `Result` or `Option` …`` (**Book 1.98**, listing 9-10). Sources: [Book 9.2](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html) · [std Termination](https://doc.rust-lang.org/std/process/trait.Termination.html) · [std Error](https://doc.rust-lang.org/std/error/trait.Error.html)

### 3.22 Generics
```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

fn main() {
    println!("{} {}", largest(&[34, 50, 25, 100, 65]), largest(&['y', 'm', 'a', 'q']));
    let p = Point { x: 3.0_f32, y: 4.0 };
    println!("{} {}", p.x(), p.distance_from_origin());
}
```
```text
100 y
3 5
```
**Ran.** Without the bound: ``E0369: binary operation `>` cannot be applied to type `&T` `` (**Book 1.98**, listing 10-5). Sources: [Book 10.1](https://doc.rust-lang.org/book/ch10-01-syntax.html) · [Reference: generic parameters](https://doc.rust-lang.org/reference/items/generics.html)

### 3.23 Traits: default methods, bounds, `where`, `impl Trait`, derivable traits, `Display`
```rust
use std::fmt;

trait Summary {
    fn author(&self) -> String;
    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.author()) // default method
    }
}

struct Tweet {
    username: String,
    content: String,
}

impl Summary for Tweet {
    fn author(&self) -> String {
        format!("@{}", self.username)
    }
}

impl fmt::Display for Tweet {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}: {}", self.username, self.content)
    }
}

fn notify(item: &impl Summary) -> String {
    format!("Breaking! {}", item.summarize()) // impl Trait in argument position
}

fn loud<T>(item: &T) -> String
where
    T: Summary + fmt::Display, // where clause, two bounds
{
    item.to_string().to_uppercase() // to_string comes from Display
}

fn make() -> impl Summary {
    Tweet { username: String::from("rust"), content: String::from("1.98 is out") }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Default)]
struct Id(u32);

fn main() {
    let t = Tweet { username: String::from("ferris"), content: String::from("hi") };
    println!("{}", notify(&t));
    println!("{t}");
    println!("{}", loud(&t));
    println!("{}", make().summarize());
    println!("{:?} {}", Id::default(), Id(1) < Id(2));
}
```
```text
Breaking! (Read more from @ferris...)
ferris: hi
FERRIS: HI
(Read more from @rust...)
Id(0) true
```
**Ran.** The derivable traits are listed in Book Appendix C: `Debug`, `PartialEq`, `Eq`, `PartialOrd`, `Ord`, `Clone`, `Copy`, `Hash`, `Default`. Sources: [Book 10.2](https://doc.rust-lang.org/book/ch10-02-traits.html) · [Appendix C](https://doc.rust-lang.org/book/appendix-03-derivable-traits.html) · [Reference: traits](https://doc.rust-lang.org/reference/items/traits.html) · [trait bounds](https://doc.rust-lang.org/reference/trait-bounds.html) · [std Display](https://doc.rust-lang.org/std/fmt/trait.Display.html)

### 3.24 Lifetimes: `'a`, elision rules, `'static`
Lifetime annotations relate the lifetimes of references; they don't extend anything. The three **elision rules** ([Book 10.3](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html#lifetime-elision)):
1. Each reference parameter gets its own lifetime.
2. If there is exactly one input lifetime, every output gets it.
3. If one input is `&self` or `&mut self`, outputs get `self`'s lifetime.
```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

struct Excerpt<'a> {
    part: &'a str, // a struct holding a reference needs a lifetime
}

impl<'a> Excerpt<'a> {
    fn announce(&self, note: &str) -> &str {
        println!("Attention: {note}"); // elision rule 3: output borrows from &self
        self.part
    }
}

fn first_word(s: &str) -> &str {
    s.split(' ').next().unwrap_or("") // elision rule 2: one input, so output gets its lifetime
}

fn main() {
    let s1 = String::from("long string is long");
    let result;
    {
        let s2 = String::from("xyz");
        result = longest(s1.as_str(), s2.as_str()).to_string(); // copy out before s2 dies
    }
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first = novel.split('.').next().unwrap();
    let e = Excerpt { part: first };
    let part = e.announce("hi");
    let st: &'static str = "lives for the whole program";
    println!("{result} | {part} | {} | {st}", first_word("hello world"));
}
```
```text
Attention: hi
long string is long | Call me Ishmael | hello | lives for the whole program
```
**Ran.** Errors (**Book 1.98**):
- `longest` without `'a` gives ``E0106: missing lifetime specifier`` (listing 10-20).
- Keeping the `&str` result past `s2` gives ``E0597: `string2` does not live long enough`` (10-23).
- Returning a reference to a local gives ``E0515: cannot return value referencing local variable `result` `` (no-listing-09).

Sources: [Book 10.3](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html) · [Reference: lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html) · [E0597](https://doc.rust-lang.org/error_codes/E0597.html)

### 3.25 Closures: capture modes, `move`, `Fn`/`FnMut`/`FnOnce`
A closure captures by `&`, `&mut` or by value, choosing the least it needs. `move` forces by-value capture. Every closure implements `FnOnce`. Those that don't move a captured value out also implement `FnMut`. Those that also don't mutate what they capture implement `Fn` ([Book 13.1](https://doc.rust-lang.org/book/ch13-01-closures.html)).
```rust
use std::thread;

fn apply<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 {
    f(x)
}

fn call_twice<F: FnMut()>(mut f: F) {
    f();
    f();
}

fn consume<F: FnOnce() -> String>(f: F) -> String {
    f()
}

fn main() {
    let offset = 10;
    let add = |x: i32| x + offset; // borrows offset: Fn
    let mut count = 0;
    call_twice(|| count += 1); // mutably borrows count: FnMut
    let name = String::from("ferris");
    let greeting = consume(move || name + "!"); // moves name in, then out: FnOnce only
    let list = vec![1, 2, 3];
    let handle = thread::spawn(move || format!("{list:?}")); // move: the thread owns list
    println!("{} {count} {greeting} {}", apply(add, 5), handle.join().unwrap());
}
```
```text
15 2 ferris! [1, 2, 3]
```
**Ran.** Errors (**Book 1.98**):
- ``E0507: cannot move out of `value`, a captured variable in an `FnMut` closure`` (listing 13-8)
- `thread::spawn` without `move` gives ``E0373: closure may outlive the current function, but it borrows `v` …`` (16-3)

Sources: [Book 13.1](https://doc.rust-lang.org/book/ch13-01-closures.html) · [Reference: closure types](https://doc.rust-lang.org/reference/types/closure.html)

### 3.26 Iterators: `Iterator`, `next`, adapters, laziness
"In Rust, iterators are *lazy*, meaning they have no effect until you call methods that consume the iterator" ([Book 13.2](https://doc.rust-lang.org/book/ch13-02-iterators.html)).
```rust
struct Counter {
    count: u32,
}

impl Iterator for Counter {
    type Item = u32;
    fn next(&mut self) -> Option<Self::Item> {
        if self.count < 5 {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}

fn main() {
    let v = vec![1, 2, 3];
    let mut it = v.iter();
    println!("{:?} {:?}", it.next(), it.next());
    let doubled: Vec<i32> = v.iter().map(|x| x * 2).collect();
    let evens: Vec<&i32> = v.iter().filter(|x| **x % 2 == 0).collect();
    for (i, x) in v.iter().enumerate() {
        print!("{i}:{x} ");
    }
    println!();
    let total: u32 = Counter { count: 0 }
        .zip(Counter { count: 0 }.skip(1))
        .map(|(a, b)| a * b)
        .filter(|x| x % 3 == 0)
        .sum();
    let product = v.iter().fold(1, |acc, x| acc * x);
    let lazy = v.iter().map(|x| {
        println!("never printed");
        x
    }); // adapters are lazy: nothing runs until consumed
    drop(lazy);
    println!("{doubled:?} {evens:?} {total} {product}");
}
```
```text
Some(1) Some(2)
0:1 1:2 2:3 
[2, 4, 6] [2] 18 6
```
**Ran.** An unused `v.iter().map(...)` gets the warning "unused `Map` that must be used … iterators are lazy and do nothing unless consumed" (Book 13.2). Sources: [Book 13.2](https://doc.rust-lang.org/book/ch13-02-iterators.html) · [std Iterator](https://doc.rust-lang.org/std/iter/trait.Iterator.html)

### 3.27 Smart pointers: `Box`, `Deref`, `Drop`, `Rc`, `RefCell`, `Weak`
```rust
use std::cell::RefCell;
use std::ops::Deref;
use std::rc::{Rc, Weak};

enum List {
    Cons(i32, Box<List>), // Box gives the recursive type a known size
    Nil,
}
use List::{Cons, Nil};

fn sum(list: &List) -> i32 {
    match list {
        Cons(v, rest) => v + sum(rest),
        Nil => 0,
    }
}

struct MyBox<T>(T);

impl<T> Deref for MyBox<T> {
    type Target = T;
    fn deref(&self) -> &T {
        &self.0
    }
}

struct Noisy(&'static str);

impl Drop for Noisy {
    fn drop(&mut self) {
        println!("drop {}", self.0);
    }
}

struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,
    children: RefCell<Vec<Rc<Node>>>,
}

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Nil))));
    let x = MyBox(5);
    println!("{} {}", sum(&list), *x + 1); // *x is *(x.deref())
    let shared = Rc::new(RefCell::new(vec![1]));
    let a = Rc::clone(&shared);
    a.borrow_mut().push(2); // mutate through a shared Rc: RefCell checks borrows at runtime
    println!("{:?} strong={}", shared.borrow(), Rc::strong_count(&shared));
    let leaf = Rc::new(Node { value: 3, parent: RefCell::new(Weak::new()), children: RefCell::new(vec![]) });
    let branch = Rc::new(Node { value: 5, parent: RefCell::new(Weak::new()), children: RefCell::new(vec![Rc::clone(&leaf)]) });
    *leaf.parent.borrow_mut() = Rc::downgrade(&branch); // Weak: no ownership, no cycle
    println!(
        "leaf parent = {:?}, branch children = {}, leaf = {}",
        leaf.parent.borrow().upgrade().map(|p| p.value),
        branch.children.borrow().len(),
        leaf.value
    );
    let _a = Noisy("a");
    {
        let _b = Noisy("b");
    }
    println!("end of main");
}
```
```text
3 6
[1, 2] strong=2
leaf parent = Some(5), branch children = 1, leaf = 3
drop b
end of main
drop a
```
**Ran.** Book-recorded runs (**Book 1.98**):
- Reverse drop order: `CustomSmartPointers created` / `Dropping … other stuff` / `Dropping … my stuff` (listing 15-14).
- `Rc::strong_count` 1 → 2 → 3 → 2 (15-19).

Errors: a recursive enum without `Box` gives ``E0072: recursive type `List` has infinite size`` (15-3); calling `.drop()` directly gives ``E0040: explicit use of destructor method`` (15-15); two `borrow_mut()`s at once panic at runtime (`already borrowed`, 15-23). Sources: [Book 15.1–15.6](https://doc.rust-lang.org/book/ch15-00-smart-pointers.html) · [std Box](https://doc.rust-lang.org/std/boxed/struct.Box.html) · [Deref](https://doc.rust-lang.org/std/ops/trait.Deref.html) · [Drop](https://doc.rust-lang.org/std/ops/trait.Drop.html) · [RefCell](https://doc.rust-lang.org/std/cell/struct.RefCell.html) · [Weak](https://doc.rust-lang.org/std/rc/struct.Weak.html)

### 3.28 Concurrency: `thread::spawn`, `join`, `move`, `mpsc`, `Mutex`, `Arc`, `Send`/`Sync`, `thread::scope`
```rust
use std::sync::{mpsc, Arc, Mutex};
use std::thread;

fn main() {
    let handle = thread::spawn(|| (1..=4).sum::<i32>());
    println!("sum from thread: {}", handle.join().unwrap());

    let (tx, rx) = mpsc::channel();
    for id in 0..3 {
        let tx = tx.clone();
        thread::spawn(move || tx.send(id * 10).unwrap());
    }
    drop(tx); // drop the last sender so the receiving loop ends
    let mut got: Vec<i32> = rx.iter().collect();
    got.sort();
    println!("received {got:?}");

    let counter = Arc::new(Mutex::new(0));
    let handles: Vec<_> = (0..10)
        .map(|_| {
            let counter = Arc::clone(&counter);
            thread::spawn(move || *counter.lock().unwrap() += 1)
        })
        .collect();
    for h in handles {
        h.join().unwrap();
    }
    println!("counter = {}", *counter.lock().unwrap());

    let mut data = vec![1, 2, 3];
    thread::scope(|s| {
        s.spawn(|| println!("scoped thread sees {data:?}")); // borrows, no move needed
    });
    data.push(4); // the borrow ended with the scope
    println!("{data:?}");
}
```
```text
sum from thread: 10
received [0, 10, 20]
counter = 10
scoped thread sees [1, 2, 3]
[1, 2, 3, 4]
```
**Ran** (Miri emulates threads). Interleaving is nondeterministic on real hardware, so checks should sort or aggregate, as above. Errors (**Book 1.98**):
- Sending through `Rc` gives ``E0277: `Rc<std::sync::Mutex<i32>>` cannot be sent between threads safely`` (listing 16-14).
- Using a moved `counter` gives ``E0382: borrow of moved value: `counter` `` (16-13).
- Using `val` after `send` gives ``E0382: borrow of moved value: `val` `` (16-9).

`thread::scope` is stable since 1.63 and not covered by the Book ([std](https://doc.rust-lang.org/std/thread/fn.scope.html)). Sources: [Book 16.1–16.4](https://doc.rust-lang.org/book/ch16-00-concurrency.html) · [std mpsc](https://doc.rust-lang.org/std/sync/mpsc/index.html) · [Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html) · [Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html) · [Send](https://doc.rust-lang.org/std/marker/trait.Send.html) · [Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html)

### 3.29 async/await: what's std, what needs an executor
std has `async fn`/`async {}`/`.await` syntax (the language) and the `Future`, `Poll`, `Context`, `Waker` and `pin!` types. It has **no executor**: "Most languages that support async bundle a runtime, but Rust does not" ([Book 17.1](https://doc.rust-lang.org/book/ch17-01-futures-and-syntax.html)). The Book uses `trpl::block_on`/`trpl::run`, backed by tokio. A std-only demo can poll a future once with `Waker::noop()` (stable 1.85):
```rust
use std::future::Future;
use std::pin::pin;
use std::task::{Context, Poll, Waker};

async fn add(a: i32, b: i32) -> i32 {
    a + b
}

async fn run() -> i32 {
    let x = add(1, 2).await;
    x * 10
}

fn main() {
    let mut fut = pin!(run()); // calling an async fn does nothing until the future is polled
    let mut cx = Context::from_waker(Waker::noop()); // Waker::noop: stable since 1.85
    match fut.as_mut().poll(&mut cx) {
        Poll::Ready(v) => println!("ready: {v}"),
        Poll::Pending => println!("pending"),
    }
}
```
```text
ready: 30
```
**Not run** (1.78 lacks `Waker::noop`: `E0658 use of unstable library feature 'noop_waker'`). Anything with timers, I/O, `join`, `spawn` or streams needs `trpl` or tokio, which the local runner can't download (no network in the sandbox). Those examples become `rust-snippet`, or run on the Playground via a deep link (it ships `trpl`). Sources: [Book ch. 17](https://doc.rust-lang.org/book/ch17-00-async-await.html) · [std Future](https://doc.rust-lang.org/std/future/trait.Future.html) · [Reference: await](https://doc.rust-lang.org/reference/expressions/await-expr.html) · [keyword async](https://doc.rust-lang.org/std/keyword.async.html)

### 3.30 Trait objects: `dyn Trait`
```rust
trait Draw {
    fn draw(&self) -> String;
}

struct Button {
    label: String,
}

struct SelectBox {
    options: Vec<String>,
}

impl Draw for Button {
    fn draw(&self) -> String {
        format!("[{}]", self.label)
    }
}

impl Draw for SelectBox {
    fn draw(&self) -> String {
        format!("<{}>", self.options.join("|"))
    }
}

fn main() {
    let components: Vec<Box<dyn Draw>> = vec![
        Box::new(Button { label: String::from("OK") }),
        Box::new(SelectBox { options: vec![String::from("Yes"), String::from("No")] }),
    ];
    for c in &components {
        println!("{}", c.draw()); // dynamic dispatch through a vtable
    }
    let d: &dyn Draw = &Button { label: String::from("ref") };
    println!("{}", d.draw());
}
```
```text
[OK]
<Yes|No>
[ref]
```
**Ran.** Putting in a type that doesn't implement the trait gives ``E0277: the trait bound `String: Draw` is not satisfied`` (**Book 1.98**, listing 18-10). 1.98.0 had a vtable miscompilation, fixed in 1.98.1 (§4). Sources: [Book 18.2](https://doc.rust-lang.org/book/ch18-02-trait-objects.html) · [Reference: trait objects](https://doc.rust-lang.org/reference/types/trait-object.html)

### 3.31 Patterns: ranges, `|`, `@`, guards, nested destructuring
```rust
struct Point {
    x: i32,
    y: i32,
}

enum Shape {
    Circle { center: Point, r: u32 },
    Rect(Point, Point),
}

fn classify(n: i32) -> &'static str {
    match n {
        i32::MIN..=-1 => "negative",
        0 => "zero",
        1 | 2 | 3 => "small",
        x if x % 2 == 0 => "big even", // match guard
        _ => "big odd",
    }
}

fn main() {
    for n in [-5, 0, 2, 10, 11] {
        print!("{} ", classify(n));
    }
    println!();
    let msg_id = 7;
    match msg_id {
        id @ 3..=7 => println!("id in range: {id}"), // @ binds while testing
        other => println!("other: {other}"),
    }
    let shapes = [
        Shape::Circle { center: Point { x: 0, y: 0 }, r: 2 },
        Shape::Rect(Point { x: 0, y: 0 }, Point { x: 3, y: 4 }),
    ];
    for s in &shapes {
        match s {
            Shape::Circle { center: Point { x, y }, r } => println!("circle at ({x},{y}) r={r}"),
            Shape::Rect(Point { x: x1, y: y1 }, Point { x: x2, y: y2 }) => {
                println!("rect {}x{}", x2 - x1, y2 - y1)
            }
        }
    }
    let ((a, b), Point { x, .. }) = ((1, 2), Point { x: 9, y: 0 });
    println!("{a} {b} {x}");
}
```
```text
negative zero small big even big odd 
id in range: 7
circle at (0,0) r=2
rect 3x4
1 2 9
```
**Ran.** `let Some(x) = opt;` gives ``E0005: refutable pattern in local binding`` (**Book 1.98**, listing 19-8). An `if let` guard (`Some(x) if let Ok(y) = f(x) =>`) is 1.95+ ([blog](https://blog.rust-lang.org/2026/04/16/Rust-1.95.0/)). Sources: [Book 19.1–19.3](https://doc.rust-lang.org/book/ch19-03-pattern-syntax.html) · [Reference: patterns](https://doc.rust-lang.org/reference/patterns.html)

### 3.32 `macro_rules!`
```rust
macro_rules! square {
    ($x:expr) => {
        $x * $x
    };
}

macro_rules! my_vec {
    ( $( $x:expr ),* $(,)? ) => {{
        let mut v = Vec::new();
        $( v.push($x); )*
        v
    }};
}

macro_rules! max {
    ($x:expr) => { $x };
    ($x:expr, $($rest:expr),+) => {{
        let a = $x;
        let b = max!($($rest),+);
        if a > b { a } else { b }
    }};
}

fn main() {
    println!("{}", square!(2 + 3)); // $x is one expression: (2 + 3) * (2 + 3)
    println!("{:?}", my_vec![1, 2, 3,]);
    println!("{}", max!(3, 9, 4));
}
```
```text
25
[1, 2, 3]
9
```
**Ran.** In the 2024 edition, the `expr` fragment also matches `const {}` and `_` expressions ([Edition Guide: macro fragment specifiers](https://doc.rust-lang.org/edition-guide/rust-2024/macro-fragment-specifiers.html)). That's irrelevant to these examples. Sources: [Book 20.5](https://doc.rust-lang.org/book/ch20-05-macros.html) · [Reference: macros by example](https://doc.rust-lang.org/reference/macros-by-example.html) · [RBE macro_rules!](https://doc.rust-lang.org/rust-by-example/macros.html)

### 3.33 `unsafe` basics
The five unsafe superpowers are listed in [Book 20.1](https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html): dereference a raw pointer, call an unsafe function, access or modify a mutable static, implement an unsafe trait, and access union fields. The 2024 edition changes three things here:
- `unsafe_op_in_unsafe_fn` warns, so write `unsafe {}` blocks inside `unsafe fn`.
- References to `static mut` are denied: use `&raw const`/`&raw mut`.
- `extern` blocks must be written `unsafe extern`.

See the [Edition Guide](https://doc.rust-lang.org/edition-guide/rust-2024/index.html).
```rust
static mut COUNTER: u32 = 0;

unsafe fn read(p: *const i32) -> i32 {
    unsafe { *p } // 2024 edition: unsafe ops inside an unsafe fn still need a block
}

fn add_to_count(inc: u32) {
    unsafe {
        COUNTER += inc;
    }
}

fn main() {
    let mut num = 5;
    let r1 = &raw const num; // creating raw pointers is safe
    let r2 = &raw mut num;
    unsafe {
        *r2 += 1; // dereferencing them is not
        println!("{}", read(r1));
    }
    add_to_count(3);
    println!("{}", unsafe { *(&raw const COUNTER) });
}
```
```text
6
3
```
**Not run** as written: 1.78 rejects `&raw` with E0658. The same program using `std::ptr::addr_of!`/`addr_of_mut!` **Ran** and printed `6` / `3`. Calling an unsafe fn outside `unsafe` gives ``E0133: call to unsafe function `dangerous` is unsafe and requires unsafe block`` (**Book 1.98**). The Book's listing 20-11 uses exactly `*(&raw const COUNTER)`. Sources: [Book 20.1](https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html) · [Reference: unsafety](https://doc.rust-lang.org/reference/unsafety.html) · [Edition Guide: static mut references](https://doc.rust-lang.org/edition-guide/rust-2024/static-mut-references.html)

### 3.34 `#[test]`, `assert_eq!`, `cargo test`
```rust
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

fn main() {
    println!("{}", add(2, 2));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(add(2, 2), 4);
    }

    #[test]
    #[should_panic(expected = "overflow")]
    fn overflows() {
        add(u64::MAX, 1);
    }
}
```
`cargo test` for the Book's `adder` (**Book 1.98**, [listing 11-1](https://github.com/rust-lang/book/blob/main/listings/ch11-writing-automated-tests/listing-11-01/output.txt)):
```text
running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```
Under Miri with `--test`: `test tests::it_works ... ok` **Ran**. `overflows` (`#[should_panic]`) **aborted the harness**, because Miri-wasm can't unwind. The expected result on real rustc, `test tests::overflows - should panic ... ok`, is **UNVERIFIED** here. `rustc --test` builds the same harness without Cargo. Sources: [Book 11.1](https://doc.rust-lang.org/book/ch11-01-writing-tests.html) · [11.2](https://doc.rust-lang.org/book/ch11-02-running-tests.html) · [Reference: testing attributes](https://doc.rust-lang.org/reference/attributes/testing.html) · [cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html)

### 3.35 Cargo basics
- `cargo new hello_cargo` creates `Cargo.toml` and `src/main.rs`, plus a git repo.
- `cargo build` builds into `target/debug/`; `cargo build --release` builds into `target/release/`.
- `cargo run` builds and runs.
- `cargo check` type-checks without producing a binary; it's "much faster than `cargo build`".

([Book 1.3](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html)). The generated manifest:
```toml
[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2024"

[dependencies]
```
The `edition` key selects the language edition per crate ([Cargo manifest](https://doc.rust-lang.org/cargo/reference/manifest.html)). Not runnable in a single-file runner; show it as a snippet, and use the local runner's `rustc --edition 2024`.

---

## 4. What's new in 1.90–1.98

One line per item that a beginner course might teach or should avoid. From the release posts on [blog.rust-lang.org/releases](https://blog.rust-lang.org/releases/) and [RELEASES.md](https://github.com/rust-lang/rust/blob/master/RELEASES.md).

**Baseline (before 1.90, still relevant):**
- 1.85: the 2024 edition is stable ([blog](https://blog.rust-lang.org/2025/02/20/Rust-1.85.0/)); `Waker::noop` too (`#[stable(since = "1.85.0")]`, [wake.rs](https://github.com/rust-lang/rust/blob/stable/library/core/src/task/wake.rs)).
- 1.88: **let chains** (`if let … && let … && cond`), 2024 edition only ([blog](https://blog.rust-lang.org/2025/06/26/Rust-1.88.0/)). Teach them, but only because the course pins 2024.
- 1.89: warn-by-default `mismatched_lifetime_syntaxes` lint (RELEASES.md 1.89.0). Learners who write `fn f(x: &str) -> &'_ str`-style mixes will see it.

| Version (date) | Item | Course impact |
|---|---|---|
| [1.90](https://blog.rust-lang.org/2025/09/18/Rust-1.90.0/) (2025-09-18) | LLD is the default linker on `x86_64-unknown-linux-gnu`; `u{n}::checked_sub_signed` / `wrapping_sub_signed` / `saturating_sub_signed`; x86_64-apple-darwin demoted to Tier 2 with host tools | Faster Linux links for the local runner. Intel Macs still work. |
| [1.91](https://blog.rust-lang.org/2025/10/30/Rust-1.91.0/) (2025-10-30) | **Panic messages print the thread ID** (RELEASES.md); `dangling_pointers_from_locals` warning; `{integer}::strict_add`/`strict_sub`/… (panic on overflow in *every* build mode); `Duration::from_mins`/`from_hours`; `core::iter::chain` | Checks must ignore the `(NNN)` in `thread 'main' (NNN) panicked`. `strict_*` could join the overflow lesson next to `checked_*`/`wrapping_*`. |
| [1.92](https://blog.rust-lang.org/2025/12/11/Rust-1.92.0/) (2025-12-11) | Never-type fallback lints deny-by-default; `unused_must_use` no longer warns on `Result<(), Infallible>`; `RwLockWriteGuard::downgrade`; `btree_map::Entry::insert_entry` | None for beginners. |
| [1.93](https://blog.rust-lang.org/2026/01/22/Rust-1.93.0/) (2026-01-22) | `std::fmt::from_fn`; `<[T]>::as_array`; `VecDeque::pop_front_if`/`pop_back_if`; `String/Vec::into_raw_parts` | Avoid them: too new for a beginner course. |
| [1.94](https://blog.rust-lang.org/2026/03/05/Rust-1.94.0/) (2026-03-05) | `<[T]>::array_windows` (length inferred from a destructuring pattern); `LazyLock::get`; `Peekable::next_if_map`; Cargo config `include`; TOML 1.1 in Cargo; Unicode 17 | `array_windows` is a nice iterator example; mark it "1.94+". |
| [1.95](https://blog.rust-lang.org/2026/04/16/Rust-1.95.0/) (2026-04-16) | **`if let` guards in `match` arms**: `Some(x) if let Ok(y) = f(x) => …` (not counted for exhaustiveness); `cfg_select!`; `Vec::push_mut`; `bool: TryFrom<{integer}>` | Teach the guard form in the patterns lesson, flagged "1.95+". |
| [1.96](https://blog.rust-lang.org/2026/05/28/Rust-1.96.0/) (2026-05-28) | **`assert_matches!`/`debug_assert_matches!`** (not in the prelude: `use std::assert_matches;`); new `core::range::{Range, RangeInclusive, …}` types that are `Copy` (range *syntax* still makes the legacy types); wasm targets no longer pass `--allow-undefined` | `assert_matches!` suits checks and the testing lesson. Don't teach the new range types yet: syntax still produces the old ones "until a future edition". |
| [1.97](https://blog.rust-lang.org/2026/07/09/Rust-1.97.0/) (2026-07-09) | v0 symbol mangling by default; `CARGO_BUILD_WARNINGS=allow\|deny`; **linker messages shown as a `linker_messages` warning**; allow-by-default `dead_code_pub_in_binary`; `isolate_highest_one`, `bit_width` | The local runner may see new `warning: linker stderr: …` lines on some platforms. Filter or allow them. |
| [1.98](https://blog.rust-lang.org/2026/08/20/Rust-1.98.0/) (2026-08-20) | `{fN}::algebraic_add/…`; `{integer}::format_into` + `core::fmt::NumBuffer`; `str::substr_range`; `str::strip_circumfix`; `String::from_utf16le/be` | Not for beginners. |
| [1.98.1](https://blog.rust-lang.org/2026/09/03/Rust-1.98.1/) (2026-09-03) | Fixes a vtable miscompilation (null function pointer) from 1.98.0 | Pin **≥ 1.98.1** if lessons use `dyn Trait`. |

Point releases 1.91.1, 1.93.1, 1.94.1, 1.96.1 and 1.97.1 only fixed regressions and CVEs. 1.94.1 fixed `std::thread::spawn` on `wasm32-wasip1-threads`.

---

## 5. Runtime options for running learner code

ThongLearn runs no code on its own server, and the website never calls the learner's machine ([ADR-0002](../../../docs/adr/0002-browser-runtimes.md), [runtimes.md](../../../docs/runtimes.md)).

### (a) Local runner: the learner's own `rustc`

How it would plug in: add `"rust"` to `LOCAL_COURSES` in `lib/local-runner.ts` and give it a `runRust()` like `runDart()`, running inside the existing OS sandbox (`lib/sandbox.ts`, [ADR-0001](../../../docs/adr/0001-local-runner.md)).

- **Plain `rustc`, not `cargo`, for single-file lessons.** Run `rustc --edition 2024 main.rs -o main` and then `./main`. `--edition` is required because the default is 2015 ([rustc CLI](https://doc.rust-lang.org/rustc/command-line-arguments.html)). `cargo` needs a `Cargo.toml` and a `target/` directory, and adds a resolver step. It only helps for lessons with dependencies, which can't fetch anyway (the sandbox has no network).
- **Compile time: UNVERIFIED on our hardware.** The only sourced numbers are the Book's recorded `cargo run` outputs for its small listings: `Finished … in 0.08s–1.57s`, **median 0.30 s over 126 listings** (`grep "in N.NNs" listings/*/*/output.txt`, [book repo](https://github.com/rust-lang/book/tree/main/listings)). The machine isn't stated. The C++ ADR measured ~0.7 s for a local `c++`. Expect the same order, but measure.
- **Toolchain paths the sandbox must read.** rustup installs proxies in `$HOME/.cargo/bin` ([rustup install docs](https://github.com/rust-lang/rustup/blob/master/doc/user-guide/src/installation/index.md)). Toolchains live under `RUSTUP_HOME` (default `~/.rustup`), and `CARGO_HOME` (default `~/.cargo`) holds cargo's caches. `rustc`/`cargo` are rustup *proxies* ([proxies](https://github.com/rust-lang/rustup/blob/master/doc/user-guide/src/concepts/proxies.md)).
  - Today `initSandbox` denies all of `$HOME` except `toolchainRoots()`, `~/.pub-cache` and `~/.tool-versions`. Its `ENV_KEYS` allowlist has no `RUSTUP_HOME`/`CARGO_HOME`/`RUSTUP_TOOLCHAIN` (`lib/sandbox.ts`).
  - Suggested: resolve `rustc --print sysroot` **once, outside the sandbox** (the same trick `findLaunchers()` uses for Dart). Then call `<sysroot>/bin/rustc` directly and allow reading only that sysroot. That skips the proxy, which may want to read `~/.rustup/settings.toml` or write lock and temp files (**UNVERIFIED**).
  - The linker also has to be readable and executable. On macOS rustc calls `cc` from the Xcode Command Line Tools (the Book says to run `xcode-select --install`, [1.1](https://doc.rust-lang.org/book/ch01-01-installation.html)). That lives outside `$HOME`, so it's readable already. Whether `sandbox-exec` lets `ld` write the output file into the run's temp dir should be fine, since writes go to the run dir (**UNVERIFIED**).
- **How a check could work.** Two std-only designs:
  1. *Output checks*, mirroring C++. Rename the learner's `fn main` to `fn lesson_main` (same lines, so diagnostics keep their line numbers). Then compile a wrapper whose `main` runs `lesson_main` with stdout captured and then runs the check body. **Catch:** std has **no stable way to capture `println!`** in-process (the test harness's capture is internal), so a check can't see output that way. The practical route: run the program once and hand its stdout to a second binary. Compile `main.rs` plus an appended `#[cfg(test)] mod thonglearn_check { use super::*; #[test] fn check() { let output = include_str!(env!("OUT")); … } }` with `rustc --edition 2024 --test main.rs`. `--test` "will ignore your main function and instead produce a test harness" ([rustc CLI](https://doc.rust-lang.org/rustc/command-line-arguments.html)). Run the result, report the verdict with the `@@thonglearn-check ` stderr marker, and use `assert_eq!`/`assert!`/`assert_matches!` (1.96) for `expect`. Cost: **two compiles per Check.**
  2. *Function checks* (most lessons). The appended `#[cfg(test)]` module calls the learner's functions and types directly, with no output involved. One `rustc --test` compile, and panics unwind normally.

  A panicking check prints `thread 'check' (NNN) panicked at …`. Strip the thread ID before showing it (see §4, 1.91).
- **Fidelity:** exact, since it's the learner's toolchain. The lesson should require ≥ 1.88 for let chains and ≥ 1.95 if it uses `if let` guards. `rustc --version` can gate this.
- **Cost of the choice:** as with Dart and Flutter, Rust lessons are **write-only on the website**. `npm run check:content -- --record rust` would store real outputs for the website to display (ADR-0002 already does this for Dart).

### (b) Rust Playground API

Source: [rust-lang/rust-playground](https://github.com/rust-lang/rust-playground) (MIT/Apache-2.0, last commit 2026-09-04). It's an Axum backend with Docker per request.

- **Endpoints** ([server_axum.rs](https://github.com/rust-lang/rust-playground/blob/main/ui/src/server_axum.rs)): `POST /execute`, `/compile`, `/format`, `/clippy`, `/miri`, `/macro-expansion`, `/evaluate.json` (the legacy mdBook API), `GET /meta/versions`, `/meta/crates`, and a `/websocket`.
- **`/execute` request** (`ExecuteRequest`, [public_http_api.rs](https://github.com/rust-lang/rust-playground/blob/main/ui/src/public_http_api.rs)): `{ "channel": "stable", "mode": "debug", "edition": "2024", "crateType": "bin", "tests": false, "backtrace": false, "code": "fn main(){…}" }`. `code` can be a string or a list of files. **Response:** `{ "success": bool, "exitDetail": string, "stdout": string, "stderr": string }`. `/evaluate.json`: `{version, optimize, code, edition, tests}` → `{result, error}`.
- **CORS:** open to any origin. See §1 "Surprises" for the live preflight headers and the source.
- **Limits** (source): each HTTP job is wrapped in `tokio::time::timeout(DOCKER_PROCESS_TIMEOUT_SOFT)` = **10 s** for compile plus run. Containers run with `--net none --memory 512m --memory-swap 640m --pids-limit 512 --cap-drop=ALL` ([coordinator.rs](https://github.com/rust-lang/rust-playground/blob/main/compiler/base/orchestrator/src/coordinator.rs)). The README says there is no network and no disk quota.
- **Crates:** the top 100 crates by downloads, plus Rust Cookbook crates and their dependencies ([README](https://github.com/rust-lang/rust-playground/blob/main/README.md)), plus `trpl`, `async-trait` and `sptr` ([crate-modifications.toml](https://github.com/rust-lang/rust-playground/blob/main/top-crates/crate-modifications.toml)). So the Book's async chapter and `rand` would run there (whether `rand` is in the current top list is **UNVERIFIED**).
- **Rate limits: none documented. UNVERIFIED** whether nginx or CloudFront throttles. The public reverse-proxy config in the repo (for play.integer32.com) has no `limit_req`.
- **Terms of use / third-party embedding: none published.** The README has no API or usage section, and [rust-lang.org/policies](https://www.rust-lang.org/policies) lists Code of Conduct, Licenses, Logo, Security and Privacy, with nothing on the Playground. Issue [#409 "develop an API tool for integrating with third-party apps"](https://github.com/rust-lang/rust-playground/issues/409) has been open since 2018. There, the maintainer replied: "Plenty of resources already make use of the Playground. For example, the Rust homepage and book run code and Rustlings links to the playground." That is tolerance, not permission, so **UNVERIFIED** whether a third-party course may call `/execute` at scale.
- **Deep links** (no API call): `https://play.rust-lang.org/?version=stable&mode=debug&edition=2024&code=<urlencoded>`. `?code=` is documented on the Playground's help page ([Help.tsx](https://github.com/rust-lang/rust-playground/blob/main/ui/frontend/Help.tsx)), and `version`/`mode`/`edition` come from its router ([Router.tsx](https://github.com/rust-lang/rust-playground/blob/main/ui/frontend/Router.tsx)).
- **Fidelity:** exact (stable 1.98.1, 2024 edition, real rustc and LLVM).
- **Fit with our rules:** this is the Compiler Explorer situation from `online-execution-research.md`: CORS-open, accurate, "no stated third-party policy". C++ didn't take it.

### (c) Miri in the browser (rubri, browser_wasi_shim)

- **What it is.** [rubri](https://github.com/LyonSyonII/rubri) (MIT, 83 stars) is "a proof-of-concept wrapper for Miri that runs in the browser". It runs a **Miri built for `wasm32-wasi`** from bjorn3's `compile_rustc_for_wasm` rustc branch ([miri#722 comment](https://github.com/rust-lang/miri/issues/722#issuecomment-1960849880), [build notes](https://github.com/rust-lang/miri/issues/722#issuecomment-1961278711)). It runs under `browser_wasi_shim` in a Web Worker. Miri *interprets* MIR, so no linker is needed. That is the whole trick: a real `rustc` in WASI "doesn't have a builtin linker", and [browser_wasi_shim's rustc.html](https://github.com/bjorn3/browser_wasi_shim/blob/main/examples/rustc.html) says its "failure to invoke the linker at the end is expected".
- **Version:** the shipped `miri.opt.1718474653.wasm` reports **`rustc 1.78.0-dev`** (measured: `miri --sysroot /sysroot -vV`). Its sysroot rlibs are from the release tagged `1.78-dev` (2024-09-07). Rustc 1.78 predates the 2024 edition (1.85), so these fail with E0658: **let chains, `&raw const`/`&raw mut`, `Waker::noop`**. `if let` guards (1.95), `assert_matches!` (1.96) and everything else in §4 are missing too.
- **Download size**, measured from the repo's `example/public/wasm-rustc`:

  | Artifact | Raw | gzip | brotli -9 |
  |---|---|---|---|
  | `miri.opt.….wasm` | 47.2 MB | 17.4 MB (repo `.gz`); **15.2 MB as served** by garriga.dev (GitHub Pages `content-encoding: gzip`) | 10.6 MB |
  | sysroot, all 27 files the worker loads (incl. a 10.7 MB `libstd-….so`) | 109.1 MB | 42.1 MB (repo `.gz` files) | 31.2 MB |
  | sysroot minus `.so`, `libtest`, `libproc_macro`, `libgetopts`, `libunicode_width` (programs still ran; `--test` needs `libtest`) | 89.7 MB | – | 24.8 MB |
  | **Total** | ~156 MB | **~57–59 MB** as served | **~35–42 MB** |

  That is **1.5–1.8× the C++ clang toolchain (~23 MB brotli, ADR-0003)** and ~4× PHP.
- **Speed**, measured in Node 23.7 on this Mac via browser_wasi_shim, so a browser's numbers are **UNVERIFIED**:
  - Compiling the wasm module took ~50 ms (lazy tier-up). Building the in-memory sysroot took ~80–140 ms.
  - The first program took 300–385 ms. Later small programs took **30–160 ms** each, including type-check and borrow-check.
  - It is slow at runtime: 2,000 `println!`s took **1.9 s** (rubri's README: "between 2 and 3 seconds"); a 1,000,000-iteration arithmetic loop took **5.8 s**; a sieve to 20,000 took 1.2 s.
  - Rubri disables every Miri check (`-Zmiri-disable-stacked-borrows`, `-validation`, the data-race detector, …) to go faster ([interpreter.ts](https://github.com/LyonSyonII/rubri/blob/main/example/src/interpreter/interpreter.ts)).
- **What doesn't work** (measured unless linked):
  - **Unwinding.** `panic!` prints its message and then aborts with a long Miri backtrace (`can't call foreign function _Unwind_RaiseException`). With `-Cpanic=abort` it's shorter but still a Miri "abnormal termination" dump. So `#[should_panic]` tests abort the harness (seen with `--test`), and `catch_unwind` can't work.
  - Anything Miri doesn't support: networking, FFI, most platform APIs ([Miri README](https://github.com/rust-lang/miri/blob/master/README.md)). Rubri adds "multiple files, using crates, input/output operations" ([README](https://github.com/LyonSyonII/rubri/blob/main/README.md)).
  - Threads, channels, `Mutex`, `Arc` and `thread::scope` **did** run (Miri emulates threads).
- **Diagnostics differ from 1.98.** The same E0382 program on 1.78 says ``has type `std::string::String` `` (1.98: `` `String` ``), underlines at column 15 not 16, and adds a macro-expansion note. It also adds `unused variable` warnings that the Book's output omits. Since compile errors *are* the teaching material in the ownership lessons, this matters.
- **Maintenance:** rubri's last code commit was 2025-05-20 (repo pushed 2025-11-19). browser_wasi_shim (MIT OR Apache-2.0) had its last commit 2026-02-03 (v0.4.2). miri#722 "Compilation to WASM?" is **still open** (since 2019). There is **no official, maintained wasm build of rustc or Miri**. Rebuilding for 1.98 means owning a rustc fork build, which is the same kind of cost ADR-0003 names for a libc++ with exceptions.
- browser_wasi_shim also has an experimental `threads/examples/wasi_multi_threads_rustc` that runs **rustc with LLVM plus `wasm-ld`** (from the `oligamiq/rust_wasm` submodule) and targets `wasm32-wasip1-threads`. Its README says it "requires `cross-origin isolation`… Firefox failed to run the demo". Size, version and viability are **UNVERIFIED**, and it is not a primary Rust-project source.

### (d) Official rustc for wasm as a host

- [Platform support](https://doc.rust-lang.org/rustc/platform-support.html): `wasm32-wasip1`, `wasm32-wasip1-threads`, `wasm32-wasip2`, `wasm32-unknown-unknown` and `wasm32-unknown-emscripten` are **Tier 2 *without* host tools**; `wasm32-wasip3` is Tier 3. The 1.98.1 channel manifest ships `rust-std` for those targets but **no `rustc`, `cargo` or `miri-preview` package for any wasm32 target** (checked `[pkg.rustc.target.wasm32*]` in `channel-rust-stable.toml`). Rust can compile *to* wasm but does not ship a compiler that runs *on* wasm.
- The [`wasm32-wasip1-threads` page](https://doc.rust-lang.org/rustc/platform-support/wasm32-wasip1-threads.html): "This target is not a stable target"; testing is "not well supported".
- Nothing else credible was found in the allowed primary sources.

### Recommendation

**Run Rust through the local runner (a), keep it write-only on the website with recorded outputs, and add an "Open in Playground" deep link (b, URL only) to every runnable example.** Don't adopt rubri (c) now.

Reasoning:
1. **Fidelity is the point of a Rust course.** A third of the plan (ownership, borrowing, lifetimes, match exhaustiveness) teaches *through* compiler errors. The only in-browser option is rustc 1.78-dev. It has the wrong edition (let chains, `&raw` and 2024 unsafe rules are missing), different error text, and panics that turn into Miri abort dumps. C++'s wasm clang had one gap (exceptions) that a wrapper could route around. Miri's gaps can't be worked around: the edition, the error text, and panics as a lesson topic.
2. **Size.** 35–42 MB brotli (57–59 MB as served) against clang's 23 MB, which ADR-0003 already calls "the heaviest runtime in the app".
3. **Maintenance.** Rubri has been dormant since May 2025, and upgrading means building a rustc fork. clang had a pinned, published npm package (`@yowasp/clang`); Rust has no equivalent.
4. **The Playground is the only exact option on the website**, but it's a third-party backend with no published terms or rate limits. Calling `/execute` for every Run and Check would repeat the Compiler Explorer and DartPad decisions this project already declined. Deep links cost nothing and hand the learner to the official tool. **If** the team wants website runs later, ask the Rust infrastructure team first (issue #409 is the place). The integration itself is small: CORS is open, and the JSON shape is above.
5. **Upgrade path:** revisit if miri#722 lands an official wasm build, or if a maintained `rustc`-on-WASI package appears.

The local-runner work: `runRust()` in `lib/local-runner.ts`, a `toolchainRoots()` entry for the rustc sysroot in `lib/sandbox.ts`, the §5(a) check harness, and `--record` for website outputs.

---

## 6. Proposed curriculum for ThongLearn

The plan holds up against the Book, and the Book, RBE and Rustlings all put these topics in almost the same order (§2.4). Suggested adjustments:

1. **Move `printing-and-formatting` to lesson 2.** Every later example and check uses `println!`, and inline args (`{x}`) appear from Book 3.1 on. The Book has no formatting chapter, so base the lesson on `std::fmt` and RBE 1.2.
2. **Move `testing` from group 6 to the end of group 5**, after lifetimes. That matches Book ch. 11 (after ch. 10) and Rustlings (17_tests after 16_lifetimes), and learners meet `assert_eq!` before the checks rely on it.
3. **Keep `modules` in group 6, but inline-only.** The runner is single-file, so `mod foo;` plus a file is a snippet. The Book puts modules at ch. 7 (before collections) and Rustlings at 10. Moving it to group 4 is also defensible.
4. **Optional addition, `conversions`** (`From`/`Into`/`TryFrom`/`as`, and how `?` uses `From`): Rustlings 23_conversions and RBE "Conversion" cover it, the Book doesn't. It fits after `result-and-question-mark` or in group 5.
5. **Left out on purpose:** async (needs `trpl`/tokio, so guide only), Book ch. 2 guessing game (needs `rand` plus stdin), ch. 12 I/O project (args, files, env), ch. 14 Cargo/crates.io, and ch. 21 web server (a TCP socket, and the sandbox has no network). All are guide material or snippets.

### 6.1 Lessons

"E-codes" lists the compile errors a lesson uses as teaching material, with exact 1.98 text in the Book's `output.txt` (§3). Those lessons need a runner that shows **real, current** rustc diagnostics: the local runner, or the Playground via a link. The Book assumes 2024-edition idioms throughout, and the Rustlings column shows its matching folder.

| # | Lesson | Book | Reference / std link | E-codes / runtime errors taught | Crates? |
|---|---|---|---|---|---|
| **1 · Basics** |
| 1 | hello-cargo | [1.2–1.3](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html), [3.4 comments](https://doc.rust-lang.org/book/ch03-04-comments.html) | [Crates and source files](https://doc.rust-lang.org/reference/crates-and-source-files.html) · [Comments](https://doc.rust-lang.org/reference/comments.html) | – | no (Cargo commands are snippets) |
| 2 | printing-and-formatting | (none; RBE [1.2](https://doc.rust-lang.org/rust-by-example/hello/print.html)) | [std::fmt](https://doc.rust-lang.org/std/fmt/index.html) | E0277 "doesn't implement `std::fmt::Display`" (Book 5-11) | no |
| 3 | variables | [3.1](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html) | [let statements](https://doc.rust-lang.org/reference/statements.html#let-statements) · [constant items](https://doc.rust-lang.org/reference/items/constant-items.html) · [static items](https://doc.rust-lang.org/reference/items/static-items.html) | **E0384**; E0308 (shadowing vs `mut` type change) | no |
| 4 | scalar-types | [3.2](https://doc.rust-lang.org/book/ch03-02-data-types.html) | [Numeric types](https://doc.rust-lang.org/reference/types/numeric.html) · [Textual types](https://doc.rust-lang.org/reference/types/textual.html) · [Type cast](https://doc.rust-lang.org/reference/expressions/operator-expr.html#type-cast-expressions) | E0284 "type annotations needed" (`parse`); overflow **panic** | no |
| 5 | tuples-and-arrays | [3.2 Compound](https://doc.rust-lang.org/book/ch03-02-data-types.html#compound-types) | [Tuple](https://doc.rust-lang.org/reference/types/tuple.html) · [Array](https://doc.rust-lang.org/reference/types/array.html) | index out of bounds **panic** | no |
| 6 | functions | [3.3](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html) | [Functions](https://doc.rust-lang.org/reference/items/functions.html) · [Block expressions](https://doc.rust-lang.org/reference/expressions/block-expr.html) | **E0308** (trailing `;`) | no |
| 7 | control-flow | [3.5](https://doc.rust-lang.org/book/ch03-05-control-flow.html) | [if](https://doc.rust-lang.org/reference/expressions/if-expr.html) · [Loops](https://doc.rust-lang.org/reference/expressions/loop-expr.html) | E0308 (non-bool condition; `if`/`else` types) | no |
| **2 · Ownership** |
| 8 | ownership | [4.1](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html) | [Destructors](https://doc.rust-lang.org/reference/destructors.html) · [`Copy`](https://doc.rust-lang.org/reference/special-types-and-traits.html#copy) | **E0382** | no |
| 9 | borrowing | [4.2](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html) | [Pointer types](https://doc.rust-lang.org/reference/types/pointer.html) | **E0499, E0502, E0106, E0596** | no |
| 10 | slices | [4.3](https://doc.rust-lang.org/book/ch04-03-slices.html) | [Slice types](https://doc.rust-lang.org/reference/types/slice.html) | **E0502** (`clear` while borrowed) | no |
| **3 · Structs & Enums** |
| 11 | structs | [5.1–5.2](https://doc.rust-lang.org/book/ch05-01-defining-structs.html) | [Structs](https://doc.rust-lang.org/reference/items/structs.html) · [derive](https://doc.rust-lang.org/reference/attributes/derive.html) | E0277 (no `Debug`/`Display`), E0106 (`&str` field) | no |
| 12 | methods | [5.3](https://doc.rust-lang.org/book/ch05-03-method-syntax.html) | [Implementations](https://doc.rust-lang.org/reference/items/implementations.html) · [Associated items](https://doc.rust-lang.org/reference/items/associated-items.html) | – | no |
| 13 | enums-and-option | [6.1](https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html) | [Enumerations](https://doc.rust-lang.org/reference/items/enumerations.html) · [std Option](https://doc.rust-lang.org/std/option/enum.Option.html) | E0277 (`i8 + Option<i8>`) | no |
| 14 | match | [6.2](https://doc.rust-lang.org/book/ch06-02-match.html) | [match](https://doc.rust-lang.org/reference/expressions/match-expr.html) | **E0004** | no |
| 15 | if-let-and-let-else | [6.3](https://doc.rust-lang.org/book/ch06-03-if-let.html) | [let statements (let-else)](https://doc.rust-lang.org/reference/statements.html#let-statements) · [Edition Guide: let chains](https://doc.rust-lang.org/edition-guide/rust-2024/let-chains.html) | E0005 (refutable `let`) | no; let chains need 2024 edition (1.88+) |
| **4 · Collections & Errors** |
| 16 | vectors | [8.1](https://doc.rust-lang.org/book/ch08-01-vectors.html) | [std Vec](https://doc.rust-lang.org/std/vec/struct.Vec.html) | E0502 (push while borrowed), OOB **panic** | no |
| 17 | strings | [8.2](https://doc.rust-lang.org/book/ch08-02-strings.html) | [std String](https://doc.rust-lang.org/std/string/struct.String.html) · [str](https://doc.rust-lang.org/std/primitive.str.html) | **E0277** (`s[0]`), char-boundary **panic** | no |
| 18 | hash-maps | [8.3](https://doc.rust-lang.org/book/ch08-03-hash-maps.html) | [std HashMap](https://doc.rust-lang.org/std/collections/struct.HashMap.html) · [Entry](https://doc.rust-lang.org/std/collections/hash_map/enum.Entry.html) | – (checks must not depend on iteration order) | no |
| 19 | panic | [9.1](https://doc.rust-lang.org/book/ch09-01-unrecoverable-errors-with-panic.html), [9.3](https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html) | [std panic!](https://doc.rust-lang.org/std/macro.panic.html) | **panic output** (thread ID since 1.91) | no |
| 20 | result-and-question-mark | [9.2](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html) | [`?` (try propagation)](https://doc.rust-lang.org/reference/expressions/operator-expr.html#the-try-propagation-expression) · [Termination](https://doc.rust-lang.org/std/process/trait.Termination.html) | **E0277** (`?` in `()` main) | no (file I/O in the Book's examples → use `parse` instead) |
| **5 · Generics & Traits** |
| 21 | generics | [10.1](https://doc.rust-lang.org/book/ch10-01-syntax.html) | [Generic parameters](https://doc.rust-lang.org/reference/items/generics.html) | **E0369**, E0308 (listing 10-7) | no |
| 22 | traits | [10.2](https://doc.rust-lang.org/book/ch10-02-traits.html), [App. C](https://doc.rust-lang.org/book/appendix-03-derivable-traits.html) | [Traits](https://doc.rust-lang.org/reference/items/traits.html) · [Trait bounds](https://doc.rust-lang.org/reference/trait-bounds.html) | E0277 (unsatisfied bound) | no |
| 23 | lifetimes | [10.3](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html) | [Lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html) | **E0106, E0597, E0515** | no |
| 24 | closures | [13.1](https://doc.rust-lang.org/book/ch13-01-closures.html) | [Closure types](https://doc.rust-lang.org/reference/types/closure.html) | **E0507**, E0308 (13-3) | no |
| 25 | iterators | [13.2](https://doc.rust-lang.org/book/ch13-02-iterators.html) | [std::iter](https://doc.rust-lang.org/std/iter/index.html) · [Iterator](https://doc.rust-lang.org/std/iter/trait.Iterator.html) | `unused_must_use` warning (lazy adapters) | no |
| (26) | testing *(moved here)* | [11.1–11.3](https://doc.rust-lang.org/book/ch11-01-writing-tests.html) | [Testing attributes](https://doc.rust-lang.org/reference/attributes/testing.html) | failing-test output | no |
| **6 · Going further** |
| 27 | modules | [7.1–7.5](https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html) | [Modules](https://doc.rust-lang.org/reference/items/modules.html) · [Paths](https://doc.rust-lang.org/reference/paths.html) · [use](https://doc.rust-lang.org/reference/items/use-declarations.html) | **E0603, E0433** | no (file modules are snippets) |
| 28 | smart-pointers | [15.1–15.6](https://doc.rust-lang.org/book/ch15-00-smart-pointers.html) | [std Box](https://doc.rust-lang.org/std/boxed/struct.Box.html) · [Rc](https://doc.rust-lang.org/std/rc/struct.Rc.html) · [RefCell](https://doc.rust-lang.org/std/cell/struct.RefCell.html) | **E0072, E0614, E0040**, E0596, `already borrowed` **panic** | no |
| 29 | threads | [16.1–16.4](https://doc.rust-lang.org/book/ch16-00-concurrency.html) | [std::thread](https://doc.rust-lang.org/std/thread/index.html) · [std::sync](https://doc.rust-lang.org/std/sync/index.html) | **E0373, E0382, E0277** (`Rc` not `Send`) | no |
| 30 | trait-objects | [18.2](https://doc.rust-lang.org/book/ch18-02-trait-objects.html) | [Trait objects](https://doc.rust-lang.org/reference/types/trait-object.html) | E0277 | no |
| 31 | patterns | [19.1–19.3](https://doc.rust-lang.org/book/ch19-03-pattern-syntax.html) | [Patterns](https://doc.rust-lang.org/reference/patterns.html) | E0005, E0308 (19-2) | no; `if let` guards 1.95+ |
| 32 | macros | [20.5](https://doc.rust-lang.org/book/ch20-05-macros.html) | [Macros by example](https://doc.rust-lang.org/reference/macros-by-example.html) | – | no (procedural macros need a separate proc-macro crate, so snippet only) |

**E-code-dependent lessons** (the error *is* the lesson): 3, 6, 8, 9, 10, 14, 17, 20, 21, 23, 24, 27, 28 and 29. These can't honestly run on rubri's 1.78 build (different text, 2015/2021 semantics).

**Need crates** (can't run offline or in the sandbox): none of the 32 lessons as scoped. Only the excluded material needs them: async (`trpl`/tokio), the guessing game (`rand`), and serde-style examples.

### 6.2 Guide book (12 chapters)

| # | Chapter | Primary sources | Runnable? |
|---|---|---|---|
| 1 | how-rust-builds | Book [1.1–1.3](https://doc.rust-lang.org/book/ch01-00-getting-started.html), [14.1 release profiles](https://doc.rust-lang.org/book/ch14-01-release-profiles.html), [App. D](https://doc.rust-lang.org/book/appendix-04-useful-development-tools.html), [App. E editions](https://doc.rust-lang.org/book/appendix-05-editions.html), [App. G nightly](https://doc.rust-lang.org/book/appendix-07-nightly-rust.html); [rustc CLI](https://doc.rust-lang.org/rustc/command-line-arguments.html); [Cargo profiles](https://doc.rust-lang.org/cargo/reference/profiles.html) | Mostly snippets (debug vs release overflow is a good "Behind the scenes") |
| 2 | types-and-inference | Book [3.2](https://doc.rust-lang.org/book/ch03-02-data-types.html); [Reference: types](https://doc.rust-lang.org/reference/types.html); [Type layout](https://doc.rust-lang.org/reference/type-layout.html) | Yes; E0284/E0282 "type annotations needed" |
| 3 | ownership-model | Book [ch. 4](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html); RBE [RAII](https://doc.rust-lang.org/rust-by-example/scope/raii.html), [move](https://doc.rust-lang.org/rust-by-example/scope/move.html); [Destructors](https://doc.rust-lang.org/reference/destructors.html) | Yes (E-codes) |
| 4 | borrowing-and-lifetimes | Book [4.2](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html), [10.3](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html); [Lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html); Edition Guide [RPIT capture rules](https://doc.rust-lang.org/edition-guide/rust-2024/rpit-lifetime-capture.html) | Yes (E-codes) |
| 5 | structs-enums-patterns | Book [5](https://doc.rust-lang.org/book/ch05-00-structs.html), [6](https://doc.rust-lang.org/book/ch06-00-enums.html), [19](https://doc.rust-lang.org/book/ch19-00-patterns.html); [Patterns](https://doc.rust-lang.org/reference/patterns.html) | Yes |
| 6 | traits-and-generics | Book [10](https://doc.rust-lang.org/book/ch10-00-generics.html), [18](https://doc.rust-lang.org/book/ch18-00-oop.html), [20.2 advanced traits](https://doc.rust-lang.org/book/ch20-02-advanced-traits.html), [20.3](https://doc.rust-lang.org/book/ch20-03-advanced-types.html); [Traits](https://doc.rust-lang.org/reference/items/traits.html) | Yes |
| 7 | error-handling | Book [9](https://doc.rust-lang.org/book/ch09-00-error-handling.html), [12.3](https://doc.rust-lang.org/book/ch12-03-improving-error-handling-and-modularity.html); [std::error](https://doc.rust-lang.org/std/error/trait.Error.html); [From](https://doc.rust-lang.org/std/convert/trait.From.html) | Yes (std only; skip `thiserror`/`anyhow` or show as snippets) |
| 8 | collections-and-strings | Book [8](https://doc.rust-lang.org/book/ch08-00-common-collections.html); [std::collections](https://doc.rust-lang.org/std/collections/index.html) | Yes |
| 9 | iterators-and-closures | Book [13](https://doc.rust-lang.org/book/ch13-00-functional-features.html), [20.4](https://doc.rust-lang.org/book/ch20-04-advanced-functions-and-closures.html); [std::iter](https://doc.rust-lang.org/std/iter/index.html) | Yes |
| 10 | smart-pointers | Book [15](https://doc.rust-lang.org/book/ch15-00-smart-pointers.html) | Yes |
| 11 | concurrency-and-async | Book [16](https://doc.rust-lang.org/book/ch16-00-concurrency.html), [17](https://doc.rust-lang.org/book/ch17-00-async-await.html); [thread::scope](https://doc.rust-lang.org/std/thread/fn.scope.html); [Future](https://doc.rust-lang.org/std/future/trait.Future.html) | Threads yes. **Async: only the std-only `Waker::noop` poll demo (§3.29) runs.** Everything with `trpl`/tokio is a snippet plus a Playground link |
| 12 | unsafe-macros-and-idioms | Book [20.1](https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html), [20.5](https://doc.rust-lang.org/book/ch20-05-macros.html); Edition Guide 2024 [unsafe_op_in_unsafe_fn](https://doc.rust-lang.org/edition-guide/rust-2024/unsafe-op-in-unsafe-fn.html), [static mut refs](https://doc.rust-lang.org/edition-guide/rust-2024/static-mut-references.html), [unsafe extern](https://doc.rust-lang.org/edition-guide/rust-2024/unsafe-extern.html); [Unsafety](https://doc.rust-lang.org/reference/unsafety.html); RBE [Unsafe](https://doc.rust-lang.org/rust-by-example/unsafe.html) | Yes, except FFI (`extern "C"` needs linking to C, so a snippet); Miri-style UB demos can't be *shown* safely in a normal build |

---

## 7. Sources

**Rust project, releases**
- Release posts 1.90–1.98.1: https://blog.rust-lang.org/releases/ (individual posts linked in §4); 1.85 https://blog.rust-lang.org/2025/02/20/Rust-1.85.0/ ; 1.88 https://blog.rust-lang.org/2025/06/26/Rust-1.88.0/
- RELEASES.md: https://github.com/rust-lang/rust/blob/master/RELEASES.md
- Stable channel manifest: https://static.rust-lang.org/dist/channel-rust-stable.toml
- Platform support: https://doc.rust-lang.org/rustc/platform-support.html ; https://doc.rust-lang.org/rustc/platform-support/wasm32-wasip1-threads.html
- rustc CLI: https://doc.rust-lang.org/rustc/command-line-arguments.html
- std sources: https://github.com/rust-lang/rust/blob/stable/library/std/src/process.rs ; https://github.com/rust-lang/rust/blob/stable/library/core/src/task/wake.rs

**Curriculum**
- The Book (online, stable): https://doc.rust-lang.org/book/ ; title page https://doc.rust-lang.org/stable/book/title-page.html
- The Book repo (SUMMARY, listings with recorded outputs, `trpl`): https://github.com/rust-lang/book (commit `1500248`, 2026-09-02) ; https://raw.githubusercontent.com/rust-lang/book/main/src/SUMMARY.md
- Rust by Example: https://doc.rust-lang.org/rust-by-example/ ; https://raw.githubusercontent.com/rust-lang/rust-by-example/master/src/SUMMARY.md
- Rustlings: https://github.com/rust-lang/rustlings (`rustlings-macros/info.toml`, `exercises/README.md`, `Cargo.toml`, `exercises/24_async/`)
- Reference: https://doc.rust-lang.org/reference/ · std: https://doc.rust-lang.org/std/ · Edition Guide: https://doc.rust-lang.org/edition-guide/ (SUMMARY: https://raw.githubusercontent.com/rust-lang/edition-guide/master/src/SUMMARY.md) · Error index: https://doc.rust-lang.org/error_codes/ · Cargo: https://doc.rust-lang.org/cargo/
- rustup user guide: https://github.com/rust-lang/rustup/tree/master/doc/user-guide/src

**Runtimes**
- Rust Playground: https://github.com/rust-lang/rust-playground (`ui/src/server_axum.rs`, `ui/src/public_http_api.rs`, `compiler/base/orchestrator/src/coordinator.rs`, `deployment/`, `top-crates/crate-modifications.toml`, `ui/frontend/Help.tsx`, `ui/frontend/Router.tsx`, commit `e8d43a4`, 2026-09-04); issue #409 https://github.com/rust-lang/rust-playground/issues/409 ; live preflight to https://play.rust-lang.org/execute (2026-09-25)
- Rust policies page: https://www.rust-lang.org/policies
- Miri: https://github.com/rust-lang/miri (README); wasm issue https://github.com/rust-lang/miri/issues/722
- rubri: https://github.com/LyonSyonII/rubri (README, `example/src/interpreter/interpreter.ts`, `example/public/wasm-rustc/`, release `1.78-dev`); deployed https://garriga.dev/rubri/
- browser_wasi_shim: https://github.com/bjorn3/browser_wasi_shim (README, `examples/rustc.html`, `threads/README.md`, `threads/examples/wasi_multi_threads_rustc/`)

**This repo**
- `docs/adr/0001-local-runner.md`, `0002-browser-runtimes.md`, `0003-cpp-in-the-browser.md`; `docs/runtimes.md`; `lib/local-runner.ts`; `lib/sandbox.ts`; `.design/thonglearn/research/online-execution-research.md`

## Still UNVERIFIED
- Local `rustc` compile time on our hardware (only the Book's recorded `cargo` times: median 0.30 s).
- Whether the rustup proxy works inside our sandbox with `~/.rustup` read-only. Calling the sysroot's `rustc` directly avoids the question.
- Playground rate limits and whether heavy third-party `/execute` use is acceptable (no published terms).
- Miri-wasm speed in a real browser (measured only in Node) and on phones.
- Exit code 101 for panics, and `#[should_panic]` output, on real 1.98 (not run here).
- Every §3 program's output on rustc **1.98.1 / 2024 edition**. They ran on 1.78-dev / 2021, and three were not run at all.

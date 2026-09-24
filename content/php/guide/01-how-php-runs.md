---
title: How PHP runs your code
section: Guide Book
summary: From the text you type to opcodes a virtual machine executes — and why every request starts from nothing.
---
PHP does not read your file line by line like a person would. Each time a script runs it goes through a short pipeline, and knowing that pipeline explains a surprising number of "why does PHP do that?" moments.

```text
your text ──► tokens ──► syntax tree (AST) ──► opcodes ──► Zend Virtual Machine
 "$x = 1;"   T_VARIABLE  Assign($x, 1)        ASSIGN        runs them, one
             = T_LNUMBER                                    instruction at a time
```

## 1. Lexing: cutting text into tokens

The lexer walks your source and emits **tokens**: variables, operators, numbers, strings, and — uniquely for PHP — the open and close tags that separate code from the text around it.

`PhpToken::tokenize()` gives you the exact list the engine builds.

```php
<?php

$src = '<?php $total = $price * 2;';

foreach (PhpToken::tokenize($src) as $t) {
    printf("%-14s %s\n", $t->getTokenName(), trim($t->text));
}
```

> 🔍 **Behind the scenes: everything outside `<?php` is a token too**
>
> A PHP file is a *template* first and a program second. Anything outside `<?php … ?>` becomes a single `T_INLINE_HTML` token that the compiler turns into "echo this text". That is why a stray blank line after a closing `?>` shows up in your output, and why the closing tag is omitted in files that contain only PHP — there is nothing to switch back to.

## 2. Parsing: building a syntax tree

The parser checks the grammar and builds an **Abstract Syntax Tree** — a tree of what your code *means* rather than how it was typed. A `ParseError` is raised here, before a single statement runs, which is why a missing semicolon on line 50 stops line 1 from ever executing.

The AST itself is internal, but reflection lets you see the structures the compiler produced from it.

```php
<?php

function area(int $w, int $h): int {
    return $w * $h;
}

$r = new ReflectionFunction('area');

echo $r->getName(), " takes ", $r->getNumberOfParameters(), " parameters\n";
foreach ($r->getParameters() as $p) {
    echo "  \$", $p->getName(), ' : ', $p->getType(), "\n";
}
echo 'returns: ', $r->getReturnType(), "\n";
```

## 3. Compiling: turning the tree into opcodes

The compiler walks the tree and produces **opcodes**: compact instructions for an imaginary machine. Every function, method and file becomes an *op array* — the opcodes plus the literals and variable slots they use.

Compiling is not free, and the result is the same every time the file is unchanged. That is what **OPcache** is for: it keeps compiled op arrays in shared memory so steps 1–3 are skipped on later runs.

```php
<?php

$status = opcache_get_status();

echo 'OPcache enabled: ', var_export(is_array($status), true), "\n";
echo 'scripts cached: ', is_array($status) ? count($status['scripts'] ?? []) : 0, "\n";
```

> 🔍 **Behind the scenes: why opcodes and not machine code?**
>
> Opcodes are portable — the same compiled script runs on any CPU the Zend VM was built for. The VM is a loop in C that fetches an opcode, executes a handler for it, and repeats. Since PHP 8 there is also a **JIT**: for long-running numeric work the VM can hand hot op arrays to a compiler that emits real machine code. For typical request-response web code the JIT changes little, because the time goes to I/O rather than to the VM loop.

## 4. Running: the Zend VM

The VM executes the opcodes against a **stack frame** per function call. Values live in slots called *zvals*, each carrying a type tag alongside the value — which is how a single `$x` can hold an int now and a string later.

```php
<?php

$x = 1;
var_dump($x);

$x = "one";
var_dump($x);

$x = [1, 'one'];
var_dump($x);
```

## 5. Then it all goes away

The step that surprises people coming from other languages: when the script finishes, **everything is destroyed**. Variables, objects, loaded classes, the whole compiled program state. The next request starts from an empty slate.

This is PHP's *shared-nothing* model. It is why PHP has no "global state between users" bugs by default, and why anything that must outlive a request — sessions, caches, uploads — has to be written somewhere outside PHP: a session file, a database, Redis, disk.

```php
<?php

$counter = 0;

function bump(): int {
    static $calls = 0;   // survives calls...
    return ++$calls;
}

echo bump(), bump(), bump(), "\n";   // 123 — within one run
echo "…and the next run starts at 1 again\n";
```

> 🧭 **Scenario:** A colleague asks why a value they set in one request is missing in the next. Nothing is broken — that is the model. Put it in `$_SESSION`, a cache or a database, and reload it each request.

## Where the code actually runs

The same pipeline runs wherever PHP lives, but what wraps it differs. That wrapper is called a **SAPI** (Server API):

| SAPI | Used for |
| --- | --- |
| `cli` | scripts you run in a terminal — and the runtime in this course |
| `fpm-fcgi` | PHP-FPM behind nginx or Apache, the usual production setup |
| `apache2handler` | PHP embedded in Apache |
| `embed` | PHP inside another program |

```php
<?php

echo 'PHP ', PHP_VERSION, ' on the ', PHP_SAPI, " SAPI\n";
echo 'int size: ', PHP_INT_SIZE, " bytes\n";
echo 'max int:  ', PHP_INT_MAX, "\n";
```

In this course PHP runs as a WebAssembly build of the CLI SAPI, inside your browser. No server sees your code.

**Reference:** [PHP tags](https://www.php.net/manual/en/language.basic-syntax.phptags.php) and [Runtime Configuration](https://www.php.net/manual/en/opcache.configuration.php) in the PHP Manual.

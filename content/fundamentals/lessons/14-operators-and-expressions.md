---
title: Operators and expressions
section: 4 · Building blocks
---

An **operator** is a symbol that does something with values, like `+` adds two numbers. An **expression** is any piece of code that works out to a value, like `2 + 3`.

---

## Maths operators

| Operator | Does                     | Example   | Result |
| -------- | ------------------------ | --------- | ------ |
| `+`      | add                      | `7 + 2`   | `9`    |
| `-`      | subtract                 | `7 - 2`   | `5`    |
| `*`      | multiply                 | `7 * 2`   | `14`   |
| `/`      | divide                   | `7 / 2`   | `3.5`  |
| `//`     | divide, whole part only  | `7 // 2`  | `3`    |
| `%`      | remainder after dividing | `7 % 2`   | `1`    |
| `**`     | power                    | `7 ** 2`  | `49`   |

```python
print(7 + 2)
print(7 * 2)
print(7 ** 2)
```

> 📝 **Note:** Computers use `*` for multiply (not ×) and `/` for divide (not ÷), because those are easy to type.

---

## Three ways to divide

`/` always gives a decimal (a `float`), even when the answer is whole:

```python
print(8 / 4)
print(7 / 2)
```

That shows `2.0` and `3.5`.

`//` and `%` are a pair. Share 17 sweets between 5 friends:

```python
print(17 // 5)  # sweets each
print(17 % 5)   # sweets left over
```

Each friend gets `3`, and `2` are left over. `%` is great for questions like "is this number even?": if `n % 2` is 0, it is.

---

## Order of operations

Like in maths, some operators go first:

1. `( )` brackets first
2. `**` powers
3. `*`, `/`, `//`, `%`
4. `+`, `-`

Operators on the same level go left to right.

```python
print(2 + 3 * 4)
print((2 + 3) * 4)
```

The first shows `14` (multiply first: 3 × 4 = 12, then 2 + 12). The second shows `20`, because the brackets go first.

> 💡 **Tip:** If you're not sure which goes first, add brackets. They make your meaning clear to the computer **and** to people.

---

## Comparing values

**Comparison operators** ask a question. The answer is always `True` or `False`:

| Operator | Asks                        | Example   | Result  |
| -------- | --------------------------- | --------- | ------- |
| `==`     | equal to?                   | `5 == 5`  | `True`  |
| `!=`     | not equal to?               | `5 != 5`  | `False` |
| `<`      | less than?                  | `3 < 5`   | `True`  |
| `>`      | greater than?               | `3 > 5`   | `False` |
| `<=`     | less than or equal to?      | `5 <= 5`  | `True`  |
| `>=`     | greater than or equal to?   | `4 >= 5`  | `False` |

```python
age = 12
print(age >= 13)
print(age == 12)
```

> ⚠️ **Gotcha:** One `=` **stores** a value (`age = 12`). Two `==` **asks** whether two values are equal (`age == 12`). Mixing them up is one of the most common beginner mistakes.

---

## Joining text

`+` also works on text: it glues two pieces together. `*` repeats text:

```python
first = "Ada"
print("Hello, " + first + "!")
print("ha" * 3)
```

This shows `Hello, Ada!` and `hahaha`. Notice the space inside `"Hello, "`: `+` adds nothing extra.

You can't `+` text and a number together:

```python
print("Age: " + 12)  # error! TypeError: can only concatenate str (not "int") to str
```

Turn the number into text first: `"Age: " + str(12)`.

---

## Expressions work out to a value

An expression is like a little question the computer answers. Big expressions get worked out one small step at a time:

```text
(2 + 3) * 4
   5    * 4
       20
```

Anywhere you can use a value, you can use an expression instead: inside `print`, on the right of `=`, or inside another expression.

```python
price = 4
count = 3
print(price * count + 1)
```

> 📝 **Note:** Most of these operators are the same in nearly every language. A few differ: JavaScript has no `//`, so it writes `Math.floor(17 / 5)` instead, and it usually checks equality with `===`.

## Challenge

> 🎯 **Challenge:** Two pizzas have 16 slices. Share them between 5 friends: print how many slices **each** friend gets on the first line, and how many are **left over** on the second. Use `//` and `%`.

```python starter
slices = 2 * 8
friends = 5
# print slices each, then slices left over
```

```python solution
slices = 2 * 8
friends = 5
print(slices // friends)
print(slices % friends)
```

```python check
lines = __stdout__.strip().splitlines()
assert len(lines) == 2, "Print 2 lines: slices each, then slices left over."
assert lines[0] == "3", "Line 1 should be 3 (16 // 5), but was " + repr(lines[0])
assert lines[1] == "1", "Line 2 should be 1 (16 % 5), but was " + repr(lines[1])
```

**Reference:** [Python tutorial: Numbers](https://docs.python.org/3/tutorial/introduction.html#numbers)

```quiz
? easy: What does this show?
~~~python
print(10 - 4)
~~~
+ 6
- 14
- 10 - 4
- 104
> `-` subtracts: 10 - 4 is 6.
? easy: What does `5 > 2` work out to?
+ `True`
- `False`
- `3`
- `7`
> A comparison always gives `True` or `False`. 5 is greater than 2, so it's `True`.
? medium: What does this show?
~~~python
print(2 + 3 * 4)
~~~
+ 14
- 20
- 24
- 9
> Multiplication goes before addition: 3 × 4 = 12, then 2 + 12 = 14.
? medium: What does this show?
~~~python
print(10 / 2)
print(10 // 3)
~~~
+ 5.0\n3
- 5\n3
- 5.0\n3.3333333333333335
- 5\n3.0
> `/` always gives a float, so 10 / 2 is `5.0`. `//` keeps only the whole part: 10 // 3 is `3`.
? hard: What does this show?
~~~python
n = 14
print(n % 4)
print("n" + "=" + str(n))
~~~
+ 2\nn=14
- 3\nn=14
- 2\n14=14
- 3.5\nn = 14
> 14 ÷ 4 is 3 remainder 2, so `%` gives 2. `"n"` is text, not the variable, and `+` adds no spaces, so the second line is `n=14`.
```

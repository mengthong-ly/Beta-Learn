---
title: Variables
section: 4 · Building blocks
---

A **variable** is a name for a value. It lets your program remember something and use it again later, just by saying its name.

---

## Giving a value a name

You create a variable with `=`. The name goes on the left, the value on the right:

```python
age = 12
name = "Mia"
print(name)
print(age)
```

After `age = 12`, writing `age` anywhere means "the value called `age`", which is `12`.

> ⚠️ **Gotcha:** `print(age)` shows `12`. `print("age")` shows the word `age`. Quotes make text; no quotes means "look up this name".

---

## A label, not a box

People often picture a variable as a **box** with a label on it, holding a value. That's a fine way to start.

In Python it's a little more accurate to picture a **name tag** tied to a value:

```text
age  ──►  12
name ──►  "Mia"
```

The name doesn't hold the value inside it; it **refers to** it. That's why two names can refer to the same value, and why a name can be moved to a different value at any time.

---

## `=` means "store", not "equals"

In maths, `x = 5` states a fact: x and 5 are equal, forever.

In code, `=` is an **instruction** with two steps:

1. Work out the value on the **right**.
2. Make the name on the **left** refer to it.

So read `x = 5` as "**x gets 5**" or "set x to 5", not "x equals 5".

```python
width = 4
height = 3
area = width * height
print(area)
```

On line 3, Python first works out `width * height` (4 × 3 = 12), then sets `area` to 12.

---

## Changing a variable

A variable can be given a new value. The old one is forgotten, and the **last** assignment wins:

```python
score = 10
print(score)
score = 25
print(score)
```

This shows `10`, then `25`. That's why they're called *variables*: their values can vary.

---

## The puzzle: `x = x + 1`

In maths, `x = x + 1` is impossible: no number is one bigger than itself. In code it's one of the most common lines you'll ever write. Use the two steps:

```python
x = 5
x = x + 1
print(x)
```

On line 2:

1. **Right side first:** look up `x` (it's 5), add 1, giving **6**.
2. **Then the left:** make `x` refer to 6.

| Line | Right side works out to | `x` after |
| ---- | ----------------------- | --------- |
| 1    | 5                       | 5         |
| 2    | 5 + 1 = 6               | 6         |

So `x = x + 1` means "**add one to x**". The program shows `6`.

> 💡 **Key idea:** The right side is always worked out first, using the **old** value. Only then does the name change.

---

## Using a name that doesn't exist

You must give a name a value before you use it. Otherwise Python stops with an error:

```python
print(high_score)  # error! NameError: name 'high_score' is not defined
```

This often happens because of a typo: `Score` and `score` are **different** names, because capital letters matter.

---

## Naming rules

| Rule                                       | OK            | Not OK        |
| ------------------------------------------ | ------------- | ------------- |
| Letters, digits and `_` only               | `high_score`  | `high-score`  |
| Can't start with a digit                   | `player2`     | `2player`     |
| No spaces                                  | `first_name`  | `first name`  |
| Can't be a word Python already uses        | `count`       | `if`, `for`   |

Capitals matter: `age` and `Age` are two different variables.

> 💡 **Tip:** Pick names that say what the value **is**: `price` beats `p`, and `total_cost` beats `x`. Python programmers join words with `_`, like `total_cost`.

---

## Other languages

Every language has variables. The idea is the same; only the spelling changes:

```text
Python:      age = 12
JavaScript:  let age = 12;
PHP:         $age = 12;
```

## Challenge

> 🎯 **Challenge:** You have 3 coins, then you find 2 more. Use `coins = coins + ...` to add 2 to `coins`, so the program shows `5`.

```python starter
coins = 3
# add 2 to coins here

print(coins)
```

```python solution
coins = 3
coins = coins + 2

print(coins)
```

```python check
assert coins == 5, "coins should be 5 at the end, but it is " + repr(coins)
assert __stdout__.strip() == "5", "The program should show 5, but it showed " + repr(__stdout__.strip())
```

**Reference:** [Python tutorial: Numbers (variables and the = sign)](https://docs.python.org/3/tutorial/introduction.html#numbers)

```quiz
? easy: What is a variable?
+ A name that refers to a value
- A number that can never change
- A type of error
- A line of text in quotes
> A variable is a name for a value, so you can use the value again by saying its name.
? easy: How should you read `x = 5` in code?
+ x gets the value 5
- x and 5 are equal forever
- Is x equal to 5?
- 5 gets the value x
> `=` is an instruction: work out the right side, then make the name on the left refer to it.
? medium: What does this show?
~~~python
x = 5
x = x + 1
print(x)
~~~
+ 6
- 5
- 51
- Error
> The right side is worked out first using the old value (5 + 1 = 6), then `x` is set to 6.
? medium: Which of these is a valid variable name?
+ `player_2`
- `2_player`
- `player 2`
- `player-2`
> Names use letters, digits and `_`, can't start with a digit, and can't contain spaces or `-`.
? hard: What does this show?
~~~python
a = 3
b = a
a = a + 10
print(a)
print(b)
~~~
+ 13\n3
- 13\n13
- 3\n3
- 3\n13
> `b = a` makes `b` refer to 3. Then `a` is moved to 13, but `b` still refers to 3.
```

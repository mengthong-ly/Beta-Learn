---
title: lambda & sorting with key
section: 4 · Functions & OOP
---

A `lambda` is a tiny anonymous function made of one expression. It's mostly used as a quick argument to another function.

```python
double = lambda x: x * 2
print(double(21))
```

## sorted() with key=

`key` is a function that says **what to sort by**:

```python
words = ["banana", "Kiwi", "apple", "fig"]
print(sorted(words))                       # uppercase letters sort first
print(sorted(words, key=str.lower))        # case-insensitive
print(sorted(words, key=len))              # by length
print(sorted(words, key=len, reverse=True))
```

Sort records by a field:

```python
people = [("Ada", 36), ("Linus", 28), ("Grace", 45)]
print(sorted(people, key=lambda p: p[1]))
print(max(people, key=lambda p: p[1]))
```

## map() and filter()

```python
nums = [1, 2, 3, 4]
print(list(map(lambda n: n * n, nums)))
print(list(filter(lambda n: n % 2, nums)))
```

> 💡 **Tip:** comprehensions are usually clearer than `map`/`filter`. Save lambdas for `key=`.

## Challenge

> 🎯 **Challenge:** Sort `students` by grade **descending**; when grades tie, sort by name ascending. Store the result in `ranked`. (Hint: a key can return a tuple.)

```python starter
students = [("Zoe", 90), ("Adam", 85), ("Bea", 90), ("Carl", 70)]
ranked = students
print(ranked)
```

```python solution
students = [("Zoe", 90), ("Adam", 85), ("Bea", 90), ("Carl", 70)]
ranked = sorted(students, key=lambda s: (-s[1], s[0]))
print(ranked)
```

```python check
assert ranked == [("Bea", 90), ("Zoe", 90), ("Adam", 85), ("Carl", 70)], f"Got {ranked}"
```

```quiz
? easy: What is a lambda in Python?
+ A small anonymous function made of a single expression
- A way to import external modules
- A special kind of loop
- A built-in exception type
> `lambda arguments: expression` creates a tiny function without a `def` or a name, usually to pass somewhere else as an argument.
? easy: What does this print?
~~~python
square = lambda x: x * x
print(square(6))
~~~
+ 36
- 12
- 6
- square(x)
> The lambda multiplies its argument by itself: 6 * 6 is 36.
? medium: What does this print?
~~~python
words = ["kiwi", "fig", "banana"]
print(sorted(words, key=len))
~~~
+ ['fig', 'kiwi', 'banana']
- ['kiwi', 'fig', 'banana']
- ['banana', 'kiwi', 'fig']
- ['fig', 'banana', 'kiwi']
> key=len sorts by each word's length. "fig" has 3 letters, "kiwi" has 4, "banana" has 6, so that's the order.
? medium: Why does `sorted(words, key=str.lower)` sort case-insensitively?
+ Each word is compared using its lowercase version, without changing the original words
- It permanently lowercases every word in the list
- str.lower is only applied to the first word
- sorted() ignores letter case by default, even without key=
> `key` computes a value to compare *by* for each item — it doesn't alter the items themselves, so the original casing survives in the result.
? hard: What does this print?
~~~python
players = [("Kim", 12), ("Sam", 20), ("Lee", 20), ("Ana", 8)]
print(sorted(players, key=lambda p: (-p[1], p[0])))
~~~
+ [('Lee', 20), ('Sam', 20), ('Kim', 12), ('Ana', 8)]
- [('Sam', 20), ('Lee', 20), ('Kim', 12), ('Ana', 8)]
- [('Ana', 8), ('Kim', 12), ('Lee', 20), ('Sam', 20)]
- [('Lee', 20), ('Sam', 20), ('Ana', 8), ('Kim', 12)]
> The key is (-score, name): negating the score sorts the highest scores first, and ties break by name ascending — "Lee" comes before "Sam" alphabetically.
```

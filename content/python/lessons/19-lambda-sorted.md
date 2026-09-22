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

---
title: Dictionaries
section: 3 · Loops & Iterations
---

A dict maps **keys → values**. Lookups by key are very fast. Keys must be immutable (strings, numbers, tuples).

```python
user = {"name": "Ada", "age": 36}
user["email"] = "ada@example.com"   # add or update
print(user["name"], len(user))
print("age" in user)                # checks keys
```

> ⚠️ **Gotcha:** `d["missing"]` raises `KeyError`. Use `d.get("missing")` (returns `None`) or `d.get("missing", default)`.

```python
user = {"name": "Ada"}
print(user.get("age"), user.get("age", 0))
```

## Looping

```python
prices = {"apple": 1.2, "kiwi": 0.5, "mango": 2.0}
for fruit, price in prices.items():
    print(f"{fruit}: ${price}")
print(list(prices.keys()), list(prices.values()))
```

## Counting pattern

```python
counts = {}
for word in "the cat and the hat".split():
    counts[word] = counts.get(word, 0) + 1
print(counts)
```

Merge dicts with `|` (Python 3.9+):

```python
defaults = {"theme": "light", "size": 14}
prefs = {"theme": "dark"}
print(defaults | prefs)
```

## Challenge

> 🎯 **Challenge:** Write `char_count(text)` returning a dict of how many times each letter appears, ignoring spaces. `char_count("aab a")` → `{"a": 3, "b": 1}`.

```python starter
def char_count(text):
    counts = {}
    return counts

print(char_count("hello world"))
```

```python solution
def char_count(text):
    counts = {}
    for ch in text:
        if ch != " ":
            counts[ch] = counts.get(ch, 0) + 1
    return counts

print(char_count("hello world"))
```

```python check
assert char_count("aab a") == {"a": 3, "b": 1}
assert char_count("") == {}
assert char_count("hello world")["l"] == 3
assert " " not in char_count("a b"), "Skip spaces"
```

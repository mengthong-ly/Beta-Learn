---
title: Sets
section: 6 · Lists & Loop Patterns
---

A set is an **unordered collection of unique** items. It's great for removing duplicates and for fast membership tests.

```python
tags = {"python", "code", "python"}
print(tags, len(tags))       # duplicates vanish
tags.add("fun")
tags.discard("code")
print("fun" in tags)
print(set([1, 2, 2, 3]))     # dedupe a list
```

> ⚠️ **Gotcha:** `{}` is an empty **dict**. An empty set is `set()`.

## Set math

```python
a = {1, 2, 3, 4}
b = {3, 4, 5}
print(a | b)   # union
print(a & b)   # intersection
print(a - b)   # difference
print(a ^ b)   # symmetric difference (in one but not both)
```

## Challenge

> 🎯 **Challenge:** Write `common_letters(w1, w2)` that returns a **sorted list** of letters appearing in both words. `common_letters("apple", "grape")` → `["a", "e", "p"]`.

```python starter
def common_letters(w1, w2):
    return []

print(common_letters("apple", "grape"))
```

```python solution
def common_letters(w1, w2):
    return sorted(set(w1) & set(w2))

print(common_letters("apple", "grape"))
```

```python check
assert common_letters("apple", "grape") == ["a", "e", "p"]
assert common_letters("abc", "xyz") == []
assert common_letters("aaa", "a") == ["a"], "No duplicates"
```

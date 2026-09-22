---
title: enumerate, zip & friends
section: 6 · Lists & Loop Patterns
---

Python has built-in helpers that replace the most common loop boilerplate. Code that uses them is shorter and harder to get wrong.

## enumerate: index and value together

Instead of juggling `range(len(items))`, ask for both at once.

```python
products = ["Iced Latte", "Americano", "Croissant"]

for i, p in enumerate(products, start=1):
    print(f"{i}. {p}")
```

## zip: walk several lists side by side

`zip` pairs up items at the same position. It stops at the shortest list.

```python
names = ["Dara", "Sokha", "Pisey"]
scores = [78, 92, 55]

for name, score in zip(names, scores):
    print(name, score)

print(dict(zip(names, scores)))  # a quick lookup table
```

> ⚠️ **Gotcha:** if the lists have different lengths, `zip` silently drops the extras. Pass `strict=True` to get an error instead when they _should_ match.

## sorted and reversed

`sorted()` returns a **new** sorted list (the original is untouched). `key=` says what to sort by; `reverse=True` flips it.

```python
people = [("Dara", 78), ("Sokha", 92), ("Pisey", 55)]

print(sorted(people, key=lambda p: p[1], reverse=True))
print(list(reversed([1, 2, 3])))
```

## sum, min, max, any, all

```python
scores = [78, 92, 55, 88]

print(sum(scores), min(scores), max(scores))
print(any(s < 60 for s in scores))   # is at least one failing?
print(all(s >= 50 for s in scores))  # did everyone pass?

people = [("Dara", 78), ("Sokha", 92)]
print(max(people, key=lambda p: p[1]))  # the whole pair with the top score
```

## map and filter

`map(f, items)` applies a function to every item; `filter(f, items)` keeps items where `f` is true. They return lazy iterators, so wrap them in `list()` to see the result. A comprehension usually reads better, but you'll see these in other people's code (and pandas has its own `.map`).

```python
prices = ["2.50", "2.00", "1.80"]
print(list(map(float, prices)))
print(list(filter(lambda p: float(p) >= 2, prices)))
print([float(p) for p in prices if float(p) >= 2])  # the comprehension way
```

## Challenge

> 🎯 **Challenge:** Using `zip`, `sorted` and `enumerate`, print a leaderboard from highest to lowest score, one line per student in the form `1. Chenda (95)`.

```python starter
names = ["Dara", "Sokha", "Pisey", "Chenda", "Rithy"]
scores = [78, 92, 55, 95, 81]

# 1. Chenda (95)
# 2. Sokha (92)
# ...
```

```python solution
names = ["Dara", "Sokha", "Pisey", "Chenda", "Rithy"]
scores = [78, 92, 55, 95, 81]

ranked = sorted(zip(names, scores), key=lambda p: p[1], reverse=True)
for rank, (name, score) in enumerate(ranked, start=1):
    print(f"{rank}. {name} ({score})")
```

```python check
want = ["1. Chenda (95)", "2. Sokha (92)", "3. Rithy (81)", "4. Dara (78)", "5. Pisey (55)"]
got = __stdout__.splitlines()
assert got == want, f"Expected {want[0]!r} … {want[-1]!r}, got {got[:2]}…"
for fn in ("zip(", "sorted(", "enumerate("):
    assert fn in __src__, f"Use {fn[:-1]}()"
```

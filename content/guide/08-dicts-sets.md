---
title: Dicts & sets
section: Guide Book
summary: Hash tables in disguise: fast lookup by key, insertion order, set algebra, and what 'hashable' really means.
---
## Dictionaries

A dict maps **keys → values**. Keys must be **hashable** (immutable things like str, int, tuple).

```python
user = {"name": "Ada", "langs": ["python"]}
user["age"] = 36                     # add / update
print(user["name"], user.get("email"), user.get("email", "n/a"))
print("age" in user, len(user))
del user["age"]
print(user.pop("langs"), user)
```

| Method | Does |
|---|---|
| `d.get(k, default)` | value or default, never raises |
| `d.setdefault(k, v)` | get, inserting `v` if missing |
| `d.update(other)` / `d \| other` | merge |
| `d.keys()` `d.values()` `d.items()` | live views |
| `d.pop(k)` `d.popitem()` | remove |

```python
stock = {"apple": 3, "kiwi": 0}
for fruit, qty in stock.items():
    print(f"{fruit}: {qty}")
stock |= {"kiwi": 5, "mango": 2}
print(stock, list(stock))            # insertion order is kept
```

> 🔍 **Behind the scenes: how a dict finds a key in O(1)**
>
> A dict is a **hash table**. For `d["name"]`, Python computes `hash("name")`, a big integer, and uses a few of its bits to pick a slot in an internal table. If the slot holds an entry with the same hash **and** an equal key, that's the answer. If a different key landed there (a *collision*), it probes other slots in a pseudo-random sequence. Lookups take about the same time for 10 keys or 10 million.
>
> Since Python 3.6, the table is split in two: a small **index array** and a dense **entries array** in insertion order. That's why dicts remember insertion order (guaranteed since 3.7) and use less memory than before.

```python
print(hash("name"), hash(42), hash((1, 2)))
print(hash(42) == 42)           # small ints hash to themselves
```

> 🔍 **Behind the scenes: why lists can't be keys**
>
> If a key could change after being stored, its hash would change too, and the dict would look in the wrong slot and never find it again. So mutable built-ins (`list`, `dict`, `set`) deliberately have **no hash**. Tuples of hashable things are hashable. Your own classes are hashable by identity unless you define `__eq__`, which switches hashing off until you also define `__hash__`.

```python
try:
    {[1, 2]: "nope"}
except TypeError as e:
    print("TypeError:", e)
print({(1, 2): "fine"})
```

> ⚠️ **Gotcha:** string hashes are **randomized per process** (to prevent attacks), so `hash("abc")` differs between runs. Never store hashes or rely on set iteration order for strings.

## Handy dict tools

```python
from collections import Counter, defaultdict

words = "the cat and the hat and the bat".split()
print(Counter(words).most_common(2))

by_len = defaultdict(list)
for w in words:
    by_len[len(w)].append(w)
print(dict(by_len))

print({w: len(w) for w in set(words)})      # dict comprehension
print(dict(zip(["a", "b"], [1, 2])))
```

## Sets

A set is an unordered collection of **unique**, hashable items: a dict with keys only.

```python
seen = {"a", "b"}
seen.add("c"); seen.discard("z")
print(len({1, 1, 2, 3}), "a" in seen)
a, b = {1, 2, 3, 4}, {3, 4, 5}
print(a | b, a & b, a - b, a ^ b)    # union, intersection, difference, symmetric
print({1, 2} <= a, a.isdisjoint({9}))
print(frozenset({1, 2}))             # immutable & hashable set
```

> ⚠️ **Gotcha:** `{}` is an empty **dict**. An empty set is `set()`.

> 🔍 **Behind the scenes: memory trade-off**
>
> Hash tables stay fast by staying partly **empty**: a dict or set resizes when it gets about two-thirds full. You trade memory for speed. That's why a set of a million ints uses several times the memory of a list of the same ints.

```python
import sys

nums = list(range(100_000))
print(sys.getsizeof(nums), sys.getsizeof(set(nums)), sys.getsizeof(dict.fromkeys(nums)))
```

> 🧭 **Scenario:** Deduplicating a mailing list while keeping the original order: a `set` loses order, but `dict.fromkeys` keeps the first occurrence of each key in insertion order.

```python
emails = ["b@x.com", "a@x.com", "b@x.com", "c@x.com", "a@x.com"]
print(list(dict.fromkeys(emails)))
```

> 🧭 **Scenario:** Finding which users are in both the "newsletter" and "paid" groups is one line of set algebra: `newsletter & paid`. Users who churned: `last_month - this_month`.

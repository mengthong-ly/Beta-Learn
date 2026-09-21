---
title: Standard library tour
section: Pythonic
---

Python ships with "batteries included". Here are some modules worth knowing before you reach for anything else.

## collections

```python
from collections import Counter, defaultdict, deque

words = "the cat and the hat and the bat".split()
print(Counter(words).most_common(2))

groups = defaultdict(list)
for w in words:
    groups[len(w)].append(w)
print(dict(groups))

q = deque([1, 2, 3])
q.appendleft(0); q.pop()
print(q)
```

## itertools

```python
from itertools import chain, combinations, groupby, accumulate

print(list(chain([1, 2], [3])))
print(list(combinations("abc", 2)))
print(list(accumulate([1, 2, 3, 4])))     # running totals
```

## datetime

```python
from datetime import date, datetime, timedelta

d = date(2026, 1, 1)
print(d + timedelta(days=100), d.strftime("%A"))
print((date(2026, 12, 25) - d).days, "days apart")
```

## random, math, json

```python
import random, math, json

random.seed(1)
print(random.choice(["rock", "paper", "scissors"]), random.randint(1, 6))
print(math.sqrt(16), math.pi, math.gcd(12, 18))
data = json.dumps({"name": "Ada", "langs": ["py"]})
print(data, json.loads(data)["name"])
```

> 💡 **Tip:** before writing a helper, search the docs. `collections` and `itertools` probably already have it.

## Challenge

> 🎯 **Challenge:** Use `collections.Counter` to write `top_word(text)` that returns the most common word (lowercased). `top_word("Hi hi HELLO")` → `"hi"`.

```python starter
from collections import Counter

def top_word(text):
    return ""

print(top_word("Hi hi HELLO"))
```

```python solution
from collections import Counter

def top_word(text):
    return Counter(text.lower().split()).most_common(1)[0][0]

print(top_word("Hi hi HELLO"))
```

```python check
assert top_word("Hi hi HELLO") == "hi"
assert top_word("a b b c c c") == "c"
assert "Counter" in __src__, "Use collections.Counter"
```

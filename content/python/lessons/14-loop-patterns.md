---
title: Loop recipes: count, sum, find
section: 3 · Loops & Iterations
---

Most loops you'll write follow a handful of recipes. Learn these and you can answer almost any "how many / how much / which one" question about a list, which is exactly what data work is.

## The accumulator: start empty, add as you go

Create a variable _before_ the loop, update it _inside_ the loop, use it _after_.

```python
prices = [2.50, 2.00, 2.75, 1.80]

total = 0
for p in prices:
    total += p
print("Total:", total)
print("Average:", total / len(prices))
```

## Counting with a condition

Same recipe, but only add when something is true.

```python
scores = [78, 92, 45, 88, 55, 39, 95]

passed = 0
for s in scores:
    if s >= 50:
        passed += 1
print(passed, "of", len(scores), "passed")
```

## Finding the biggest (or smallest)

Remember the best value so far, and replace it whenever you see a better one.

```python
scores = [78, 92, 45, 88, 95, 39]

best = scores[0]
for s in scores:
    if s > best:
        best = s
print("Best:", best)
```

> 💡 **Tip:** Python has `sum()`, `max()`, `min()` and `len()` built in, and you should use them in real code. Writing the loop yourself once is how you learn what they do, and it's the only option when the rule is custom (e.g. "the highest score _among students who attended_").

## Building a new list

Start with `[]` and `.append()` what you keep.

```python
names = ["dara", "sokha", "pisey"]

capitalised = []
for n in names:
    capitalised.append(n.title())
print(capitalised)
```

## Searching with a flag

A **flag** is a boolean that records "did I find it?". Use `break` to stop early once you have.

```python
orders = [1001, 1002, 1003, 1004]
wanted = 1003

found = False
for o in orders:
    if o == wanted:
        found = True
        break
print("Found!" if found else "Not found")
```

## Nested loops

A loop inside a loop runs the inner loop completely for _each_ step of the outer one.

```python
for row in range(1, 4):
    line = ""
    for col in range(1, 4):
        line += f"{row * col:4}"
    print(line)
```

> 🧭 **Scenario:** A café owner asks "how many orders were over $5, and what was the biggest one?" That's a counting loop and a find-the-max loop over the same list. Later, pandas will do both in one line, but it runs exactly these recipes underneath.

## Challenge

> 🎯 **Challenge:** Write `summarize(scores)` that uses **one `for` loop** to return a tuple `(passed, average, best)`: how many scores are **50 or more**, the average of all scores, and the highest score. Don't use `sum()` or `max()`.

```python starter
def summarize(scores):
    passed = 0
    total = 0
    best = scores[0]
    # loop over scores and update the three variables

    return passed, total / len(scores), best

print(summarize([78, 92, 45, 88, 55, 39, 95]))
```

```python solution
def summarize(scores):
    passed = 0
    total = 0
    best = scores[0]
    for s in scores:
        total += s
        if s >= 50:
            passed += 1
        if s > best:
            best = s
    return passed, total / len(scores), best

print(summarize([78, 92, 45, 88, 55, 39, 95]))
```

```python check
assert summarize([78, 92, 45, 88, 55, 39, 95]) == (5, 492 / 7, 95), "Check the counts: 5 passed, best 95."
assert summarize([10, 20]) == (0, 15, 20)
assert summarize([50]) == (1, 50, 50), "50 counts as a pass."
assert "sum(" not in __src__ and "max(" not in __src__, "Do it with a loop, without sum() or max()."
```

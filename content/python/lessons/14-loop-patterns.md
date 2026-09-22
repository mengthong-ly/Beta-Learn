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

```quiz
? easy: In the accumulator pattern, what's the first step?
+ Create the accumulator variable (like `total = 0`) before the loop starts
- Call `sum()` before the loop
- Set the accumulator to the last item in the list
- Use `continue` for every item that doesn't match
> The variable has to exist before the loop so each pass can update it; it's created once, updated inside the loop, and used after.
? easy: What does this print?
~~~python
prices = [3.0, 1.5, 2.5]
total = 0
for p in prices:
    total += p
print(total)
~~~
+ 7.0
- 3.0
- [3.0, 1.5, 2.5]
- 7
> total starts at 0 and each price is added in turn: 0 + 3.0 + 1.5 + 2.5 is 7.0.
? medium: What does this print?
~~~python
scores = [40, 92, 15, 77]
best = scores[0]
for s in scores:
    if s > best:
        best = s
print(best)
~~~
+ 92
- 40
- 77
- 224
> best starts as the first score and is only replaced when a strictly larger value shows up. 92 is the largest score in the list.
? medium: What is a "flag" variable used for?
+ A boolean that records whether something was found, checked after the loop
- A counter that always starts at 1
- The name given to the loop variable
- A value that only matters inside nested loops
> A flag starts `False`, gets set to `True` once the thing you're looking for is found, and is read after the loop ends.
? hard: What does this print?
~~~python
total = 0
for i in range(1, 3):
    for j in range(1, 4):
        total += i * j
print(total)
~~~
+ 18
- 6
- 12
- 24
> The inner loop runs completely for each i. For i=1 it adds 1+2+3=6; for i=2 it adds 2+4+6=12. Both outer passes accumulate into the same total, giving 6+12=18.
```

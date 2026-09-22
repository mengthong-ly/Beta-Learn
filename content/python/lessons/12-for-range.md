---
title: for loops & range
section: 3 · Loops & Iterations
---

`for` walks over any **iterable**: a string, list, range, dict and more.

```python
for ch in "abc":
    print(ch)

for fruit in ["apple", "kiwi"]:
    print(fruit.upper())
```

## range()

`range(stop)`, `range(start, stop)`, `range(start, stop, step)`. The `stop` value is **excluded**.

```python
print(list(range(5)))          # [0, 1, 2, 3, 4]
print(list(range(2, 6)))       # [2, 3, 4, 5]
print(list(range(10, 0, -3)))  # [10, 7, 4, 1]
```

## enumerate() and zip()

```python
names = ["Ada", "Linus", "Grace"]
for i, name in enumerate(names, start=1):
    print(i, name)

scores = [90, 80, 95]
for name, score in zip(names, scores):
    print(f"{name}: {score}")
```

> 💡 **Tip:** reach for `enumerate` instead of `range(len(...))`. It's clearer and more Pythonic.

## Challenge

> 🎯 **Challenge:** Use a `for` loop to compute the sum of all numbers from 1 to 100 that are divisible by 3 or 5. Store it in `total` and print it.

```python starter
total = 0

print(total)
```

```python solution
total = 0
for n in range(1, 101):
    if n % 3 == 0 or n % 5 == 0:
        total += n
print(total)
```

```python check
assert total == 2418, f"Expected 2418, got {total}. Check your range bounds: range(1, 101)"
```

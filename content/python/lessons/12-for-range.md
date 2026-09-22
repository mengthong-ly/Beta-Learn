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

```quiz
? easy: What does `for ch in "abc":` iterate over?
+ Each character in the string, one at a time
- Each word in the string
- The string's length, as a number
- Nothing; strings aren't iterable
> Strings are iterables of their characters, so a `for` loop walks them one character at a time.
? easy: What does this print?
~~~python
for fruit in ["kiwi", "fig"]:
    print(fruit.upper())
~~~
+ KIWI\nFIG
- kiwi\nfig
- KIWIFIG
- FIG\nKIWI
> `.upper()` uppercases each fruit, and the loop visits the list in order, printing one per line.
? medium: What does this print?
~~~python
print(list(range(3, 9, 2)))
~~~
+ [3, 5, 7]
- [3, 5, 7, 9]
- [3, 4, 5, 6, 7, 8]
- [2, 4, 6, 8]
> range(3, 9, 2) starts at 3 and adds 2 each time, but stops before reaching the stop value, 9.
? medium: What does `list(enumerate(["a", "b"], start=5))` give you?
+ [(5, 'a'), (6, 'b')]
- [(0, 'a'), (1, 'b')]
- [(1, 'a'), (2, 'b')]
- ['a', 'b']
> `start` only changes the first count value; it still increases by 1 for each item after that.
? hard: What does this print?
~~~python
total = 0
for i in range(1, 10, 3):
    total += i
print(total)
~~~
+ 12
- 22
- 18
- 45
> range(1, 10, 3) yields 1, 4, 7 — it stops before reaching 10 — and 1 + 4 + 7 is 12.
```

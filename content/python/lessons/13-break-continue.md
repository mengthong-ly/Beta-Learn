---
title: break, continue & else
section: 3 · Loops & Iterations
---

- `break` exits the loop immediately
- `continue` skips to the next iteration

```python
for n in range(10):
    if n == 5:
        break
    if n % 2 == 0:
        continue
    print(n)    # 1, 3
```

## The loop `else`

A loop's `else` block runs only if the loop finished **without** `break`. That's perfect for "search" loops:

```python
for n in [3, 7, 11]:
    if n % 2 == 0:
        print("found an even number:", n)
        break
else:
    print("no even numbers")
```

> 💡 **Tip:** read `for … else` as "for … _if no break_".

## Challenge

> 🎯 **Challenge:** Write `first_negative(nums)` that returns the first negative number in the list, or `None` if there isn't one. Use `break` or an early `return`.

```python starter
def first_negative(nums):
    pass

print(first_negative([4, 2, -7, -1]))
```

```python solution
def first_negative(nums):
    for n in nums:
        if n < 0:
            return n
    return None

print(first_negative([4, 2, -7, -1]))
```

```python check
assert first_negative([4, 2, -7, -1]) == -7
assert first_negative([1, 2, 3]) is None, "Return None when there's no negative"
assert first_negative([]) is None
assert first_negative([-3]) == -3
```

```quiz
? easy: What does `break` do inside a loop?
+ Immediately exits the loop
- Skips to the next iteration
- Restarts the loop from the beginning
- Pauses the loop until it's called again
> `break` stops the loop right away — no more iterations run, and any loop `else` is skipped.
? easy: What does this print?
~~~python
for n in range(6):
    if n == 3:
        continue
    print(n)
~~~
+ 0\n1\n2\n4\n5
- 0\n1\n2
- 0\n1\n2\n3\n4\n5
- 0\n1\n2\n4
> `continue` only skips the print for n == 3; the loop still runs through every other value in range(6).
? medium: What does this print?
~~~python
for n in [4, 8, 10]:
    if n % 2 != 0:
        print("found odd:", n)
        break
else:
    print("all even")
~~~
+ all even
- found odd: 4
- found odd: 10
- (nothing)
> None of the numbers are odd, so `break` never runs. The loop finishes normally, which is exactly when its `else` block runs.
? medium: In a `for … else` loop, when does the `else` block NOT run?
+ When the loop exits early via `break`
- When the list being looped over is empty
- When `continue` is used at some point in the loop
- It always runs, no matter what
> `else` runs whenever the loop finishes without `break` — that includes looping over an empty list and loops that used `continue`. Only `break` skips it.
? hard: What does this print?
~~~python
for n in range(8):
    if n % 3 == 0:
        continue
    if n == 7:
        break
    print(n)
~~~
+ 1\n2\n4\n5
- 1\n2\n4\n5\n7
- 0\n1\n2\n4\n5
- 1\n2\n3\n4\n5
> Multiples of 3 (0, 3, 6) are skipped by `continue` before they reach the print. Then n == 7 hits `break` — before its print runs — so the loop stops without printing 7.
```

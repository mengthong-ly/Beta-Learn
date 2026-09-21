---
title: break, continue & else
section: Control flow
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

---
title: while loops
section: 3 · Loops & Iterations
---

`while` repeats a block **as long as** its condition stays truthy.

```python
n = 3
while n > 0:
    print(n)
    n -= 1
print("Liftoff!")
```

Something inside the loop must eventually make the condition false, or it runs forever.

> ⚠️ **Gotcha:** infinite loops are easy to write. If yours hangs, press **Stop** (⌘.). PyLearn also stops any run after 10 seconds.

A common pattern is to loop until a condition is found:

```python
n = 1
while n * n < 200:
    n += 1
print(n, "is the first number whose square is ≥ 200")
```

## Challenge

> 🎯 **Challenge:** Starting from `x = 1`, keep doubling `x` while it's less than `1000`, and count how many doublings it took. Print the final `x` and `steps`: `1024 10`.

```python starter
x = 1
steps = 0

print(x, steps)
```

```python solution
x = 1
steps = 0
while x < 1000:
    x *= 2
    steps += 1
print(x, steps)
```

```python check
assert x == 1024 and steps == 10, f"Expected x=1024, steps=10, got x={x}, steps={steps}"
assert "while" in __src__, "Use a while loop"
```

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

```quiz
? easy: What does this print?
~~~python
n = 6
while n > 0:
    print(n)
    n -= 2
~~~
+ 6\n4\n2
- 6\n4\n2\n0
- 6\n4\n2\n0\n-2
- 4\n2
> The loop prints n, then subtracts 2, and stops as soon as n is no longer greater than 0 — that happens right after printing 2, when n becomes 0.
? easy: What must happen inside a `while` loop's body to avoid an infinite loop?
+ Something must eventually make the condition false
- The loop must contain a `for` statement
- The loop must print something every iteration
- The loop must call `return`
> `while` keeps going as long as its condition is truthy, so the body has to change something the condition depends on.
? medium: What does this print?
~~~python
n = 1
while n * n < 50:
    n += 1
print(n)
~~~
+ 8
- 7
- 9
- 64
> n keeps increasing while n*n stays under 50. It stops the first time n*n reaches or passes 50 — at n=8, since 8*8=64. The loop prints n itself, not n*n.
? medium: What happens if you write `while True:` with nothing inside that ever breaks out of it?
+ It loops forever, until it's stopped manually or the runner's timeout ends it
- Python detects the infinite loop and raises an error immediately
- It runs once, since `True` is only checked the first time
- It automatically stops after exactly one iteration
> `while True` has no way to become false on its own, so nothing but a `break`, a `return`, an exception, or an external stop (like PyLearn's 10-second timeout) will end it.
? hard: What does this print?
~~~python
x, y = 5, 0
while x > 0 and y < 3:
    x -= 1
    y += 1
    print(x, y)
~~~
+ 4 1\n3 2\n2 3
- 5 1\n4 2\n3 3
- 4 1\n3 2\n2 3\n1 3
- 4 1\n3 2
> Both conditions are rechecked at the top of every pass. After the third pass y reaches 3, which makes `y < 3` false, so the loop stops — it never runs a fourth time.
```

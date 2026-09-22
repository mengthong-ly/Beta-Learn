---
title: Lists
section: 2 · Strings & Lists
---

A list is an **ordered, mutable** sequence. It can hold anything, including mixed types.

```python
nums = [3, 1, 4]
nums.append(1)        # add to the end
nums.insert(0, 9)     # insert at an index
nums.extend([5, 9])   # add many
print(nums, len(nums))
```

## Reading and changing

```python
colors = ["red", "green", "blue"]
print(colors[0], colors[-1])   # first, last
colors[1] = "lime"             # replace
print("blue" in colors)
print(colors.index("blue"))
```

## Removing

```python
items = ["a", "b", "c", "d"]
last = items.pop()        # remove & return last
items.remove("a")         # remove first match by value
del items[0]              # remove by index
print(items, last)
```

## Sorting

```python
nums = [3, 1, 4, 1, 5]
print(sorted(nums))       # new sorted list
nums.sort(reverse=True)   # sorts in place, returns None
print(nums, sum(nums), max(nums))
```

> ⚠️ **Gotcha:** `b = a` does **not** copy a list; both names point at the same list. Use `a.copy()` or `list(a)`.

```python
a = [1, 2]
b = a
b.append(3)
print(a)          # [1, 2, 3], a changed too!
c = a.copy()
c.append(4)
print(a, c)
```

## Challenge

> 🎯 **Challenge:** Write `dedupe(items)` that returns a **new** list without duplicates, keeping the first occurrence order. `dedupe([3, 1, 3, 2, 1])` → `[3, 1, 2]`.

```python starter
def dedupe(items):
    result = []
    return result

print(dedupe([3, 1, 3, 2, 1]))
```

```python solution
def dedupe(items):
    result = []
    for x in items:
        if x not in result:
            result.append(x)
    return result

print(dedupe([3, 1, 3, 2, 1]))
```

```python check
assert dedupe([3, 1, 3, 2, 1]) == [3, 1, 2]
assert dedupe([]) == []
assert dedupe(["a", "a"]) == ["a"]
data = [1, 1]
dedupe(data)
assert data == [1, 1], "Don't modify the original list"
```

```quiz
? easy: What does this print?
~~~python
nums = [3, 1, 4]
nums.append(1)
print(nums)
~~~
+ [3, 1, 4, 1]
- [1, 3, 1, 4]
- [3, 1, 4]
- [1, 4, 3, 1]
> append() adds the new item to the end of the list.
? easy: Which method removes and returns the *last* item of a list?
+ `pop()`
- `remove()`
- `del`
- `extend()`
> pop() removes & returns the last item by default. remove() deletes by value, and del removes by index.
? medium: What does this print?
~~~python
nums = [3, 1, 4, 1, 5]
print(sorted(nums))
print(nums)
~~~
+ [1, 1, 3, 4, 5]\n[3, 1, 4, 1, 5]
- [1, 1, 3, 4, 5]\n[1, 1, 3, 4, 5]
- [3, 1, 4, 1, 5]\n[3, 1, 4, 1, 5]
- Error
> sorted() returns a new sorted list and leaves nums unchanged; only .sort() sorts in place.
? medium: What does `nums.sort(reverse=True)` return?
+ `None` — it sorts the list in place
- The sorted list
- A new list; the original is unchanged
- The number of items sorted
> .sort() mutates the list and returns None, unlike sorted() which returns a new list.
? hard: What does this print?
~~~python
a = [1, 2]
b = a
b.append(3)
print(a)
~~~
+ [1, 2, 3]
- [1, 2]
- [1, 2, 2]
- Error
> `b = a` doesn't copy the list — both names point at the same list, so changing b also changes a.
? hard: What does this print?
~~~python
items = ["a", "b", "c", "d"]
last = items.pop()
items.remove("a")
del items[0]
print(items, last)
~~~
+ ['c'] d
- ['b', 'c'] d
- ['c'] a
- [] d
> pop() removes "d" (last=  "d", items=[a,b,c]); remove("a") drops "a" (items=[b,c]); del items[0] drops "b" (items=[c]).
```

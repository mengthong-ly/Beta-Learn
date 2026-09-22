---
title: Slicing
section: 2 · Strings & Lists
---

`seq[start:stop:step]` takes a slice of any sequence (lists, strings, tuples). `stop` is excluded, and each part is optional.

```python
nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
print(nums[2:5])    # [2, 3, 4]
print(nums[:3])     # first 3
print(nums[-3:])    # last 3
print(nums[::2])    # every 2nd
print(nums[::-1])   # reversed
```

It works on strings too:

```python
word = "Python"
print(word[1:4], word[::-1], word[:1].lower())
```

Slices never raise `IndexError`; out-of-range bounds just clip:

```python
print([1, 2, 3][1:100])
```

> 💡 **Tip:** `nums[:]` is a quick shallow copy of a list.

You can even **assign** to a slice to replace part of a list:

```python
nums = [1, 2, 3, 4, 5]
nums[1:3] = ["a", "b", "c"]
print(nums)
```

## Challenge

> 🎯 **Challenge:** Write `is_palindrome(text)` that returns `True` if the text reads the same backwards, ignoring case and spaces. `"Never odd or even"` → `True`.

```python starter
def is_palindrome(text):
    return False

print(is_palindrome("Never odd or even"))
```

```python solution
def is_palindrome(text):
    clean = text.replace(" ", "").lower()
    return clean == clean[::-1]

print(is_palindrome("Never odd or even"))
```

```python check
assert is_palindrome("Never odd or even") is True
assert is_palindrome("racecar") is True
assert is_palindrome("Python") is False
assert is_palindrome("A") is True
```

```quiz
? easy: What does this print?
~~~python
nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
print(nums[2:5])
~~~
+ [2, 3, 4]
- [2, 3, 4, 5]
- [2, 5]
- [1, 2, 3, 4]
> stop is excluded, so [2:5] takes the items at indices 2, 3 and 4.
? easy: What happens if a slice's start or stop index is beyond the sequence's length?
+ It's clipped to the sequence's bounds — no error
- Python raises an IndexError
- Python raises a ValueError
- The missing part is filled with None
> Slices never raise IndexError; an out-of-range bound just clips to the start or end of the sequence.
? medium: What does this print?
~~~python
word = "Python"
print(word[::-1])
~~~
+ nohtyP
- Python
- P
- nohtyp
> A step of -1 walks the sequence backwards, reversing it.
? medium: What does this print?
~~~python
print([1, 2, 3][1:100])
~~~
+ [2, 3]
- [2, 3, None, None]
- Error
- []
> The out-of-range stop just clips to the end of the list; slicing never raises IndexError.
? hard: What does this print?
~~~python
nums = [1, 2, 3, 4, 5]
nums[1:3] = ["a", "b", "c"]
print(nums)
~~~
+ [1, 'a', 'b', 'c', 4, 5]
- [1, 'a', 'b', 4, 5]
- ['a', 'b', 'c', 4, 5]
- Error
> Assigning to a slice replaces that range; the replacement can have a different number of items than the slice it replaces.
```

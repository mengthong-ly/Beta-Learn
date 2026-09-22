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

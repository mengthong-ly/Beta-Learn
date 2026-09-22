---
title: Dictionaries
section: 3 · Loops & Iterations
---

A dict maps **keys → values**. Lookups by key are very fast. Keys must be immutable (strings, numbers, tuples).

```python
user = {"name": "Ada", "age": 36}
user["email"] = "ada@example.com"   # add or update
print(user["name"], len(user))
print("age" in user)                # checks keys
```

> ⚠️ **Gotcha:** `d["missing"]` raises `KeyError`. Use `d.get("missing")` (returns `None`) or `d.get("missing", default)`.

```python
user = {"name": "Ada"}
print(user.get("age"), user.get("age", 0))
```

## Looping

```python
prices = {"apple": 1.2, "kiwi": 0.5, "mango": 2.0}
for fruit, price in prices.items():
    print(f"{fruit}: ${price}")
print(list(prices.keys()), list(prices.values()))
```

## Counting pattern

```python
counts = {}
for word in "the cat and the hat".split():
    counts[word] = counts.get(word, 0) + 1
print(counts)
```

Merge dicts with `|` (Python 3.9+):

```python
defaults = {"theme": "light", "size": 14}
prefs = {"theme": "dark"}
print(defaults | prefs)
```

## Challenge

> 🎯 **Challenge:** Write `char_count(text)` returning a dict of how many times each letter appears, ignoring spaces. `char_count("aab a")` → `{"a": 3, "b": 1}`.

```python starter
def char_count(text):
    counts = {}
    return counts

print(char_count("hello world"))
```

```python solution
def char_count(text):
    counts = {}
    for ch in text:
        if ch != " ":
            counts[ch] = counts.get(ch, 0) + 1
    return counts

print(char_count("hello world"))
```

```python check
assert char_count("aab a") == {"a": 3, "b": 1}
assert char_count("") == {}
assert char_count("hello world")["l"] == 3
assert " " not in char_count("a b"), "Skip spaces"
```

```quiz
? easy: What does `"age" in user` check?
+ Whether "age" is a key in the dict
- Whether "age" is a value in the dict
- Whether the dict is empty
- Whether "age" appears anywhere, as a key or a value
> `in` on a dict checks its keys, not its values.
? easy: What does this print?
~~~python
user = {"name": "Ada", "age": 36}
user["age"] = 37
print(user["age"], len(user))
~~~
+ 37 2
- 36 2
- 37 3
- 37 1
> Assigning to an existing key updates its value, so age becomes 37. len() counts the 2 keys: name and age.
? medium: What does this print?
~~~python
prices = {"apple": 1.2}
print(prices.get("kiwi", 0))
print(prices.get("apple"))
~~~
+ 0\n1.2
- None\n1.2
- 0\nNone
- KeyError
> .get() with a default returns that default when the key is missing ("kiwi"), and returns the normal value when the key exists ("apple").
? medium: What error does `d["missing"]` raise when `"missing"` isn't a key in `d`?
+ KeyError
- IndexError
- ValueError
- Nothing — it returns None
> Square-bracket lookup raises `KeyError` for a missing key; `.get()` is the way to avoid that and get `None` (or a default) instead.
? hard: What does this print?
~~~python
counts = {}
for word in "to be or not to be".split():
    counts[word] = counts.get(word, 0) + 1
print(counts["to"], counts["be"], counts["or"])
~~~
+ 2 2 1
- 1 1 1
- 3 3 1
- 2 2 2
> .get(word, 0) starts a new word at 0, and every repeat adds 1 more. "to" and "be" each appear twice in the sentence; "or" appears once.
? hard: What does this print?
~~~python
defaults = {"theme": "light", "size": 14, "sound": True}
prefs = {"theme": "dark", "size": 16}
print(defaults | prefs)
~~~
+ {'theme': 'dark', 'size': 16, 'sound': True}
- {'theme': 'light', 'size': 14, 'sound': True}
- {'theme': 'dark', 'size': 16}
- {'sound': True, 'theme': 'dark', 'size': 16}
> `|` merges the two dicts; where a key appears in both, the right-hand dict's value wins. Keys only in the left dict, like "sound", are kept as-is.
```

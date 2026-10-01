---
title: Lists: many values
section: 4 · Building blocks
---

A variable holds one value. A **list** holds many values, kept in order, under one name.

Shopping lists, playlists, high scores: whenever you have "a bunch of things", a list is usually the answer.

---

## Making a list

Write the values between square brackets `[ ]`, separated by commas:

```python
fruits = ["apple", "banana", "cherry"]
scores = [12, 40, 7]

print(fruits)
print(scores)
```

Each value in a list is called an **item** (or element). A list can hold text, numbers, or any other value, and it can even be empty: `[]`.

---

## Every item has a position

Items stay in the order you wrote them. Each one has a position number, called its **index**:

```text
fruits = [ "apple", "banana", "cherry" ]
index:        0         1         2
```

Wait, why does it start at **0**, not 1? Think of the index as "how many steps from the start". The first item is zero steps away.

> 💡 **Key idea:** Indexes start at 0. The first item is at index 0, the second at 1, and the last is at one less than the number of items. Most programming languages count this way.

---

## Getting one item

Put the index in square brackets after the list's name:

```python
fruits = ["apple", "banana", "cherry"]

print(fruits[0])
print(fruits[2])
print(fruits[-1])
```

`fruits[0]` is the first item. A negative index counts from the end, so `fruits[-1]` is always the **last** item, however long the list is.

> ⚠️ **Gotcha:** `fruits[3]` is an error here: there are only three items, at 0, 1 and 2. Python calls this an `IndexError: list index out of range`.

---

## How long is it? len

The built-in function `len` returns how many items a list has:

```python
fruits = ["apple", "banana", "cherry"]
print(len(fruits))
print(len([]))
```

Remember that the last index is always `len(...) - 1`. Three items means indexes 0, 1 and 2.

---

## Adding items: append

Lists can grow. `append` adds an item to the **end**:

```python
fruits = ["apple", "banana"]
fruits.append("cherry")
fruits.append("date")

print(fruits)
print(len(fruits))
```

Notice the dot: `fruits.append(...)` means "append, to *this* list". A function attached to a value like this is called a **method**.

You can also change an item by its index: `fruits[0] = "avocado"` replaces the first one.

---

## Doing something with every item

The real power of a list: a `for` loop visits each item in turn, from first to last:

```python
fruits = ["apple", "banana", "cherry"]

for fruit in fruits:
    print("I like " + fruit)
```

Each time round the loop, `fruit` holds the next item. Three items, so the body runs three times.

This works whether the list has 3 items or 3 million, and you didn't have to know the length.

---

## Adding up a list

A common pattern: start a total at 0, then add each item to it as you loop.

```python
scores = [12, 40, 7]
total = 0

for score in scores:
    total = total + score

print("Total:", total)
```

> 📝 **Note:** Other languages have the same idea under different names: an **array** in JavaScript, PHP and C++, a **vector** in Rust and C++, a **List** in Dart. Square brackets and index 0 are almost universal.

## Challenge

> 🎯 **Challenge:** Add `"tea"` to the end of the `shopping` list, then loop over the list and print every item on its own line.

```python starter
shopping = ["bread", "milk"]

# 1. append "tea" to shopping
# 2. loop over shopping and print each item
```

```python solution
shopping = ["bread", "milk"]
shopping.append("tea")

for item in shopping:
    print(item)
```

```python check
assert shopping == ["bread", "milk", "tea"], f"shopping should be ['bread', 'milk', 'tea'] but is {shopping!r}. Did you append 'tea'?"
lines = __stdout__.strip().splitlines()
assert lines == ["bread", "milk", "tea"], f"Print each item on its own line: bread, milk, tea. You printed {lines!r}"
```

**Reference:** [Python tutorial: Lists](https://docs.python.org/3/tutorial/introduction.html#lists)

```quiz
? easy: What is the index of the first item in a list?
+ 0
- 1
- -1
- It depends on the list
> Indexes start at 0, so the first item is at index 0.
? easy: What does `append` do to a list?
+ Adds an item to the end
- Adds an item to the start
- Removes the last item
- Sorts the list
> `append` adds one item to the end of the list.
? medium: What does this print?
~~~python
colors = ["red", "green", "blue"]
print(colors[1])
~~~
+ green
- red
- blue
- ["red", "green", "blue"]
> Index 1 is the second item, because counting starts at 0.
? medium: What does this print?
~~~python
nums = [5, 10]
nums.append(15)
print(len(nums))
~~~
+ 3
- 2
- 15
- 30
> The list starts with 2 items, and append adds one more, so len returns 3.
? hard: What does this print?
~~~python
nums = [3, 1, 4]
total = 0
for n in nums:
    total = total + n
print(total, nums[-1])
~~~
+ 8 4
- 8 3
- 4 8
- 3 4
> The loop adds 3 + 1 + 4 = 8. `nums[-1]` is the last item, 4.
```

---
title: Values and types
section: 4 · Building blocks
---

Every piece of data a program works with is a **value**: a number, a word, a yes or no. Every value has a **type**, which says what kind of thing it is and what you can do with it.

---

## Values

These are all values:

```python
print(42)
print(3.5)
print("hello")
print(True)
```

`42` is a number, `3.5` is a number with a decimal point, `"hello"` is some text, and `True` is a yes/no answer. Four values, four different **types**.

> 💡 **Key idea:** The type matters because it decides what makes sense. You can multiply two numbers, but what would multiplying two names even mean?

---

## Whole numbers: `int`

A whole number, with no decimal point, has the type **`int`** (short for *integer*). It can be positive, negative or zero.

```python
print(7)
print(-12)
print(2026)
```

> ⚠️ **Gotcha:** Don't put commas in big numbers. Write `1000000`, not `1,000,000`. If you want to make it easier to read, Python lets you use underscores: `1_000_000`.

---

## Decimals: `float`

A number with a decimal point has the type **`float`** (short for *floating point*, the way computers store decimals).

```python
print(3.5)
print(-0.25)
print(5.0)
```

`5.0` is a float, even though it's equal to 5. The dot is what counts.

> 📝 **Note:** Floats are sometimes a tiny bit off, because computers store decimals in a special way. `0.1 + 0.2` shows `0.30000000000000004`. That's normal in every language, not a bug in your code.

---

## Text: `str`

Text has the type **`str`** (short for *string*, as in a string of characters). You write it inside quotes, either `"double"` or `'single'`; they mean the same thing.

```python
print("Hello!")
print('Mia')
print("Room 101")
```

Quotes tell the computer "this is text, not code". `print` shows the text **without** the quotes.

---

## Yes or no: `bool`

The type **`bool`** (short for *Boolean*) has only two values: `True` and `False`. Programs use them to answer yes/no questions.

```python
print(True)
print(False)
print(10 > 3)
```

`10 > 3` asks "is 10 bigger than 3?", and the answer is `True`.

> ⚠️ **Gotcha:** Capitals matter. It's `True` and `False`, never `true` or `false`.

---

## Asking for the type: `type()`

Not sure what type a value is? Ask with `type()`:

```python
print(type(42))
print(type(3.5))
print(type("hello"))
print(type(True))
```

It shows `<class 'int'>`, `<class 'float'>`, `<class 'str'>` and `<class 'bool'>`. In Python, "class" here just means "type".

| Type    | Means         | Examples            |
| ------- | ------------- | ------------------- |
| `int`   | whole number  | `7`, `-12`, `0`     |
| `float` | decimal       | `3.5`, `5.0`        |
| `str`   | text          | `"hi"`, `'Mia'`     |
| `bool`  | true or false | `True`, `False`     |

---

## "5" is not 5

`5` is a number. `"5"` is text that happens to contain the digit 5. They look alike but behave differently:

```python
print(5 + 5)
print("5" + "5")
```

The first adds numbers and shows `10`. The second **glues text together** and shows `55`.

Mixing them is an error, because Python won't guess whether you meant numbers or text:

```python
print("5" + 5)  # error! TypeError: can only concatenate str (not "int") to str
```

---

## Changing a value's type

You can turn text into a number with `int()` or `float()`, and a number into text with `str()`:

```python
print(int("5") + 5)
print(float("2.5"))
print(str(5) + "5")
```

These show `10`, `2.5` and `55`.

> 📝 **Note:** Every language has these same kinds of values, with slightly different names. JavaScript, for example, calls text a `string`, true/false a `boolean`, and uses one `number` type for both whole numbers and decimals.

## Challenge

> 🎯 **Challenge:** The program shows `46`, because the two values are text. Change them into numbers so it shows `10`.

```python starter
print("4" + "6")
```

```python solution
print(4 + 6)
```

```python check
assert __stdout__.strip() != "46", "It still shows 46: the values are still text. Remove the quotes."
assert __stdout__.strip() == "10", "It should show 10, but it showed " + repr(__stdout__.strip())
```

**Reference:** [Python tutorial: Using Python as a calculator](https://docs.python.org/3/tutorial/introduction.html#using-python-as-a-calculator)

```quiz
? easy: What type is the value `"hello"`?
+ `str` (text)
- `int` (whole number)
- `float` (decimal)
- `bool` (true or false)
> Anything inside quotes is text, which Python calls `str`.
? easy: Which of these is a `float`?
+ `5.0`
- `5`
- `"5.0"`
- `True`
> A number with a decimal point is a float. `"5.0"` has quotes, so it's text.
? medium: What does this show?
~~~python
print("3" + "3")
~~~
+ 33
- 6
- "33"
- Error
> Both values are text, so `+` glues them together. `print` shows text without quotes.
? medium: What does this show?
~~~python
print(type(7.0))
~~~
+ <class 'float'>
- <class 'int'>
- <class 'str'>
- 7.0
> `7.0` has a decimal point, so it's a float, even though it equals 7.
? hard: What does this show?
~~~python
print(int("4") + 4)
print(str(4) + "4")
~~~
+ 8\n44
- 44\n8
- 8\n8
- 44\n44
> `int("4")` turns text into the number 4, so 4 + 4 is 8. `str(4)` turns the number into text, so the two pieces of text are glued into `44`.
```

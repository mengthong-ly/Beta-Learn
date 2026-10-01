---
title: Input and output
section: 4 · Building blocks
---

Almost every program does three things: it takes something **in**, works on it, and gives something **back**. Programmers call these **input**, **process** and **output**.

---

## Input, process, output

```text
   INPUT     ───►    PROCESS    ───►    OUTPUT
 (data in)          (do the work)      (results out)
```

You see this pattern everywhere:

| Program        | Input                | Process                   | Output              |
| -------------- | -------------------- | ------------------------- | ------------------- |
| Calculator     | the keys you press   | does the sum              | the answer on screen |
| Maps app       | where you want to go | finds the best route      | directions          |
| Camera app     | light from the lens  | turns it into a picture   | a photo             |

> 💡 **Key idea:** When you plan a program, ask three questions: What goes in? What has to happen to it? What should come out?

---

## Output with `print`

`print` is how a Python program shows things on the screen. Each `print` shows one line:

```python
print("Hello!")
print(42)
```

Give `print` several values separated by commas and it shows them on one line, with a space between each:

```python
name = "Mia"
age = 12
print("Name:", name)
print(name, "is", age)
```

This shows `Name: Mia` and `Mia is 12`. Notice you can mix text and numbers this way.

> 💡 **Tip:** `print()` with nothing inside shows an empty line. Handy for spacing out your output.

---

## Input from the keyboard

To ask the person using the program a question, Python has `input()`:

```python-snippet
name = input("What is your name? ")
print("Hello,", name)
```

Here's what happens:

1. `input` shows the question `What is your name? `.
2. The program **waits** while the person types and presses Enter.
3. Whatever they typed becomes the value, and `name` refers to it.

> 📝 **Note:** `input()` doesn't work in this app's editor, because the code runs in your browser where there's no keyboard for it to wait on. That's why it's shown here without a **Try it** button. In runnable examples, we just **set the value ourselves**, as if someone had typed it.

---

## Pretending to type

This runnable version does the same job. Instead of asking, we set `name` directly:

```python
name = "Sam"  # pretend the user typed Sam
print("Hello,", name)
```

The rest of the program doesn't care where `name` came from. That's a useful idea: if your program works with a value you set yourself, it'll work with one the user types too.

---

## `input` always gives text

Whatever the person types comes back as **text** (a `str`), even if they type a number:

```python-snippet
age = input("How old are you? ")   # they type 12; age is the text "12"
age = int(age)                     # now age is the number 12
print(age + 1)
```

To do maths with it, turn it into a number with `int()`, like you saw in [Values and types](/fundamentals/lesson/values-and-types). Here it is with the typing pretended:

```python
age = "12"  # pretend the user typed 12
age = int(age)
print(age + 1)
```

---

## Other kinds of input and output

The keyboard and the screen are just the start:

| Inputs                         | Outputs                          |
| ------------------------------ | -------------------------------- |
| Clicks, taps and swipes        | Text and pictures on a screen    |
| Files (photos, documents)      | Saving files                     |
| Data from the web              | Sending messages or emails       |
| Sensors (camera, GPS, microphone) | Sound, vibration, lights      |

Every one of them fits the same pattern: something comes in, the program works on it, something goes out.

> 📝 **Note:** Every language has a way to show output. Python uses `print("Hi")`; JavaScript uses `console.log("Hi")`; PHP uses `echo "Hi";`.

## Challenge

> 🎯 **Challenge:** Use `print` with commas to show exactly these two lines, using the variables `name` and `messages`:
> `Hello, Sam` and `Messages: 3`

```python starter
name = "Sam"
messages = 3
# print the two lines here
```

```python solution
name = "Sam"
messages = 3
print("Hello,", name)
print("Messages:", messages)
```

```python check
lines = __stdout__.strip().splitlines()
assert len(lines) == 2, "Show exactly 2 lines, but there were " + str(len(lines))
assert lines[0] == "Hello, Sam", "Line 1 should be 'Hello, Sam' but was " + repr(lines[0])
assert lines[1] == "Messages: 3", "Line 2 should be 'Messages: 3' but was " + repr(lines[1])
```

**Reference:** [Python built-in functions: print() and input()](https://docs.python.org/3/library/functions.html#input)

```quiz
? easy: What are the three parts of almost every program?
+ Input, process, output
- Start, middle, end
- Text, numbers, pictures
- Keyboard, mouse, screen
> Programs take something in, work on it, and give something back.
? easy: Which of these is an output?
+ A message shown on the screen
- A key pressed on the keyboard
- A tap on the screen
- A photo coming in from the camera
> Output is what a program gives back, like text on a screen. The others are inputs.
? medium: What does this show?
~~~python
print("Score:", 7)
~~~
+ Score: 7
- Score:7
- "Score:", 7
- Score: , 7
> `print` shows its values separated by a single space, without quotes or commas.
? medium: A program runs `answer = input("Pick a number: ")` and the user types `20`. What type is `answer`?
+ `str` (text)
- `int` (whole number)
- `float` (decimal)
- `bool` (true or false)
> `input` always gives back text. Use `int()` to turn it into a number.
? hard: What does this show?
~~~python
age = "12"
print(age + "1")
print(int(age) + 1)
~~~
+ 121\n13
- 13\n13
- 13\n121
- 121\n121
> `age` is text, so `age + "1"` glues text into `121`. `int(age)` is the number 12, so adding 1 gives 13.
```

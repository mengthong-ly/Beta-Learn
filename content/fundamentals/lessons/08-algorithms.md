---
title: "Algorithms: step by step"
section: 3 · Thinking like a programmer
---

An **algorithm** is a precise, step-by-step method for getting something done. Before programmers write any code, they work out the algorithm.

---

## You already use algorithms

An algorithm is a way of solving a problem that works every time, whether a person or a machine follows it. A recipe is an algorithm for people.

| Task                          | The algorithm                                       |
| ----------------------------- | --------------------------------------------------- |
| Making tea                    | The steps in the recipe                             |
| Getting to a friend's house   | The directions: turns, streets, landmarks           |
| Finding a word in a dictionary | Open near the right letter, then go forwards or back |
| Adding two big numbers by hand | Add each column, right to left, carrying the 1s   |

Code is just an algorithm written in a language a computer can run.

---

## Precise, not vague

A person can follow fuzzy steps. A computer can't. Every step in an algorithm must say **exactly** what to do:

| Vague                       | Precise                                     |
| --------------------------- | ------------------------------------------- |
| Cook the pasta for a while  | Boil the pasta for 10 minutes               |
| Add some salt               | Add 1 teaspoon of salt                      |
| Go down the road a bit      | Walk 200 metres, then turn left at the bakery |

> 💡 **Key idea:** If two people could follow a step and do different things, it isn't precise enough yet.

---

## Pseudocode

Programmers often sketch an algorithm in **pseudocode**: plain-English steps laid out like code, but not in any real language. Nothing runs it; it's for thinking.

```text
fill the kettle with water
boil the kettle
put a tea bag in a cup
pour the boiling water into the cup
wait 3 minutes
take out the tea bag
if you like milk:
    add a splash of milk
```

Notice the last two lines. Algorithms don't just list steps: they can also make **decisions**.

---

## Three building blocks

Almost every algorithm is built from three kinds of step:

| Building block | Meaning                        | Pseudocode example             |
| -------------- | ------------------------------ | ------------------------------ |
| **Sequence**   | Do steps in order              | `boil the kettle`, then `pour` |
| **Decision**   | Do something only if it's true | `if you like milk: add milk`   |
| **Repetition** | Do something again and again   | `stir until the sugar is gone` |

Later in this course, each of these becomes a piece of real code.

---

## From pseudocode to code

Here's an algorithm to find the biggest number in a pile of cards:

```text
look at the first card and remember it as "biggest"
for each card in the pile:
    if this card is bigger than "biggest":
        remember this card as "biggest" instead
when you run out of cards, say "biggest"
```

And here it is in Python. Each line matches a step above:

```python
numbers = [4, 17, 9, 23, 8]
biggest = numbers[0]
for n in numbers:
    if n > biggest:
        biggest = n
print(biggest)
```

Press **Try it** and run it. You don't need to understand the Python yet: the algorithm is the hard part, and you've already got it.

---

## Test it by hand

Before trusting an algorithm, follow it yourself, step by step, exactly like a computer would. Here's the biggest-number algorithm with the cards 4, 17, 9, 23, 8:

| Card | Bigger than "biggest"? | "biggest" afterwards |
| ---- | ---------------------- | -------------------- |
| 4    | no (it's the first)    | 4                    |
| 17   | yes                    | 17                   |
| 9    | no                     | 17                   |
| 23   | yes                    | 23                   |
| 8    | no                     | 23                   |

The answer is 23. Following steps by hand like this is called **tracing**, and it's how programmers find mistakes before the computer does.

---

## Spot the missing step

Here's an algorithm for making toast. Try following it exactly:

```text
1. Put two slices of bread in the toaster
2. Wait until the toast pops up
3. Take out the toast
4. Spread butter on the toast
```

You'd wait forever: nobody pushed the lever down. A person fills that gap without thinking. A computer would wait at step 2 until someone switched it off.

> ⚠️ **Gotcha:** The steps that feel too obvious to write down are the ones most often missing. Computers need them all.

**Reference:** [MDN Glossary: Algorithm](https://developer.mozilla.org/en-US/docs/Glossary/Algorithm)

```quiz
? easy: What is an algorithm?
+ A precise, step-by-step method for getting something done
- A type of computer
- A programming language
- A mistake in a program
> An algorithm is a clear set of steps that solves a problem every time it's followed. A recipe is one.
? easy: Which step is precise enough for an algorithm?
+ Bake for 25 minutes at 180°C
- Bake until it seems done
- Bake for a while
- Bake it like last time
> A precise step says exactly what to do, so anyone (or any computer) following it does the same thing.
? medium: Put these steps for planting a seed in order. A) Water the soil. B) Dig a small hole. C) Put the seed in the hole. D) Cover the seed with soil.
+ B, C, D, A
- A, B, C, D
- C, B, D, A
- B, D, C, A
> Dig the hole, drop in the seed, cover it, then water. Order matters in an algorithm.
? medium: "1. Put bread in the toaster. 2. ___ 3. Wait until it pops up. 4. Take out the toast." What's the missing step?
+ Push the toaster's lever down
- Butter the toast
- Eat the toast
- Buy some bread
> Without switching the toaster on, step 3 waits forever. The obvious steps are the ones most often missing.
? hard: This version starts "biggest" at 0 instead of the first number. What does it print?
~~~python
numbers = [-5, -2, -9]
biggest = 0
for n in numbers:
    if n > biggest:
        biggest = n
print(biggest)
~~~
+ 0
- -2
- -9
- -5
> No number in the list is bigger than 0, so "biggest" never changes and the program prints 0, which isn't even in the list. Starting with the first number avoids this bug.
```

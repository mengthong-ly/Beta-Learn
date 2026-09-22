---
title: Summary statistics
section: 11 · Exploring Data
---

**Exploratory data analysis** (EDA) is getting to know a dataset before drawing conclusions: what's typical, what's unusual, how spread out things are. It starts with a few numbers.

## describe(): the one-line overview

For every numeric column: count, mean, standard deviation, min, the quartiles and max.

```python
import pandas as pd

df = pd.read_csv("students.csv")
print(df.describe())
```

On text columns, `describe` counts values instead: how many, how many distinct, the most common one (`top`) and how often it appears (`freq`).

```python
import pandas as pd

df = pd.read_csv("sales.csv")
print(df[["branch", "product", "payment"]].describe())
```

## The individual statistics

| Method        | Answers                                             |
| ------------- | --------------------------------------------------- |
| `.mean()`     | the average                                         |
| `.median()`   | the middle value when sorted                        |
| `.mode()`     | the most common value(s)                            |
| `.std()`      | how spread out values are around the mean           |
| `.min()` `.max()` | the extremes                                    |
| `.quantile(0.9)` | the value 90% of rows are below                  |
| `.count()`    | how many values are **not** missing                 |

```python
import pandas as pd

df = pd.read_csv("students.csv")
print(df["math"].mean(), df["math"].median(), df["math"].std().round(1))
print(df["math"].quantile([0.25, 0.5, 0.75]))
print(df[["math", "english", "science"]].mean())  # one mean per column
```

## Mean vs median

The mean is pulled by extreme values; the median isn't. When they differ a lot, something unusual is going on.

```python
import pandas as pd

salaries = pd.Series([400, 450, 500, 520, 480, 5000])  # one manager
print("mean:", salaries.mean())
print("median:", salaries.median())
```

The typical staff member earns about $490, but the mean says $1,225. For "typical" values, report the median.

## Who has the max? idxmax / idxmin

`max()` gives the value; `idxmax()` gives its **label**. Set a meaningful index and the label is the answer.

```python
import pandas as pd

df = pd.read_csv("students.csv").set_index("name")
print(df["science"].max(), df["science"].idxmax())
print(df["attendance"].idxmin(), "has the lowest attendance")
```

## Row-wise statistics

`axis=1` computes across each row instead of down each column, like a student's average over three subjects.

```python
import pandas as pd

df = pd.read_csv("students.csv").set_index("name")
df["avg"] = df[["math", "english", "science"]].mean(axis=1).round(1)
print(df["avg"].sort_values(ascending=False).head(3))
```

> 🔍 **Behind the scenes: what standard deviation means**
>
> `std` is roughly "how far a typical value sits from the mean". Math scores have a mean of 77.5 and a std of about 13, so most students are within ~13 points of 77.5 (between about 64 and 91). A small std means everyone is similar; a large one means the class is split. pandas uses the _sample_ formula (dividing by n − 1), which is why its result differs slightly from numpy's default.

## Challenge

> 🎯 **Challenge:** Load `students.csv` with `name` as the index. Set `avg_math` (mean math score), `median_english`, `best_science` (the **name** of the student with the highest science score) and `spread` (the standard deviation of math, rounded to 2 decimals).

```python starter
import pandas as pd

df = pd.read_csv("students.csv").set_index("name")

avg_math = 0
median_english = 0
best_science = ""
spread = 0

print(avg_math, median_english, best_science, spread)
```

```python solution
import pandas as pd

df = pd.read_csv("students.csv").set_index("name")

avg_math = df["math"].mean()
median_english = df["english"].median()
best_science = df["science"].idxmax()
spread = round(df["math"].std(), 2)

print(avg_math, median_english, best_science, spread)
```

```python check
assert avg_math == 77.5, f"avg_math should be 77.5, got {avg_math}"
assert median_english == 78.5, f"median_english should be 78.5, got {median_english}"
assert best_science == "Chenda", f"best_science should be a name ('Chenda'), got {best_science!r}. Use idxmax()."
assert spread == 13.12, f"spread should be 13.12, got {spread}"
```

---
title: DataFrames & reading CSVs
section: 7 · Intro to Pandas
---

A **DataFrame** is a whole table: rows and named columns. Each column is a Series, and they all share the same row labels (the index).

## Build one from a dict

Keys become column names; each list becomes a column.

```python
import pandas as pd

df = pd.DataFrame({
    "product": ["Iced Latte", "Americano", "Croissant"],
    "price": [2.50, 2.00, 1.80],
    "sold": [45, 28, 4],
})
print(df)
```

## Read a CSV file

In practice you rarely type data in: you load it. One line replaces all the `csv.DictReader` code from Session 5, **and** pandas converts numbers for you.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
print(df.head())        # first 5 rows (df.head(10) for 10)
```

> 💡 **Tip:** Wide tables don't wrap in the output pane: scroll it sideways to see every column.

## First look: always do these

Whenever you open a new dataset, ask: how big is it, what are the columns, what types are they?

```python
import pandas as pd

df = pd.read_csv("sales.csv")
print(df.shape)            # (rows, columns)
print(list(df.columns))
print(df.dtypes)
```

`df.info()` gives you all of that in one report, including how many values are **non-null** (not missing) per column, which becomes important in the cleaning session.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df.info()
```

> ⚠️ **Gotcha:** `df.shape` has no brackets (it's a value), but `df.head()` and `df.info()` do (they're methods). Forgetting the `()` prints something like `<bound method …>` instead of the data.

## A column is a Series

Square brackets with a column name give you that column as a Series, with everything from the last lesson.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
qty = df["quantity"]
print(type(qty).__name__, qty.sum(), qty.max())
print(df["branch"].tail(3))
```

> 🔍 **Behind the scenes: a DataFrame is a dict of columns**
>
> Internally a DataFrame keeps each column as its own array, plus one shared index. That's why working **down a column** (`df["quantity"].sum()`) is fast and natural, while looping **across rows** one by one is slow and awkward. Think in columns, not rows: it's the biggest mindset shift from plain Python lists.

## Challenge

> 🎯 **Challenge:** Load `students.csv` into `df`. Set `n_rows` and `n_cols` from its shape, `columns` to a **list** of the column names, and print the first 3 rows.

```python starter
import pandas as pd

df = None
n_rows = 0
n_cols = 0
columns = []

print(n_rows, n_cols, columns)
```

```python solution
import pandas as pd

df = pd.read_csv("students.csv")
n_rows, n_cols = df.shape
columns = list(df.columns)

print(n_rows, n_cols, columns)
print(df.head(3))
```

```python check
import pandas as _pd
assert isinstance(df, _pd.DataFrame), "Load the file with pd.read_csv('students.csv')."
assert (n_rows, n_cols) == (12, 6), f"students.csv has 12 rows and 6 columns, got {(n_rows, n_cols)}"
assert columns == ["name", "class", "math", "english", "science", "attendance"], "columns should be list(df.columns)."
assert "Vannak" in __stdout__ and "Srey Leak" not in __stdout__, "Print only the first 3 rows: df.head(3)."
```

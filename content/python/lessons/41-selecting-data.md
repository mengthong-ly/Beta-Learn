---
title: Selecting rows & columns
section: 7 · Intro to Pandas
---

Before you can analyse anything, you need to point at the part of the table you care about. pandas has three tools: `[]` for columns, `.loc` for **labels**, `.iloc` for **positions**.

## Columns with []

One name gives a **Series**; a **list** of names gives a smaller **DataFrame**.

```python
import pandas as pd

df = pd.read_csv("students.csv")
print(df["math"].head(3))
print(df[["name", "math", "english"]].head(3))   # note the double brackets
```

## Rows by position: .iloc

`.iloc` works like list indexing and slicing: 0-based, end **excluded**.

```python
import pandas as pd

df = pd.read_csv("students.csv")
print(df.iloc[0])        # first row (as a Series)
print(df.iloc[2:5])      # rows 2, 3, 4
print(df.iloc[-1]["name"])
```

## Rows by label: .loc

`.loc` uses the **index labels**. The default labels are 0, 1, 2…, which isn't very meaningful, so set a real column as the index with `set_index`.

```python
import pandas as pd

df = pd.read_csv("students.csv").set_index("name")
print(df.loc["Chenda"])                 # one row
print(df.loc["Chenda", "math"])         # one cell: row label, column name
print(df.loc[["Dara", "Nary"], ["math", "science"]])
```

> ⚠️ **Gotcha:** `.loc` slices **include** the end label, `.iloc` slices **exclude** the end position. `df.loc["Dara":"Pisey"]` includes Pisey; `df.iloc[0:4]` stops before row 4.

```python
import pandas as pd

df = pd.read_csv("students.csv").set_index("name")
print(df.loc["Dara":"Pisey", "math"])     # Dara, Sokha, Vannak, Srey Leak, Pisey
print(df.iloc[0:4, 1])                   # 4 rows, the column at position 1
```

## Quick reference

| You want                         | Write                          |
| -------------------------------- | ------------------------------ |
| one column                       | `df["math"]`                   |
| several columns                  | `df[["name", "math"]]`         |
| row by position                  | `df.iloc[3]`                   |
| row by label                     | `df.loc["Chenda"]`             |
| one cell                         | `df.loc["Chenda", "math"]`     |
| rows **and** columns             | `df.loc[rows, cols]`           |

> 🔍 **Behind the scenes: why two indexers?**
>
> The index isn't always 0, 1, 2. After sorting or filtering, row labels get shuffled or have gaps (`[7, 2, 9]`). Then "row 2" is ambiguous: the 3rd row, or the row _labelled_ 2? pandas used to guess, and guessed wrong often enough that it now makes you say which: `.iloc` = position, `.loc` = label.

## Challenge

> 🎯 **Challenge:** Load `students.csv` with `name` as the index. Set `chenda_math` to Chenda's math score, `scores` to a DataFrame with just the `math` and `english` columns, and `first_three` to the first three rows (by position).

```python starter
import pandas as pd

df = pd.read_csv("students.csv")

chenda_math = None
scores = None
first_three = None
```

```python solution
import pandas as pd

df = pd.read_csv("students.csv").set_index("name")

chenda_math = df.loc["Chenda", "math"]
scores = df[["math", "english"]]
first_three = df.iloc[:3]
print(chenda_math)
print(first_three)
```

```python check
import pandas as _pd
assert df.index.name == "name", "Use .set_index('name') so rows are labelled by name."
assert chenda_math == 95, f"Chenda's math score is 95, got {chenda_math}"
assert isinstance(scores, _pd.DataFrame) and list(scores.columns) == ["math", "english"], "scores needs double brackets: df[['math', 'english']]"
assert len(scores) == 12
assert list(first_three.index) == ["Dara", "Sokha", "Vannak"], "first_three should be df.iloc[:3]"
```

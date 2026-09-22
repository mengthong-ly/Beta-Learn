---
title: Sorting, renaming & dropping
section: 8 · Transforming Data
---

Three everyday tidy-ups: put rows in a useful order, give columns clear names, and remove what you don't need.

## sort_values

```python
import pandas as pd

df = pd.read_csv("students.csv")
print(df.sort_values("math", ascending=False).head(3))
```

Sort by several columns by passing lists: here by class A→Z, then best math first within each class.

```python
import pandas as pd

df = pd.read_csv("students.csv")
print(df.sort_values(["class", "math"], ascending=[True, False])[["name", "class", "math"]])
```

## rename

Pass a dict of `{old: new}` to `columns=`. Columns you don't mention keep their names.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df = df.rename(columns={"unit_price": "price", "quantity": "qty"})
print(list(df.columns))
```

## drop

Remove columns with `columns=`, or rows by their index label with `index=`.

```python
import pandas as pd

df = pd.read_csv("students.csv")
print(df.drop(columns=["attendance", "science"]).head(3))
print(len(df.drop(index=[0, 1])), "rows left")
```

## reset_index

After sorting or filtering, the row labels are jumbled (`6, 1, 11…`). `reset_index(drop=True)` numbers them 0, 1, 2… again. Without `drop=True`, the old labels are kept as a new column.

```python
import pandas as pd

df = pd.read_csv("students.csv").sort_values("math", ascending=False)
print(df.head(3).index.tolist())
print(df.reset_index(drop=True).head(3).index.tolist())
```

> ⚠️ **Gotcha:** these methods return a **new** DataFrame and leave the original alone. `df.sort_values("math")` on its own line does nothing you can see later. Assign the result: `df = df.sort_values("math")`.

> 💡 **Tip:** you can chain steps, one per line, inside parentheses. It reads top to bottom like a recipe:
>
> `ranked = (df.drop(columns=["attendance"]).sort_values("math", ascending=False).reset_index(drop=True))`

## Challenge

> 🎯 **Challenge:** Build `ranked` from `students.csv`: rename the `class` column to `group`, drop the `attendance` column, sort by `math` from highest to lowest, and reset the index so it runs 0, 1, 2…

```python starter
import pandas as pd

df = pd.read_csv("students.csv")

ranked = df

print(ranked.head())
```

```python solution
import pandas as pd

df = pd.read_csv("students.csv")

ranked = (
    df.rename(columns={"class": "group"})
    .drop(columns=["attendance"])
    .sort_values("math", ascending=False)
    .reset_index(drop=True)
)

print(ranked.head())
```

```python check
assert list(ranked.columns) == ["name", "group", "math", "english", "science"], f"Columns should be name, group, math, english, science; got {list(ranked.columns)}"
assert list(ranked["math"]) == sorted(ranked["math"], reverse=True), "Sort by math, highest first."
assert ranked.loc[0, "name"] == "Chenda", "Chenda (95) should be first."
assert list(ranked.index) == list(range(12)), "Reset the index with reset_index(drop=True)."
```

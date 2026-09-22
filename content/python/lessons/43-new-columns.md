---
title: Adding & computing columns
section: 8 · Transforming Data
---

The data you get rarely has the exact column you need. `sales.csv` has quantity and unit price, but no order total. You make it.

## Assign a new column

`df["new"] = …` adds a column (or replaces one with that name). Column math works row by row automatically.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]
df["total_riel"] = df["total"] * 4100
print(df[["product", "quantity", "unit_price", "total", "total_riel"]].head())
```

A single value is copied into every row:

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["currency"] = "USD"
print(df[["order_id", "currency"]].head(3))
```

## Conditional columns

For "this if the condition holds, otherwise that", use numpy's `where` (numpy comes with pandas).

```python
import numpy as np
import pandas as pd

df = pd.read_csv("sales.csv")
df["size"] = np.where(df["quantity"] >= 3, "large", "small")
print(df["size"].value_counts())
```

To change **some** rows of an existing column, use `.loc[mask, column]`:

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["discount"] = 0.0
df.loc[df["quantity"] >= 3, "discount"] = 0.10   # 10% off big orders
print(df[["quantity", "discount"]].head(8))
```

## assign: several columns in one step

`assign` returns a **new** DataFrame with the extra columns, which is handy for chaining steps together.

```python
import pandas as pd

df = pd.read_csv("sales.csv").assign(
    total=lambda d: d["quantity"] * d["unit_price"],
    is_coffee=lambda d: d["category"] == "Coffee",
)
print(df[["product", "total", "is_coffee"]].head(3))
```

> ⚠️ **Gotcha:** never change data in two bracket steps like `df["discount"][df["quantity"] >= 3] = 0.1`. In pandas 3 that silently does **nothing** to `df`. Always use one `.loc[rows, column] = value`.

> 🔍 **Behind the scenes: Copy-on-Write**
>
> Since pandas 3, **every** selection (`df["discount"]`, `df[mask]`, `df.head()`) behaves like a brand-new copy. Copies are made lazily (only when someone writes), so it stays fast. In `df["discount"][mask] = 0.1`, the first step hands you a copy of the column; the second step changes that copy, which is then thrown away. `df.loc[mask, "discount"] = 0.1` is a single operation on `df` itself, so it works. The rule is simple: to change a DataFrame, assign to it directly.

## Challenge

> 🎯 **Challenge:** Load `sales.csv` into `df`. Add a `total` column (quantity × unit price) and a `size` column that's `"large"` when quantity is **3 or more**, else `"small"`. Set `revenue` to the sum of `total`, rounded to 2 decimals.

```python starter
import pandas as pd

df = pd.read_csv("sales.csv")

revenue = 0

print(revenue)
```

```python solution
import numpy as np
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]
df["size"] = np.where(df["quantity"] >= 3, "large", "small")
revenue = round(df["total"].sum(), 2)

print(revenue)
print(df[["product", "quantity", "total", "size"]].head())
```

```python check
assert "total" in df.columns, "Add a 'total' column."
assert (df["total"] == df["quantity"] * df["unit_price"]).all(), "total = quantity * unit_price"
assert "size" in df.columns, "Add a 'size' column."
assert list(df["size"]) == ["large" if q >= 3 else "small" for q in df["quantity"]], "size is 'large' when quantity >= 3, else 'small'."
assert revenue == 319.95, f"revenue should be 319.95, got {revenue}"
```

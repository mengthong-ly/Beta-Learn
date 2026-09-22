---
title: Pivot tables & crosstab
section: 12 · Grouping & Insights
---

Grouping by two columns gives a long list. A **pivot table** spreads one of the keys across the top, giving a grid that's much easier to read: branches down the side, categories across, revenue in the cells. Exactly like a pivot table in Excel or Google Sheets.

## pivot_table

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]

grid = df.pivot_table(index="branch", columns="category", values="total", aggfunc="sum")
print(grid)
```

| Argument     | Means                                  |
| ------------ | -------------------------------------- |
| `index=`     | what goes **down** the side (rows)     |
| `columns=`   | what goes **across** the top           |
| `values=`    | the column being summarised            |
| `aggfunc=`   | how: `"sum"`, `"mean"`, `"count"`, …   |
| `fill_value=`| what to show for empty combinations    |
| `margins=`   | `True` adds an "All" total row and column |

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]

print(df.pivot_table(index="product", columns="branch", values="quantity",
                     aggfunc="sum", fill_value=0, margins=True))
```

## Over time

Put a date part in `columns=` and you get a trend table.

```python
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["total"] = df["quantity"] * df["unit_price"]
df["month"] = df["date"].dt.month

print(df.pivot_table(index="branch", columns="month", values="total", aggfunc="sum").round(2))
```

## crosstab: count combinations

`pd.crosstab(rows, columns)` counts how often each pair occurs. `normalize="index"` turns each row into percentages.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
print(pd.crosstab(df["branch"], df["payment"]))
print(pd.crosstab(df["branch"], df["payment"], normalize="index").round(2))
```

> 🧭 **Scenario:** The owner asked whether to drop card payments. The crosstab shows the answer differs by branch: look at which branch relies on cards the most before deciding. One table, one conversation, no guessing.

> ⚠️ **Gotcha:** `pivot_table` summarises (duplicates are aggregated). Its cousin `pivot` only **reshapes** and raises an error if any row/column pair appears twice. When in doubt, use `pivot_table`.

## Challenge

> 🎯 **Challenge:** From `sales.csv`, set `pivot` to a pivot table of **total revenue** with branches as rows and categories as columns (`fill_value=0`), and `payments` to a `crosstab` counting orders by branch (rows) and payment method (columns).

```python starter
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]

pivot = None
payments = None

print(pivot)
print(payments)
```

```python solution
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]

pivot = df.pivot_table(index="branch", columns="category", values="total", aggfunc="sum", fill_value=0)
payments = pd.crosstab(df["branch"], df["payment"])

print(pivot)
print(payments)
```

```python check
import pandas as _pd
assert isinstance(pivot, _pd.DataFrame), "pivot should be a DataFrame from df.pivot_table(...)."
assert list(pivot.index) == ["Battambang", "Phnom Penh", "Siem Reap"] and list(pivot.columns) == ["Coffee", "Food", "Tea"], "Branches down the side (index=), categories across (columns=)."
assert round(pivot.loc["Phnom Penh", "Coffee"], 2) == 105.0, "The cells should be summed revenue (values='total', aggfunc='sum')."
assert isinstance(payments, _pd.DataFrame) and payments.loc["Phnom Penh"].sum() == 34, "payments: pd.crosstab(df['branch'], df['payment'])."
assert int(payments.values.sum()) == 72
```

---
title: Several statistics at once with agg
section: 12 · Grouping & Insights
---

A real summary needs several numbers per group: revenue **and** number of orders **and** average order size. `agg` computes them all in one pass.

## A list of statistics

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]
print(df.groupby("branch")["total"].agg(["sum", "count", "mean"]).round(2))
```

## Named aggregation: clear column names

Each keyword becomes an output column: `name=("source column", "statistic")`. This is the style to use in reports.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]

summary = df.groupby("branch").agg(
    revenue=("total", "sum"),
    orders=("order_id", "count"),
    items=("quantity", "sum"),
    avg_order=("total", "mean"),
).round(2)
print(summary)
```

Look at `avg_order`: Battambang has the fewest orders but the **biggest** average order. That's the kind of insight a single total hides.

## Useful statistics for agg

| Name                   | Gives                          |
| ---------------------- | ------------------------------ |
| `"sum"`, `"mean"`, `"median"` | as you'd expect         |
| `"count"`              | non-missing values             |
| `"size"`               | rows (including missing)       |
| `"min"`, `"max"`       | extremes                       |
| `"nunique"`            | number of distinct values      |
| `"first"`, `"last"`    | first / last value in the group |

```python
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
print(df.groupby("branch").agg(
    first_sale=("date", "min"),
    last_sale=("date", "max"),
    products=("product", "nunique"),
))
```

## Rank the groups

The result is a normal DataFrame, so sort it, take the top rows, or add columns computed from the summary.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]

summary = df.groupby("branch").agg(revenue=("total", "sum"), orders=("order_id", "count"))
summary["share"] = (summary["revenue"] / summary["revenue"].sum()).map("{:.0%}".format)
print(summary.sort_values("revenue", ascending=False))
```

> 💡 **Tip:** you can also pass your own function: `agg(spread=("total", lambda s: s.max() - s.min()))`.

## Challenge

> 🎯 **Challenge:** Build `summary`: one row **per product** from `sales.csv`, with columns `revenue` (sum of total), `units` (sum of quantity) and `orders` (number of orders), sorted by revenue from highest to lowest.

```python starter
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]

summary = None

print(summary)
```

```python solution
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]

summary = (
    df.groupby("product")
    .agg(revenue=("total", "sum"), units=("quantity", "sum"), orders=("order_id", "count"))
    .sort_values("revenue", ascending=False)
)

print(summary)
```

```python check
import pandas as _pd
assert isinstance(summary, _pd.DataFrame), "summary should be a DataFrame from groupby(...).agg(...)."
assert list(summary.columns) == ["revenue", "units", "orders"], f"Columns should be revenue, units, orders; got {list(summary.columns)}"
assert summary.index[0] == "Iced Latte" and list(summary["revenue"]) == sorted(summary["revenue"], reverse=True), "Sort by revenue, highest first."
assert summary.loc["Iced Latte", "units"] == 45 and summary.loc["Iced Latte", "orders"] == 26, "Check units (sum of quantity) and orders (count)."
assert len(summary) == 8
```

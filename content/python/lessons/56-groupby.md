---
title: groupby: split, apply, combine
section: 12 · Grouping & Insights
---

"Revenue **per branch**." "Average score **per class**." "Orders **per weekday**." Any question with _per_ in it is a `groupby`. It's the most useful tool in pandas.

## The pattern

`df.groupby(key)[column].statistic()`: group the rows by `key`, pick a column, summarise each group.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]
print(df.groupby("branch")["total"].sum())
```

Remember the loop and the dict of running totals you wrote in _Lists of records_? That's this one line.

## Any statistic works

```python
import pandas as pd

df = pd.read_csv("students.csv")
print(df.groupby("class")["math"].mean())
print(df.groupby("class")["attendance"].min())
print(df.groupby("class")[["math", "english", "science"]].mean().round(1))
```

## Counting rows per group: size

`size()` counts the rows in each group, which is how many orders, how many students, etc.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
print(df.groupby("payment").size())
print(df.groupby("branch").size().sort_values(ascending=False))
```

## Group by several columns

A list of keys gives one row per **combination**.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]
print(df.groupby(["branch", "category"])["total"].sum())
```

## Group by something computed

The key can be any Series of the same length, like the month of each date.

```python
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["total"] = df["quantity"] * df["unit_price"]
print(df.groupby(df["date"].dt.month_name(), sort=False)["total"].sum())
```

## Back to a normal table: reset_index

The group keys become the result's **index**. `reset_index()` turns them back into ordinary columns, ready for merging, sorting or saving.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]
table = df.groupby("branch")["total"].sum().reset_index()
print(table)
print(list(table.columns))
```

> 🔍 **Behind the scenes: split → apply → combine**
>
> `groupby` doesn't copy your data into separate tables. It computes, for each row, which group it belongs to (a list of group numbers). Then the statistic runs over each group's rows in compiled code, and the results are **combined** into a new Series with one entry per group. The name for this is _split-apply-combine_, and it's the same idea as `GROUP BY` in SQL and pivot tables in Excel.

## Challenge

> 🎯 **Challenge:** Using `sales.csv` with a `total` column, set `by_branch` to revenue per branch **sorted from highest to lowest**, `best_branch` to the name of the top branch, and `orders_per_payment` to the number of orders per payment method.

```python starter
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]

by_branch = None
best_branch = ""
orders_per_payment = None

print(by_branch)
```

```python solution
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]

by_branch = df.groupby("branch")["total"].sum().sort_values(ascending=False)
best_branch = by_branch.index[0]
orders_per_payment = df.groupby("payment").size()

print(by_branch)
print(best_branch)
print(orders_per_payment)
```

```python check
assert by_branch is not None and list(by_branch.index) == ["Phnom Penh", "Battambang", "Siem Reap"], "by_branch: group by branch, sum total, sort_values(ascending=False)."
assert round(by_branch.iloc[0], 2) == 139.3, f"Phnom Penh's revenue is 139.30, got {by_branch.iloc[0]}"
assert best_branch == "Phnom Penh", f"best_branch should be 'Phnom Penh', got {best_branch!r}"
assert orders_per_payment is not None and dict(orders_per_payment) == {"Card": 20, "Cash": 18, "KHQR": 34}, f"orders_per_payment looks off: {orders_per_payment}"
```

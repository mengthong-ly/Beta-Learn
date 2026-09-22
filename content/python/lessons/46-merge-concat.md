---
title: Combining tables: concat & merge
section: 8 · Transforming Data
---

Data often arrives in pieces: one file per month, or orders in one table and branch details in another. `concat` stacks tables; `merge` joins them side by side on a shared column.

## concat: stack rows

Tables with the same columns go on top of each other. `ignore_index=True` renumbers the rows.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
jan = df[df["date"].str.startswith("2026-01")]
feb = df[df["date"].str.startswith("2026-02")]

both = pd.concat([jan, feb], ignore_index=True)
print(len(jan), "+", len(feb), "=", len(both))
```

## merge: look up matching details

`branches.csv` has one row per branch: its manager, opening date and seats. `merge` adds those details to every sale whose `branch` matches, like VLOOKUP in a spreadsheet.

```python
import pandas as pd

branches = pd.read_csv("branches.csv")
print(branches)
```

```python
import pandas as pd

sales = pd.read_csv("sales.csv")
branches = pd.read_csv("branches.csv")

merged = sales.merge(branches, on="branch", how="left")
print(merged[["order_id", "branch", "product", "manager", "seats"]].head())
```

## Which rows survive? The `how=` argument

| `how=`    | Keeps                                            |
| --------- | ------------------------------------------------ |
| `"inner"` | only keys found in **both** tables (the default) |
| `"left"`  | every row of the left table                      |
| `"right"` | every row of the right table                     |
| `"outer"` | every key from either table                      |

Kampot is in `branches.csv` but hasn't opened yet, so it has no sales. `indicator=True` adds a `_merge` column saying where each row came from, a great way to find what didn't match.

```python
import pandas as pd

sales = pd.read_csv("sales.csv")
branches = pd.read_csv("branches.csv")

check = branches.merge(sales, on="branch", how="left", indicator=True)
print(check.drop_duplicates("branch")[["branch", "_merge"]])
```

> ⚠️ **Gotcha:** if the key column has different names (`branch` vs `branch_name`), use `left_on="branch", right_on="branch_name"`. And watch the row count: if the right table has **duplicate** keys, each left row is repeated once per match, and your totals quietly double.

> 🧭 **Scenario:** Finance wants revenue per seat for each branch. Revenue lives in the sales table, seats in the branches table: merge, then compute. Joining tables is how most real questions get answered.

## Challenge

> 🎯 **Challenge:** Merge `sales.csv` with `branches.csv` on `branch`, keeping every sale, and store it in `merged`. Then set `no_sales` to a **list** of the branch names in `branches.csv` that have **no** sales at all.

```python starter
import pandas as pd

sales = pd.read_csv("sales.csv")
branches = pd.read_csv("branches.csv")

merged = sales
no_sales = []

print(no_sales)
```

```python solution
import pandas as pd

sales = pd.read_csv("sales.csv")
branches = pd.read_csv("branches.csv")

merged = sales.merge(branches, on="branch", how="left")
no_sales = list(branches[~branches["branch"].isin(sales["branch"])]["branch"])

print(merged[["branch", "manager"]].head())
print(no_sales)
```

```python check
assert len(merged) == 72, f"Keep every sale (72 rows), got {len(merged)}. Use how='left'."
assert "manager" in merged.columns and "seats" in merged.columns, "merged should include the branch details."
assert merged["manager"].notna().all(), "Every sale's branch should have a manager."
assert list(no_sales) == ["Kampot"], f"no_sales should be ['Kampot'], got {no_sales}"
```

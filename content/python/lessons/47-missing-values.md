---
title: Missing values
section: 9 · Cleaning Data
---

Real data has holes: a cashier skipped a field, a sensor dropped out, an export went wrong. From here on we'll use `sales_raw.csv`, a messy April export from the same café chain. Rule one of cleaning: **find the problems before you fix them**.

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
print(raw)
```

## How pandas marks "missing"

Empty cells become `NaN` ("not a number"), pandas' missing marker. `read_csv` also treats common placeholders like `NA`, `n/a`, `null` and `NaN` as missing: order 2010's quantity says `n/a` in the file and arrives as `NaN`.

## Find them

`isna()` gives True where a value is missing; `.sum()` counts per column.

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
print(raw.isna().sum())
print(raw[raw["quantity"].isna()])   # show the rows themselves
```

> ⚠️ **Gotcha:** don't test with `== None` or `== np.nan`. `NaN` is never equal to anything, **not even itself**, so `raw["quantity"] == np.nan` is False everywhere. Always use `isna()` / `notna()`.

## Option 1: drop them

`dropna()` removes rows with **any** missing value; `subset=` limits which columns count.

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
print(len(raw), "rows")
print(len(raw.dropna()), "rows with nothing missing")
print(len(raw.dropna(subset=["quantity"])), "rows with a quantity")
```

## Option 2: fill them

`fillna(value)` replaces missing values. Pick a fill that makes sense for that column: a default, the median, the most common value, or an honest "Unknown".

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
raw["quantity"] = raw["quantity"].fillna(raw["quantity"].median())
raw["payment"] = raw["payment"].fillna("Unknown")
print(raw.isna().sum().sum(), "missing values left")
print(raw["payment"].value_counts())
```

> ⚠️ **Gotcha:** assign the result back to the column: `raw["q"] = raw["q"].fillna(0)`. The old habit `raw["q"].fillna(0, inplace=True)` changes a temporary copy in pandas 3 and leaves `raw` untouched.

## Which option?

| Situation                                               | Usually                            |
| ------------------------------------------------------- | ---------------------------------- |
| a handful of rows, and the missing field is essential    | drop the rows                      |
| a sensible default exists (e.g. quantity missing = 1)    | fill with the default              |
| numbers where the typical value is fine                  | fill with the median               |
| text/categories                                          | fill with `"Unknown"`              |
| most of a column is missing                              | drop the **column**                |

> 🧭 **Scenario:** Two orders have no quantity, but each order is a real sale (it has a price and an ID), so dropping them would under-count revenue. The owner confirms the till defaults to 1 item. Filling with 1 is a decision based on how the data was _produced_, not a guess. Always write down why you filled what you filled.

## Challenge

> 🎯 **Challenge:** Load `sales_raw.csv` into `raw`. Set `n_missing_qty` to how many quantities are missing. Then fill missing `quantity` values with `1` and missing `payment` values with `"Unknown"` so that `raw` has **no** missing values left.

```python starter
import pandas as pd

raw = pd.read_csv("sales_raw.csv")

n_missing_qty = 0

print(n_missing_qty)
print(raw.isna().sum())
```

```python solution
import pandas as pd

raw = pd.read_csv("sales_raw.csv")

n_missing_qty = raw["quantity"].isna().sum()
raw["quantity"] = raw["quantity"].fillna(1)
raw["payment"] = raw["payment"].fillna("Unknown")

print(n_missing_qty)
print(raw.isna().sum())
```

```python check
assert n_missing_qty == 2, f"Two quantities are missing (one blank, one 'n/a'), got {n_missing_qty}"
assert raw.isna().sum().sum() == 0, "raw still has missing values. Did you assign the filled column back?"
assert len(raw) == 20, "Fill, don't drop: raw should still have 20 rows."
assert list(raw.loc[raw["order_id"].isin([2003, 2010]), "quantity"]) == [1, 1], "Missing quantities should become 1."
assert (raw["payment"] == "Unknown").sum() == 3, "The 3 missing payments should be 'Unknown'."
```

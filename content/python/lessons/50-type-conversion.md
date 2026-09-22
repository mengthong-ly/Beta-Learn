---
title: Converting data types
section: 10 · Types & Formatting
---

A column's **dtype** decides what you can do with it. You can't sum a price stored as text like `"$2.50"`, and a quantity stored as `2.0` looks odd on a receipt. Check the dtypes first, then convert.

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
print(raw.dtypes)
```

Two surprises: `unit_price` is `str` (because of the `$` signs), and `quantity` is `float64` even though every quantity is a whole number.

## The common dtypes

| dtype            | Holds                         | Example        |
| ---------------- | ----------------------------- | -------------- |
| `int64`          | whole numbers                 | `3`            |
| `float64`        | decimals (and `NaN`)          | `2.5`          |
| `str`            | text                          | `"Iced Latte"` |
| `bool`           | True / False                  | `True`         |
| `datetime64[…]`  | dates and times (next lesson) | `2026-04-01`   |

## astype: convert when the values are clean

```python
import pandas as pd

df = pd.read_csv("students.csv")
print(df["math"].astype(float).head(3))
print(df["math"].astype(str).head(3))
```

## Clean text, then convert

`"$2.50"` can't become a number until the `$` is gone.

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
raw["unit_price"] = raw["unit_price"].str.replace("$", "", regex=False).astype(float)
print(raw["unit_price"].dtype, raw["unit_price"].sum())
```

> 💡 **Tip:** `regex=False` means "treat `$` as a plain character". In regular expressions `$` means "end of text", so being explicit avoids a nasty surprise.

## to_numeric: convert what you can

`astype` crashes on the first value it can't convert. `pd.to_numeric(..., errors="coerce")` turns bad values into `NaN` instead, so you can find and deal with them.

```python
import pandas as pd

s = pd.Series(["12", "7", "seven", "3.5", ""])
print(pd.to_numeric(s, errors="coerce"))
```

## Why is quantity a float? (NaN)

`NaN` is technically a float, so an integer column with a missing value becomes `float64`. Fill the gaps first, then convert to `int`.

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
raw["quantity"] = raw["quantity"].fillna(1).astype(int)
print(raw["quantity"].dtype, raw["quantity"].tolist()[:5])
```

> 📝 **Note:** Here you'll see `int32`: this app runs Python inside your browser, which is a 32-bit platform, so `astype(int)` picks 32-bit integers. On your laptop (and in class) the same code gives `int64`. Both hold whole numbers; only the maximum size differs.

If you need to keep the gaps, the nullable `"Int64"` dtype (capital I) holds whole numbers **and** missing values:

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
print(raw["quantity"].astype("Int64").tolist())
```

> 🔍 **Behind the scenes: the category dtype**
>
> A column like `branch` repeats the same few strings thousands of times. `astype("category")` stores each distinct value once and keeps a small integer code per row, which saves memory and makes grouping faster on big data. It also documents intent: this column has a fixed set of values. Try `raw["payment"].astype("category").cat.categories`.

## Challenge

> 🎯 **Challenge:** Load `sales_raw.csv` into `raw`. Convert `unit_price` to `float` (remove the `$`), fill missing `quantity` with `1` and convert it to `int`, then add a `total` column and set `revenue` to its sum, rounded to 2 decimals.

```python starter
import pandas as pd

raw = pd.read_csv("sales_raw.csv")

revenue = 0

print(raw.dtypes)
print(revenue)
```

```python solution
import pandas as pd

raw = pd.read_csv("sales_raw.csv")

raw["unit_price"] = raw["unit_price"].str.replace("$", "", regex=False).astype(float)
raw["quantity"] = raw["quantity"].fillna(1).astype(int)
raw["total"] = raw["quantity"] * raw["unit_price"]
revenue = round(raw["total"].sum(), 2)

print(raw.dtypes)
print(revenue)
```

```python check
import pandas as _pd
assert raw["unit_price"].dtype == "float64", f"unit_price should be float64, got {raw['unit_price'].dtype}"
assert _pd.api.types.is_integer_dtype(raw["quantity"]) and raw["quantity"].notna().all(), f"quantity should be whole numbers (int), got {raw['quantity'].dtype}"
assert "total" in raw.columns, "Add a 'total' column."
assert revenue == 78.95, f"revenue should be 78.95, got {revenue}"
```

---
title: map, apply & replace
section: 8 · Transforming Data
---

Column math covers a lot, but sometimes each value needs a lookup or your own rule. That's what `map`, `apply` and `replace` are for.

## map with a dict: lookups

Give `Series.map` a dict and every value is swapped for its match. Values missing from the dict become `NaN` (missing).

```python
import pandas as pd

df = pd.read_csv("sales.csv")
codes = {"Phnom Penh": "PP", "Siem Reap": "SR", "Battambang": "BB"}
df["code"] = df["branch"].map(codes)
print(df[["branch", "code"]].head())
```

## map or apply with a function: your own rule

Pass any function, including one you wrote. It's called once per value.

```python
import pandas as pd

def band(price):
    if price < 2:
        return "cheap"
    elif price <= 3:
        return "regular"
    return "premium"

df = pd.read_csv("sales.csv")
df["band"] = df["unit_price"].map(band)
print(df[["product", "unit_price", "band"]].drop_duplicates("product"))
```

`Series.apply(func)` does the same thing for a single column. Use whichever reads better; `map` is the one that also accepts a dict.

## apply across rows

With `axis=1`, `DataFrame.apply` calls your function once per **row**, passing the row as a Series, so it can combine several columns.

```python
import pandas as pd

df = pd.read_csv("students.csv")
df["label"] = df.apply(lambda row: f"{row['name']} ({row['class']})", axis=1)
print(df["label"].head(3))
```

## replace: fix specific values

`replace` swaps exact values and leaves everything else alone (unlike `map`, which turns unmatched values into `NaN`).

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["payment"] = df["payment"].replace({"KHQR": "Bakong QR"})
print(df["payment"].value_counts())
```

> 🔍 **Behind the scenes: apply is a loop in disguise**
>
> `df["a"] * df["b"]` runs in compiled numpy code. `apply` and `map` with a function call **your Python function once per value**, so they're as slow as a `for` loop, which is fine for thousands of rows, painful for millions. Reach for column math or `np.where` first, and `apply` when the rule really needs Python.

## Challenge

> 🎯 **Challenge:** Load `sales.csv` into `df`. Add a `code` column that maps each branch to `PP`, `SR` or `BB` using a dict, and a `price_band` column using a function: `"cheap"` under $2, `"regular"` from $2 to $3 (inclusive), `"premium"` above $3.

```python starter
import pandas as pd

df = pd.read_csv("sales.csv")

def band(price):
    return "?"

print(df.head())
```

```python solution
import pandas as pd

df = pd.read_csv("sales.csv")

def band(price):
    if price < 2:
        return "cheap"
    elif price <= 3:
        return "regular"
    return "premium"

df["code"] = df["branch"].map({"Phnom Penh": "PP", "Siem Reap": "SR", "Battambang": "BB"})
df["price_band"] = df["unit_price"].map(band)

print(df[["branch", "code", "unit_price", "price_band"]].head())
```

```python check
assert "code" in df.columns, "Add a 'code' column."
assert dict(zip(df["branch"], df["code"])) == {"Phnom Penh": "PP", "Siem Reap": "SR", "Battambang": "BB"}, "Map Phnom Penh→PP, Siem Reap→SR, Battambang→BB."
assert "price_band" in df.columns, "Add a 'price_band' column."
_want = {1.5: "cheap", 1.75: "cheap", 1.8: "cheap", 2.0: "regular", 2.5: "regular", 2.75: "regular", 3.5: "premium"}
assert dict(zip(df["unit_price"], df["price_band"])) == _want, "Check your boundaries: 2.00 is regular, 3.50 is premium."
```

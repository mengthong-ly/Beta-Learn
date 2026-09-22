---
title: "Capstone: from raw data to insights"
section: 12 · Grouping & Insights
---

Time to put the whole course together. The café owner sends April's raw export, `sales_raw.csv`, and asks three questions: **Which branch earned the most? What's our best-selling product? How do customers pay?**

You know every step already. The skill now is doing them **in the right order** and checking your work as you go.

## 1. Look before you touch

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
print(raw.shape)
print(raw.dtypes)
print(raw.isna().sum())
print(raw.duplicated().sum(), "duplicate rows")
print(raw["branch"].value_counts())
```

Write down what's wrong: duplicates, messy text in three columns, prices stored as text with `$`, missing quantities and payments, dates as text.

## 2. Clean, in a sensible order

Order matters: fix text **before** looking for duplicates (so `" phnom penh"` and `"Phnom Penh"` match), and fix types **before** computing anything.

```python
import pandas as pd

df = pd.read_csv("sales_raw.csv")

# text
df["branch"] = df["branch"].str.strip().str.title().replace({"Battambong": "Battambang"})
df["product"] = df["product"].str.strip().str.title()
df["payment"] = df["payment"].str.strip().str.title().replace({"Khqr": "KHQR"})

# duplicates (after the text is consistent)
df = df.drop_duplicates().reset_index(drop=True)

# missing values
df["quantity"] = df["quantity"].fillna(1)
df["payment"] = df["payment"].fillna("Unknown")

# types
df["unit_price"] = df["unit_price"].str.replace("$", "", regex=False).astype(float)
df["quantity"] = df["quantity"].astype(int)
df["date"] = pd.to_datetime(df["date"])

# new columns
df["total"] = df["quantity"] * df["unit_price"]

print(df.dtypes)
print(df.head())
```

## 3. Verify the cleaning

Never trust a cleaning step you didn't check. A few asserts turn assumptions into facts, and fail loudly if next month's file is different.

```python
import pandas as pd

df = pd.read_csv("sales_raw.csv")
df["branch"] = df["branch"].str.strip().str.title().replace({"Battambong": "Battambang"})
df = df.drop_duplicates()

assert df["order_id"].is_unique, "duplicate orders left"
assert set(df["branch"]) == {"Phnom Penh", "Siem Reap", "Battambang"}, "unexpected branch name"
print("checks passed:", len(df), "orders")
```

## 4. Enrich: bring in the categories

The raw export has no `category`, but `sales.csv` knows each product's category. Build a lookup table and merge.

```python
import pandas as pd

categories = pd.read_csv("sales.csv")[["product", "category"]].drop_duplicates()
print(categories)
```

## 5. Answer the questions

```python
import pandas as pd

df = pd.read_csv("sales_raw.csv")
df["branch"] = df["branch"].str.strip().str.title().replace({"Battambong": "Battambang"})
df["product"] = df["product"].str.strip().str.title()
df["payment"] = df["payment"].str.strip().str.title().replace({"Khqr": "KHQR"}).fillna("Unknown")
df = df.drop_duplicates().reset_index(drop=True)
df["unit_price"] = df["unit_price"].str.replace("$", "", regex=False).astype(float)
df["quantity"] = df["quantity"].fillna(1).astype(int)
df["total"] = df["quantity"] * df["unit_price"]
categories = pd.read_csv("sales.csv")[["product", "category"]].drop_duplicates()
df = df.merge(categories, on="product", how="left")

by_branch = df.groupby("branch")["total"].sum().sort_values(ascending=False)
by_product = df.groupby("product").agg(revenue=("total", "sum"), units=("quantity", "sum"))
pay = df["payment"].value_counts(normalize=True)

print(f"Revenue in April: ${df['total'].sum():,.2f} from {len(df)} orders\n")
for branch, amount in by_branch.items():
    print(f"  {branch:<12}${amount:>7,.2f}")
top = by_product["revenue"].idxmax()
print(f"\nBest seller: {top} (${by_product.loc[top, 'revenue']:.2f}, {by_product.loc[top, 'units']} sold)")
print(f"Paid by KHQR: {pay['KHQR']:.0%}")
print(df.pivot_table(index="branch", columns="category", values="total", aggfunc="sum", fill_value=0))
```

> 🧭 **Scenario:** This is what a data analyst's week looks like: 80% cleaning and checking, 20% analysis. Wrapping the cleaning in a function (the challenge) means next month you run one line on the new file instead of repeating everything.

## What you've learned

Across twelve sessions you went from `print("Hello")` to a complete data pipeline: variables, strings, lists and loops; functions and classes; files and CSVs; and pandas for selecting, transforming, cleaning, converting, exploring and grouping. Keep going: pick any CSV you care about (your own spending, a public dataset) and ask it three questions.

## Challenge

> 🎯 **Challenge:** Write `clean_sales(path)` that loads a raw export like `sales_raw.csv` and returns a clean DataFrame: text columns stripped and Title Case (`Battambong` fixed, `KHQR` kept in capitals), duplicates removed with a fresh index, missing quantity → `1` (as int), missing payment → `"Unknown"`, `unit_price` as float, and a `total` column. Then set `clean = clean_sales("sales_raw.csv")` and `top_branch` to the branch with the highest revenue.

```python starter
import pandas as pd

def clean_sales(path):
    df = pd.read_csv(path)
    return df

clean = clean_sales("sales_raw.csv")
top_branch = ""

print(clean.head())
print(top_branch)
```

```python solution
import pandas as pd

def clean_sales(path):
    df = pd.read_csv(path)
    df["branch"] = df["branch"].str.strip().str.title().replace({"Battambong": "Battambang"})
    df["product"] = df["product"].str.strip().str.title()
    df["payment"] = df["payment"].str.strip().str.title().replace({"Khqr": "KHQR"})
    df = df.drop_duplicates().reset_index(drop=True)
    df["quantity"] = df["quantity"].fillna(1).astype(int)
    df["payment"] = df["payment"].fillna("Unknown")
    df["unit_price"] = df["unit_price"].str.replace("$", "", regex=False).astype(float)
    df["total"] = df["quantity"] * df["unit_price"]
    return df

clean = clean_sales("sales_raw.csv")
top_branch = clean.groupby("branch")["total"].sum().idxmax()

print(clean.head())
print(top_branch)
```

```python check
import pandas as _pd
assert len(clean) == 18 and clean["order_id"].is_unique, f"Remove the duplicates: expected 18 unique orders, got {len(clean)}."
assert list(clean.index) == list(range(18)), "Reset the index after dropping duplicates."
assert clean.isna().sum().sum() == 0, "No missing values should be left."
assert set(clean["branch"]) == {"Phnom Penh", "Siem Reap", "Battambang"}, f"Branch names aren't clean: {sorted(set(clean['branch']))}"
assert set(clean["payment"]) == {"KHQR", "Cash", "Card", "Unknown"}, f"Payment values aren't clean: {sorted(set(clean['payment']))}"
assert clean["unit_price"].dtype == "float64" and _pd.api.types.is_integer_dtype(clean["quantity"]), "unit_price should be float, quantity int."
assert round(clean["total"].sum(), 2) == 72.95, f"Total revenue should be 72.95, got {round(clean['total'].sum(), 2)}"
assert top_branch == "Phnom Penh", f"top_branch should be 'Phnom Penh', got {top_branch!r}"
with open("_mini.csv", "w") as _f:
    _f.write("order_id,date,branch,product,quantity,unit_price,payment\n1,2026-05-01, siem reap ,MOCHA,,$3.00,khqr\n1,2026-05-01,Siem Reap,Mocha,,$3.00,KHQR\n")
_m = clean_sales("_mini.csv")
assert len(_m) == 1 and _m.loc[0, "total"] == 3.0 and _m.loc[0, "payment"] == "KHQR", "clean_sales should work on any file with the same columns (tested on a small new file)."
```

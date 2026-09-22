---
title: Filtering with conditions
section: 7 · Intro to Pandas
---

"Show me only the orders over $5." "Only Phnom Penh." "Only coffee paid by KHQR." Filtering answers questions like these, and it's built on the boolean Series you met with `sales > 100`.

## A mask keeps the True rows

A comparison on a column gives one True/False per row, called a **mask**. Put the mask inside `df[...]` to keep only the True rows.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
mask = df["quantity"] >= 3
print(mask.head())
print(df[mask][["order_id", "product", "quantity"]])
```

Usually you write it in one go: `df[df["quantity"] >= 3]`.

## Combining conditions: & | ~

Use `&` (and), `|` (or) and `~` (not), and wrap **each condition in parentheses**.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
pp_coffee = df[(df["branch"] == "Phnom Penh") & (df["category"] == "Coffee")]
print(len(pp_coffee), "coffee orders in Phnom Penh")

not_cash = df[~(df["payment"] == "Cash")]
print(len(not_cash), "orders not paid in cash")
```

> ⚠️ **Gotcha:** `and`/`or` don't work on Series: you get `ValueError: The truth value of a Series is ambiguous`. Use `&`/`|`. And without parentheses, `df["a"] > 1 & df["b"] < 5` is parsed as `df["a"] > (1 & df["b"]) < 5`, which is nonsense.

## Handy shortcuts

```python
import pandas as pd

df = pd.read_csv("sales.csv")
print(len(df[df["product"].isin(["Croissant", "Banana Cake"])]))  # one of several values
print(len(df[df["unit_price"].between(2, 2.75)]))                 # inclusive range
print(len(df[df["product"].str.contains("Latte")]))               # text search
```

`query()` lets you write the condition as a string, which some people find easier to read:

```python
import pandas as pd

df = pd.read_csv("sales.csv")
print(df.query("branch == 'Siem Reap' and quantity >= 3")[["date", "product", "quantity"]])
```

## Counting matches

Because True counts as 1, `mask.sum()` counts rows without making a new table.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
print((df["payment"] == "KHQR").sum(), "KHQR payments")
print(f"{(df['payment'] == 'KHQR').mean():.0%} of orders")  # mean of True/False = share
```

> 🧭 **Scenario:** The Siem Reap manager asks "how many big orders (3+ items) did we get?" That's `((df["branch"] == "Siem Reap") & (df["quantity"] >= 3)).sum()`: one line, readable, and you can reuse the same mask to look at the rows themselves.

## Challenge

> 🎯 **Challenge:** Load `sales.csv` into `df`. Set `pp_coffee` to the rows where the branch is `Phnom Penh` **and** the category is `Coffee`, `big_orders` to the rows with quantity **3 or more**, and `n_khqr` to the number of orders paid with `KHQR`.

```python starter
import pandas as pd

df = pd.read_csv("sales.csv")

pp_coffee = df
big_orders = df
n_khqr = 0

print(len(pp_coffee), len(big_orders), n_khqr)
```

```python solution
import pandas as pd

df = pd.read_csv("sales.csv")

pp_coffee = df[(df["branch"] == "Phnom Penh") & (df["category"] == "Coffee")]
big_orders = df[df["quantity"] >= 3]
n_khqr = (df["payment"] == "KHQR").sum()

print(len(pp_coffee), len(big_orders), n_khqr)
```

```python check
import pandas as _pd
_df = _pd.read_csv("sales.csv")
_want = _df[(_df["branch"] == "Phnom Penh") & (_df["category"] == "Coffee")]
assert list(pp_coffee["order_id"]) == list(_want["order_id"]), f"pp_coffee should have {len(_want)} rows, got {len(pp_coffee)}"
assert list(big_orders["order_id"]) == list(_df[_df["quantity"] >= 3]["order_id"]), "big_orders: quantity >= 3 (3 counts)."
assert n_khqr == 34, f"n_khqr should be 34, got {n_khqr}"
```

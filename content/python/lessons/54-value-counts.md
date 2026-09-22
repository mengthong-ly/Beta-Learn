---
title: Counting & distributions
section: 11 · Exploring Data
---

For text columns (branch, product, payment), the key question is "how many of each?". For number columns, it's "how are the values spread out?". pandas answers both in a line.

## value_counts

```python
import pandas as pd

df = pd.read_csv("sales.csv")
print(df["product"].value_counts())
```

`normalize=True` gives shares instead of counts: perfect for "what percentage of orders…".

```python
import pandas as pd

df = pd.read_csv("sales.csv")
share = df["payment"].value_counts(normalize=True)
print(share.round(3))
for method, s in share.items():
    print(f"{method}: {s:.0%}")
```

## unique and nunique

```python
import pandas as pd

df = pd.read_csv("sales.csv")
print(df["category"].unique())     # the distinct values
print(df["product"].nunique(), "different products")
print(df.nunique())                # for every column
```

## Counting combinations

`value_counts` on several columns counts each **combination**.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
print(df[["branch", "category"]].value_counts().head(5))
```

## Binning numbers with pd.cut

To see how numbers are distributed, group them into ranges ("bins"), then count. `pd.cut` takes the bin edges and optional labels.

```python
import pandas as pd

df = pd.read_csv("students.csv")
df["grade"] = pd.cut(df["math"], bins=[0, 60, 70, 80, 90, 100], labels=["F", "D", "C", "B", "A"])
print(df[["name", "math", "grade"]].head(6))
print(df["grade"].value_counts(sort=False))
```

> ⚠️ **Gotcha:** by default bins include their **right** edge: `(60, 70]` means "more than 60, up to and including 70". So a 60 is an F and a 70 is a D here. Pass `right=False` to flip it to `[60, 70)`.

> 🧭 **Scenario:** The owner wonders whether to stop accepting cards. `value_counts(normalize=True)` shows cards are over a quarter of orders, and `pd.crosstab` (Session 12) would show if that's true in every branch. Counting is often all it takes to answer a business question.

## Challenge

> 🎯 **Challenge:** Using `sales.csv`, set `payment_share` to the share of orders per payment method (`value_counts(normalize=True)`) and `n_products` to the number of distinct products. Then using `students.csv`, add a `grade` column to `students` with `pd.cut` on `math` using bins `[0, 60, 70, 80, 90, 100]` and labels `F, D, C, B, A`, and set `grade_counts` to how many students got each grade.

```python starter
import pandas as pd

sales = pd.read_csv("sales.csv")
students = pd.read_csv("students.csv")

payment_share = None
n_products = 0
grade_counts = None
```

```python solution
import pandas as pd

sales = pd.read_csv("sales.csv")
students = pd.read_csv("students.csv")

payment_share = sales["payment"].value_counts(normalize=True)
n_products = sales["product"].nunique()
students["grade"] = pd.cut(students["math"], bins=[0, 60, 70, 80, 90, 100], labels=["F", "D", "C", "B", "A"])
grade_counts = students["grade"].value_counts()

print(payment_share)
print(n_products)
print(grade_counts)
```

```python check
assert payment_share is not None and round(payment_share["KHQR"], 4) == round(34 / 72, 4), "payment_share: value_counts(normalize=True) on the payment column."
assert round(payment_share.sum(), 6) == 1, "Shares should add up to 1."
assert n_products == 8, f"There are 8 products, got {n_products}"
assert "grade" in students.columns, "Add a 'grade' column to students."
assert dict(zip(students["name"], students["grade"].astype(str)))["Pisey"] == "F" and dict(zip(students["name"], students["grade"].astype(str)))["Chenda"] == "A", "Check your bins and labels."
assert {k: int(v) for k, v in grade_counts.items()} == {"A": 2, "B": 4, "C": 2, "D": 2, "F": 2}, f"grade_counts looks off: {dict(grade_counts)}"
```

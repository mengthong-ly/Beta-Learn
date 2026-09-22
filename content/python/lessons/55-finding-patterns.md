---
title: Finding patterns
section: 11 · Exploring Data
---

Summary numbers describe one column. Insights usually come from **comparisons**: the top performers, the trend over time, how two measurements move together.

## Top and bottom N

`nlargest` / `nsmallest` sort and slice in one step.

```python
import pandas as pd

df = pd.read_csv("students.csv")
print(df.nlargest(3, "math")[["name", "math"]])
print(df.nsmallest(2, "attendance")[["name", "attendance"]])
```

## Ranking

`rank` gives each row its position. `ascending=False` makes the highest value rank 1.

```python
import pandas as pd

df = pd.read_csv("students.csv")
df["math_rank"] = df["math"].rank(ascending=False).astype(int)
print(df.sort_values("math_rank")[["name", "math", "math_rank"]].head(4))
```

## Running totals and change

`cumsum` adds up as it goes: revenue to date. `pct_change` compares each value with the previous one.

```python
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["total"] = df["quantity"] * df["unit_price"]
df["month"] = df["date"].dt.month_name()

months = ["January", "February", "March"]
monthly = pd.Series([df[df["month"] == m]["total"].sum() for m in months], index=months)
print(monthly)
print(monthly.cumsum())
print(monthly.pct_change().dropna().map("{:+.0%}".format))
```

Sales grew 67% from January to February, then another 11%. (Session 12 shows a much shorter way to get those monthly totals.)

## Correlation: do two columns move together?

`corr` gives a number from **−1** to **+1**. Near +1: when one goes up, so does the other. Near −1: one goes up, the other down. Near 0: no straight-line relationship.

```python
import pandas as pd

df = pd.read_csv("students.csv")
print(round(df["math"].corr(df["science"]), 2))
print(round(df["math"].corr(df["english"]), 2))
print(df[["math", "english", "science", "attendance"]].corr().round(2))
```

Math and science scores are strongly linked (0.9); math and english less so (0.7). Attendance and math: 0.93!

> ⚠️ **Gotcha:** correlation is not causation. Students with high attendance score higher, but that doesn't prove attending _causes_ the scores (motivated students may simply do both). Correlation tells you where to look, not why.

## Comparing groups with masks

Split the data with a condition and compare a statistic across the two halves.

```python
import pandas as pd

df = pd.read_csv("students.csv")
high = df[df["attendance"] >= 95]
low = df[df["attendance"] < 95]
print(f"attendance 95%+: math {high['math'].mean():.1f}")
print(f"attendance <95%: math {low['math'].mean():.1f}")
```

## Challenge

> 🎯 **Challenge:** Using `students.csv`, set `top3` to a **list** of the names of the three best math students (best first), and `corr_ms` to the correlation between `math` and `science`, rounded to 2 decimals.

```python starter
import pandas as pd

df = pd.read_csv("students.csv")

top3 = []
corr_ms = 0

print(top3, corr_ms)
```

```python solution
import pandas as pd

df = pd.read_csv("students.csv")

top3 = list(df.nlargest(3, "math")["name"])
corr_ms = round(df["math"].corr(df["science"]), 2)

print(top3, corr_ms)
```

```python check
assert list(top3) == ["Chenda", "Sokha", "Nary"], f"top3 should be ['Chenda', 'Sokha', 'Nary'], got {top3}"
assert corr_ms == 0.9, f"corr_ms should be 0.9, got {corr_ms}"
```

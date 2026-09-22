---
title: Working with dates
section: 10 · Types & Formatting
---

In a CSV, `2026-01-07` is just text. Turn it into a real date and you can ask "which month?", "which weekday?", "how many days since?" and sort or filter by time.

## to_datetime

```python
import pandas as pd

df = pd.read_csv("sales.csv")
print(df["date"].dtype)
df["date"] = pd.to_datetime(df["date"])
print(df["date"].dtype)
print(df["date"].min(), "to", df["date"].max())
```

> 💡 **Tip:** `pd.read_csv("sales.csv", parse_dates=["date"])` converts while loading.

## The .dt accessor

Like `.str` for text, `.dt` gives you the parts of every date in a column.

```python
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
df["month"] = df["date"].dt.month
df["month_name"] = df["date"].dt.month_name()
df["weekday"] = df["date"].dt.day_name()
print(df[["date", "month", "month_name", "weekday"]].head())
```

| Attribute / method   | Gives                   |
| -------------------- | ----------------------- |
| `.dt.year`           | `2026`                  |
| `.dt.month`          | `1` … `12`              |
| `.dt.day`            | day of the month        |
| `.dt.month_name()`   | `"January"`             |
| `.dt.day_name()`     | `"Wednesday"`           |
| `.dt.dayofweek`      | `0` (Mon) … `6` (Sun)   |
| `.dt.strftime("%d/%m/%Y")` | formatted text    |

## Filter by date

Compare against a date string and pandas converts it for you.

```python
import pandas as pd

df = pd.read_csv("sales.csv", parse_dates=["date"])
march = df[(df["date"] >= "2026-03-01") & (df["date"] < "2026-04-01")]
print(len(march), "orders in March")
print(len(df[df["date"].dt.month == 3]), "the same, using .dt.month")
```

## Date arithmetic

Subtracting dates gives a **Timedelta** (a duration); `.dt.days` turns it into a number.

```python
import pandas as pd

branches = pd.read_csv("branches.csv", parse_dates=["opened"])
today = pd.Timestamp("2026-09-21")
branches["days_open"] = (today - branches["opened"]).dt.days
print(branches[["branch", "opened", "days_open"]])
print(pd.Timestamp("2026-01-31") + pd.Timedelta(days=30))
```

> ⚠️ **Gotcha:** is `03/04/2026` the 3rd of April or March 4th? It depends on the country. Prefer `YYYY-MM-DD` (ISO format), and when you must parse other formats, say which one: `pd.to_datetime(s, format="%d/%m/%Y")`.

## Challenge

> 🎯 **Challenge:** Load `sales.csv` into `df` and convert `date` to datetime. Add a `weekday` column with the day name, set `march` to the orders from **March 2026**, and set `busiest_day` to the weekday name with the most orders.

```python starter
import pandas as pd

df = pd.read_csv("sales.csv")

march = df
busiest_day = ""

print(len(march), busiest_day)
```

```python solution
import pandas as pd

df = pd.read_csv("sales.csv")
df["date"] = pd.to_datetime(df["date"])
df["weekday"] = df["date"].dt.day_name()

march = df[df["date"].dt.month == 3]
busiest_day = df["weekday"].value_counts().idxmax()

print(len(march), busiest_day)
```

```python check
import pandas as _pd
assert _pd.api.types.is_datetime64_any_dtype(df["date"]), "Convert df['date'] with pd.to_datetime."
assert "weekday" in df.columns and df["weekday"].iloc[0] == "Wednesday", "weekday should be the day name, e.g. 'Wednesday'."
assert len(march) == 31 and (march["date"].dt.month == 3).all(), f"march should have the 31 March orders, got {len(march)}"
_want = _pd.to_datetime(_pd.read_csv("sales.csv")["date"]).dt.day_name().value_counts().idxmax()
assert busiest_day == _want, f"busiest_day should be {_want!r}, got {busiest_day!r}"
```

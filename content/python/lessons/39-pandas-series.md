---
title: pandas & the Series
section: 7 · Intro to Pandas
---

**pandas** is Python's spreadsheet library: the tool data analysts use every day to load, clean and summarise tables. Everything from here to the end of the course uses it.

> 📝 **Note:** The first time you run code that imports pandas, the app downloads it (and numpy, which pandas is built on). That takes a few seconds once; after that it's instant.

```python
import pandas as pd   # "pd" is the name everyone uses

print(pd.__version__)
```

## A Series is a labelled column

A **Series** is a list of values with a **label** (the _index_) for each one, plus a single **dtype** (data type) for all of them.

```python
import pandas as pd

sales = pd.Series([120, 95, 140, 80, 160], index=["Mon", "Tue", "Wed", "Thu", "Fri"])
print(sales)
print(sales.dtype)
```

Without an `index=`, pandas labels items `0, 1, 2, …` like list positions.

## Get values by label or by position

```python
import pandas as pd

sales = pd.Series([120, 95, 140, 80, 160], index=["Mon", "Tue", "Wed", "Thu", "Fri"])
print(sales["Wed"])        # by label
print(sales.iloc[0])       # by position (0 = first)
print(sales["Tue":"Thu"])  # a slice of labels (includes the end!)
```

## Math on the whole column at once

This is pandas' superpower: an operation on a Series applies to **every** value. No loop.

```python
import pandas as pd

prices = pd.Series([2.50, 2.00, 2.75])
print(prices * 4100)          # USD to riel, all at once
print(prices + pd.Series([0.25, 0.25, 0.25]))
```

## Built-in summaries

```python
import pandas as pd

sales = pd.Series([120, 95, 140, 80, 160], index=["Mon", "Tue", "Wed", "Thu", "Fri"])
print(sales.sum(), sales.mean(), sales.max())
print(sales.idxmax())   # the LABEL of the biggest value
print(sales.sort_values(ascending=False).head(3))
```

## Comparisons give a Series of True/False

Comparing a Series gives a **boolean Series**, and you can use it to keep only the matching values. You'll use this constantly.

```python
import pandas as pd

sales = pd.Series([120, 95, 140, 80, 160], index=["Mon", "Tue", "Wed", "Thu", "Fri"])
good = sales > 100
print(good)
print(sales[good])      # only the good days
print(good.sum(), "good days")  # True counts as 1
```

> 🔍 **Behind the scenes: why pandas is fast**
>
> A Python list stores pointers to separate objects all over memory. A Series stores its numbers in a single **numpy array**: one packed block of raw machine numbers, all the same type (that's what `dtype` is: `int64` means 64-bit integers). `sales * 2` then runs a tight loop in compiled C instead of the Python interpreter, which is often 50–100× faster on big data. `sales.to_numpy()` shows you the array inside. Text columns use the `str` dtype.

## Challenge

> 🎯 **Challenge:** Make a Series `sales` with values `120, 95, 140, 80, 160` labelled `Mon`–`Fri`. Then set `total` (the sum), `best_day` (the label of the highest day) and `above_100` (a Series of only the days over 100).

```python starter
import pandas as pd

sales = None
total = None
best_day = None
above_100 = None

print(total, best_day)
print(above_100)
```

```python solution
import pandas as pd

sales = pd.Series([120, 95, 140, 80, 160], index=["Mon", "Tue", "Wed", "Thu", "Fri"])
total = sales.sum()
best_day = sales.idxmax()
above_100 = sales[sales > 100]

print(total, best_day)
print(above_100)
```

```python check
import pandas as _pd
assert isinstance(sales, _pd.Series), "sales should be a pandas Series (pd.Series(...))."
assert list(sales.index) == ["Mon", "Tue", "Wed", "Thu", "Fri"], "Label the values Mon to Fri with index=."
assert list(sales) == [120, 95, 140, 80, 160]
assert total == 595, f"total should be 595, got {total}"
assert best_day == "Fri", f"best_day should be the label 'Fri', got {best_day!r}"
assert isinstance(above_100, _pd.Series) and list(above_100.index) == ["Mon", "Wed", "Fri"], "above_100 should keep Mon, Wed and Fri."
```

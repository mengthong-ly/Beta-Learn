---
title: Duplicate rows
section: 9 · Cleaning Data
---

Exports get run twice, forms get submitted twice, files get merged twice. Duplicate rows make every total too big, and nothing looks wrong until someone notices the numbers don't match the till.

## Find them

`duplicated()` marks each row that is an exact copy of an **earlier** row.

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
print(raw.duplicated().sum(), "duplicate rows")
print(raw[raw.duplicated(keep=False)])   # keep=False marks every copy, so you can see the pairs
```

## Remove them

`drop_duplicates()` keeps the first copy of each row.

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
clean = raw.drop_duplicates().reset_index(drop=True)
print(len(raw), "→", len(clean), "rows")
```

## Duplicates by key

Sometimes two rows aren't identical but _should_ be unique, like two rows with the same `order_id` but a different payment. `subset=` checks only the columns you name.

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
print(raw["order_id"].duplicated().sum(), "repeated order IDs")
print(raw["order_id"].is_unique)

clean = raw.drop_duplicates(subset=["order_id"], keep="last")
print(clean["order_id"].is_unique)
```

| `keep=`   | Marks / removes                    |
| --------- | ---------------------------------- |
| `"first"` | every copy except the first (default) |
| `"last"`  | every copy except the last         |
| `False`   | **all** copies                     |

> ⚠️ **Gotcha:** `duplicated()` compares values exactly. `"Phnom Penh"` and `" phnom penh"` are different strings, so rows that differ only in spacing or capitals won't be caught. Clean the text first (next lesson), _then_ look for duplicates again.

> 🧭 **Scenario:** Revenue for April looks 10% too high. `raw.duplicated().sum()` shows the export sent two orders twice. Dropping them before any analysis is the fix, and checking `order_id.is_unique` after cleaning is how you prove it.

## Challenge

> 🎯 **Challenge:** Load `sales_raw.csv` into `raw`. Set `n_dupes` to the number of fully duplicated rows, and `clean` to `raw` without them, with a fresh 0, 1, 2… index.

```python starter
import pandas as pd

raw = pd.read_csv("sales_raw.csv")

n_dupes = 0
clean = raw

print(n_dupes, len(clean))
```

```python solution
import pandas as pd

raw = pd.read_csv("sales_raw.csv")

n_dupes = raw.duplicated().sum()
clean = raw.drop_duplicates().reset_index(drop=True)

print(n_dupes, len(clean))
```

```python check
assert n_dupes == 2, f"There are 2 duplicated rows, got {n_dupes}"
assert len(clean) == 18, f"clean should have 18 rows, got {len(clean)}"
assert clean["order_id"].is_unique, "Every order_id in clean should appear once."
assert list(clean.index) == list(range(18)), "Reset the index with reset_index(drop=True)."
```

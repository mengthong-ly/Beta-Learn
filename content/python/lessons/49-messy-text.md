---
title: Fixing messy text
section: 9 · Cleaning Data
---

To a computer, `"Phnom Penh"`, `" phnom penh"` and `"PHNOM PENH"` are three different branches. Until you fix that, every count and every group is wrong.

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
print(raw["branch"].value_counts())
```

Seven spellings of three branches: stray spaces, SHOUTING, lowercase, and one typo (`Battambong`). `value_counts()` is the fastest way to spot this.

## The .str accessor

Every string method you know (`strip`, `lower`, `title`, `replace`, …) exists for a whole column under `.str`.

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
fixed = raw["branch"].str.strip().str.title()
print(fixed.value_counts())
```

| Method                      | Does                                  |
| --------------------------- | ------------------------------------- |
| `.str.strip()`              | remove spaces at both ends            |
| `.str.lower()` / `.upper()` | change case                           |
| `.str.title()`              | Capitalise Each Word                  |
| `.str.replace("a", "b")`    | replace text inside each value        |
| `.str.contains("x")`        | True/False: does it contain `x`?      |
| `.str.startswith("x")`      | True/False: does it start with `x`?   |
| `.str.len()`                | length of each value                  |
| `.str.split(" ")`           | split into lists                      |

## Fix the leftovers with replace

Formatting fixes can't know that `Battambong` is a typo. Map the known bad values to the right ones with `replace`.

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
raw["branch"] = raw["branch"].str.strip().str.title().replace({"Battambong": "Battambang"})
print(raw["branch"].value_counts())
```

## Watch out for acronyms

`title()` turns `"KHQR"` into `"Khqr"`. Normalise first, then put the special cases back.

```python
import pandas as pd

raw = pd.read_csv("sales_raw.csv")
pay = raw["payment"].str.strip().str.title().replace({"Khqr": "KHQR"})
print(pay.value_counts(dropna=False))
```

> 💡 **Tip:** `.str` methods skip missing values: a `NaN` stays `NaN` instead of crashing. That's why `dropna=False` above still shows the 3 blanks.

> 🔍 **Behind the scenes: the `str` dtype**
>
> In pandas 3, text columns get the dedicated `str` dtype instead of the old catch-all `object`. A `str` column can only hold strings (or missing values), so a stray number can't sneak in, and the `.str` methods run on a compact string array. If you read older tutorials, `object` is what they mean by a text column.

## Challenge

> 🎯 **Challenge:** Load `sales_raw.csv` into `raw` and clean three columns in place: `branch` (strip spaces, Title Case, fix the `Battambong` typo), `product` (strip spaces, Title Case) and `payment` (strip, Title Case, but keep `KHQR` in capitals).

```python starter
import pandas as pd

raw = pd.read_csv("sales_raw.csv")

# clean raw["branch"], raw["product"] and raw["payment"]

print(raw["branch"].value_counts())
```

```python solution
import pandas as pd

raw = pd.read_csv("sales_raw.csv")

raw["branch"] = raw["branch"].str.strip().str.title().replace({"Battambong": "Battambang"})
raw["product"] = raw["product"].str.strip().str.title()
raw["payment"] = raw["payment"].str.strip().str.title().replace({"Khqr": "KHQR"})

print(raw["branch"].value_counts())
print(raw["product"].value_counts())
print(raw["payment"].value_counts())
```

```python check
assert set(raw["branch"]) == {"Phnom Penh", "Siem Reap", "Battambang"}, f"branch should only be the 3 branches, got {sorted(set(raw['branch']))}"
assert set(raw["product"]) == {"Iced Latte", "Americano", "Croissant", "Lemon Tea", "Fried Rice", "Cappuccino", "Banana Cake", "Green Tea Latte"}, f"Some products are still messy: {sorted(set(raw['product']))}"
assert set(raw["payment"].dropna()) == {"KHQR", "Cash", "Card"}, f"payment should be KHQR, Cash or Card, got {sorted(set(raw['payment'].dropna()))}"
assert raw["payment"].isna().sum() == 3, "Leave the missing payments missing (that was last lesson's job)."
```

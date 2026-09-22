---
title: Formatting numbers & text
section: 10 · Types & Formatting
---

Analysis isn't finished until someone can read it. `319.95000000000005` should be shown as `$319.95`, a share as `47%`, and a report should line up in columns. Python's **format spec** (the part after `:` in an f-string) does all of it.

## Decimals, thousands, percentages

```python
x = 1234567.891
print(f"{x:.2f}")      # 2 decimals
print(f"{x:,.2f}")     # thousands separator
print(f"${x:,.0f}")    # no decimals
print(f"{0.4722:.1%}") # percentage: multiplies by 100
print(f"{7:03d}")      # pad with zeros
```

## Width and alignment

A number before the type sets a minimum **width**; `<` `>` `^` align left, right, centre. This is how you build tables that line up.

```python
print(f"[{'Iced Latte':<12}]")
print(f"[{'Iced Latte':>12}]")
print(f"[{'Iced Latte':^12}]")
print(f"[{2.5:>8.2f}]")

for product, price in [("Iced Latte", 2.5), ("Americano", 2.0), ("Fried Rice", 3.5)]:
    print(f"{product:<12}{price:>8.2f}")
```

| Spec     | Meaning                             | `2.5` becomes |
| -------- | ----------------------------------- | ------------- |
| `.2f`    | fixed, 2 decimals                   | `2.50`        |
| `,.2f`   | with thousands separator            | `2.50`        |
| `>8.2f`  | right-aligned in 8 characters       | `    2.50`    |
| `.0%`    | percentage, 0 decimals              | `250%`        |
| `e`      | scientific notation                 | `2.500000e+00`|

## Rounding in pandas

`round()` changes the **values**; formatting only changes how they **look**. Round for calculations and storage, format for display.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]
print(df["total"].mean())
print(round(df["total"].mean(), 2))
print((df["unit_price"] / 3).round(2).head(3))
```

## Formatting a whole column for display

`.map()` with a format string turns numbers into display text. Do this **last**, because you can't do math on the result.

```python
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]
df["shown"] = df["total"].map("${:,.2f}".format)
print(df[["product", "total", "shown"]].head(3))
print(df[["product", "shown"]].head(3).to_string(index=False))
```

> 🧭 **Scenario:** The owner wants a text summary to paste into Telegram. Compute with full precision, then print one aligned line per branch with f-strings. That's the challenge below, and the last step of most real analyses.

## Challenge

> 🎯 **Challenge:** Load `sales.csv`, compute revenue per branch (quantity × unit_price, summed) and print one line per branch **in alphabetical order**: the branch name left-aligned in 12 characters, then the revenue right-aligned in 10 characters with a thousands separator and 2 decimals. For example `Phnom Penh      139.30`.

```python starter
import pandas as pd

df = pd.read_csv("sales.csv")

# print one aligned line per branch
```

```python solution
import pandas as pd

df = pd.read_csv("sales.csv")
df["total"] = df["quantity"] * df["unit_price"]

for branch in sorted(set(df["branch"])):
    amount = df[df["branch"] == branch]["total"].sum()
    print(f"{branch:<12}{amount:>10,.2f}")
```

```python check
want = ["Battambang       99.35", "Phnom Penh      139.30", "Siem Reap        81.30"]
got = __stdout__.splitlines()
assert got == want, "Expected exactly:\n" + "\n".join(want) + "\nbut got:\n" + "\n".join(got[:4])
```

---
title: Lists of records
section: 6 · Lists & Loop Patterns
---

Real data is usually a **list of records**: one dict per row, the same keys in each. It's exactly what `csv.DictReader` gives you, and it's how you can analyse data with plain Python before we reach pandas.

```python
import csv

with open("sales.csv", newline="") as f:
    rows = list(csv.DictReader(f))

print(len(rows), "orders")
print(rows[0])
```

## Step 1: fix the types

CSV values are strings. Convert the numeric columns once, up front, and add a computed field while you're there.

```python
import csv

with open("sales.csv", newline="") as f:
    rows = list(csv.DictReader(f))

for r in rows:
    r["quantity"] = int(r["quantity"])
    r["unit_price"] = float(r["unit_price"])
    r["total"] = r["quantity"] * r["unit_price"]

print(rows[0]["product"], rows[0]["total"])
```

## Filter, sort, top-N

Comprehensions filter; `sorted` with a `key` ranks; slicing takes the top few.

```python
import csv

with open("sales.csv", newline="") as f:
    rows = list(csv.DictReader(f))
for r in rows:
    r["total"] = int(r["quantity"]) * float(r["unit_price"])

coffee = [r for r in rows if r["category"] == "Coffee"]
print(len(coffee), "coffee orders")

biggest = sorted(rows, key=lambda r: r["total"], reverse=True)[:3]
for r in biggest:
    print(r["order_id"], r["product"], r["total"])
```

## Group and total

To answer "how much per branch?", keep a dict of running totals keyed by the group.

```python
import csv

with open("sales.csv", newline="") as f:
    rows = list(csv.DictReader(f))

orders = {}
for r in rows:
    branch = r["branch"]
    orders[branch] = orders.get(branch, 0) + 1
print(orders)
```

> 💡 **Tip:** `collections.defaultdict(int)` or `Counter` from the standard library tour save you the `.get(key, 0)` dance.

> 🧭 **Scenario:** You just did filtering, sorting and grouping by hand. It works, but notice how much code a simple question takes. **pandas**, the next session, turns each of these into one line: `df[df["category"] == "Coffee"]`, `df.nlargest(3, "total")`, `df.groupby("branch").size()`. Knowing the loop version means you'll understand what those lines do.

## Challenge

> 🎯 **Challenge:** Write `revenue_by_branch(rows)` that takes the rows from `sales.csv` and returns a dict mapping each branch to its total revenue (quantity × unit_price, summed), **rounded to 2 decimals**.

```python starter
import csv

def revenue_by_branch(rows):
    return {}

with open("sales.csv", newline="") as f:
    rows = list(csv.DictReader(f))

print(revenue_by_branch(rows))
```

```python solution
import csv

def revenue_by_branch(rows):
    totals = {}
    for r in rows:
        amount = int(r["quantity"]) * float(r["unit_price"])
        totals[r["branch"]] = totals.get(r["branch"], 0) + amount
    return {branch: round(t, 2) for branch, t in totals.items()}

with open("sales.csv", newline="") as f:
    rows = list(csv.DictReader(f))

print(revenue_by_branch(rows))
```

```python check
import csv as _csv
_rows = list(_csv.DictReader(open("sales.csv", newline="")))
got = revenue_by_branch(_rows)
assert got == {"Battambang": 99.35, "Phnom Penh": 139.3, "Siem Reap": 81.3}, f"Got {got}"
assert revenue_by_branch([{"branch": "X", "quantity": "2", "unit_price": "1.5"}]) == {"X": 3.0}
```

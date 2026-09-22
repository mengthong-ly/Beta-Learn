---
title: CSV files with the csv module
section: 5 · Files & Libraries
---

**CSV** (comma-separated values) is the most common data format there is: every spreadsheet, database and app can export it. It's just text, one row per line, with commas between values.

```python
with open("students.csv") as f:
    for line in list(f)[:4]:
        print(line, end="")
```

The first line is the **header** (column names). You _could_ split lines on commas yourself, but values can contain commas inside quotes (`"Phnom Penh, Cambodia"`), so use the built-in `csv` module.

## csv.reader: rows as lists

```python
import csv

with open("students.csv", newline="") as f:
    reader = csv.reader(f)
    header = next(reader)      # take the first row off
    print(header)
    for row in reader:
        print(row[0], row[2])  # name, math
        if row[0] == "Pisey":
            break
```

## csv.DictReader: rows as dicts (use this one)

`DictReader` uses the header for keys, so you write `row["math"]` instead of remembering that math is column 2.

```python
import csv

with open("students.csv", newline="") as f:
    for row in csv.DictReader(f):
        print(row)
        break
```

> ⚠️ **Gotcha:** everything from a CSV is a **string**: `row["math"]` is `"78"`, not `78`. Convert with `int()` or `float()` before doing math, or `"78" + "92"` gives you `"7892"`.

```python
import csv

total = 0
count = 0
with open("students.csv", newline="") as f:
    for row in csv.DictReader(f):
        total += int(row["math"])
        count += 1
print(f"Average math: {total / count:.1f}")
```

## Writing CSVs

`csv.writer` writes lists; `csv.DictWriter` writes dicts. Open the file with `newline=""` so the module controls line endings.

```python
import csv

rows = [{"product": "Iced Latte", "price": 2.5}, {"product": "Croissant", "price": 1.8}]

with open("menu.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["product", "price"])
    writer.writeheader()
    writer.writerows(rows)

print(open("menu.csv").read())
```

> 🧭 **Scenario:** Your manager sends `students.csv` and asks for "just the honor roll". Read with `DictReader`, keep the rows you want, write them with `DictWriter`. That's a complete, real data pipeline in about ten lines, and the next challenge.

## Challenge

> 🎯 **Challenge:** Read `students.csv`. Build `top`, a list of the **names** of students with a math score of **85 or more** (in file order). Then write `honor_roll.csv` with the header `name,math` and one row per top student.

```python starter
import csv

top = []

with open("students.csv", newline="") as f:
    for row in csv.DictReader(f):
        pass  # keep the good ones

print(top)
```

```python solution
import csv

top = []
rows = []

with open("students.csv", newline="") as f:
    for row in csv.DictReader(f):
        if int(row["math"]) >= 85:
            top.append(row["name"])
            rows.append({"name": row["name"], "math": row["math"]})

with open("honor_roll.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "math"])
    writer.writeheader()
    writer.writerows(rows)

print(top)
```

```python check
import csv as _csv, os as _os
assert top == ["Sokha", "Srey Leak", "Chenda", "Nary"], f"top should be the 4 students with math >= 85, got {top}"
assert _os.path.exists("honor_roll.csv"), "Write honor_roll.csv."
_rows = list(_csv.reader(open("honor_roll.csv")))
assert _rows[0] == ["name", "math"], "The header should be name,math."
assert [r[0] for r in _rows[1:]] == top, "One row per top student."
assert _rows[1][1] == "92", "The math column should hold each student's score."
```

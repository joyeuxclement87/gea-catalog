"""
Extract, clean, and export the product catalogue from the source workbook.

Run from the repository root:

    python3 scripts/extract-products.py "PRODUCT LIST (1).xlsx"

Output: src/data/product-data.json  (stable, build-time data source)

The workbook contains several sheets. The master product list lives in
"Sheet1" (columns: S/N, Name, Category). The "PRODUCT LIST" sheet adds a
small number of products that are not present in Sheet1; those are merged in.
All other sheets are scrubbed data and ignored.
"""
import json
import os
import re
import sys

import openpyxl

MASTER_SHEET = "Sheet1"
SECONDARY_SHEET = "PRODUCT LIST"
OUT = os.path.join("src", "data", "product-data.json")


def slug(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value


def rows_of(ws):
    out = []
    for row in ws.iter_rows(min_row=1, max_col=6):
        name = row[2].value
        category = row[3].value if len(row) > 3 else None
        if name is None or str(name).strip() == "":
            continue
        name = str(name).strip()
        category = str(category).strip() if category else ""
        if name.lower() in ("name", "item name", "product list", "s/n"):
            continue
        out.append((name, category))
    return out


def main(path: str):
    wb = openpyxl.load_workbook(path, data_only=True)
    if MASTER_SHEET not in wb.sheetnames:
        sys.exit(f"master sheet '{MASTER_SHEET}' not found in workbook")

    master = rows_of(wb[MASTER_SHEET])
    master_names = {name.upper() for name, _ in master}

    if SECONDARY_SHEET in wb.sheetnames:
        for name, category in rows_of(wb[SECONDARY_SHEET]):
            if name.upper() not in master_names:
                master.append((name, category))

    seen = set()
    products = []
    for index, (name, category) in enumerate(master, start=1):
        clean_name = " ".join(name.split())
        key = clean_name.upper()
        if key in seen:
            continue
        seen.add(key)
        products.append(
            {
                "id": f"p{index:04d}",
                "name": clean_name,
                "category": category,
                "categorySlug": slug(category),
                "slug": slug(clean_name),
                "image": f"/images/products/{slug(clean_name)}.jpg",
            }
        )

    categories = []
    seen_categories = set()
    for product in products:
        cat = product["category"]
        if cat in seen_categories:
            continue
        seen_categories.add(cat)
        categories.append(
            {
                "name": cat,
                "slug": product["categorySlug"],
                "image": f"/images/categories/{product['categorySlug']}.jpg",
                "productCount": sum(p["category"] == cat for p in products),
            }
        )

    categories.sort(key=lambda c: c["name"])
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump({"generatedFrom": os.path.basename(path), "categories": categories, "products": products}, fh, indent=2)

    print(f"exported {len(products)} products / {len(categories)} categories -> {OUT}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: python3 scripts/extract-products.py <workbook.xlsx>")
    main(sys.argv[1])
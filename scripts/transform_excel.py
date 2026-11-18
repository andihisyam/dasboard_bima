#!/usr/bin/env python3
"""Transform the three monitoring sheets into dashboard-ready JSON."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable

from openpyxl import load_workbook

SHEETS = {
    "Input Data W1_Kategori 1": "W1",
    "Input Data W2_Kategori 1": "W2",
    "Input Data W3_Kategori 1": "W3",
}

HEADER_ALIASES = {
    "name": {"nama", "nama lokasi", "nama kawasan"},
    "province": {"provinsi"},
    "regency": {"kota/kabupaten", "kabupaten/kota", "kab/kota"},
    "district": {"kecamatan"},
    "year": {"tahun"},
    "authority": {"kewenangan"},
    "slum_level": {"tingkat kekumuhan"},
    "map_description": {"keterangan peta"},
}

CATEGORY_LABELS = {
    "below_2021": "Di bawah 2021",
    "year_2021": "Tahun 2021",
    "above_2021": "Di atas 2021",
    "unknown": "Belum diketahui",
}


def normalize_text(value: Any) -> str | None:
    if value is None:
        return None
    text = re.sub(r"\s+", " ", str(value)).strip()
    if not text or text in {"-", "–", "—"}:
        return None
    return text


def normalize_header(value: Any) -> str:
    return (normalize_text(value) or "").casefold()


def parse_year(value: Any) -> int | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        if isinstance(value, str):
            cleaned = value.strip().replace(",", ".")
            if not cleaned or cleaned in {"-", "–", "—"}:
                return None
            number = float(cleaned)
        else:
            number = float(value)
        year = int(number)
        if number != year or year < 1900 or year > 2100:
            return None
        return year
    except (TypeError, ValueError, OverflowError):
        return None


def categorize_year(value: Any) -> str:
    year = parse_year(value)
    if year is None:
        return "unknown"
    if year < 2021:
        return "below_2021"
    if year == 2021:
        return "year_2021"
    return "above_2021"


def build_regency_status(categories: Iterable[str]) -> str:
    values = set(categories)
    if "below_2021" in values:
        return "below_2021"
    if "year_2021" in values:
        return "year_2021"
    if "above_2021" in values:
        return "above_2021"
    return "unknown"


def find_columns(header: tuple[Any, ...]) -> dict[str, int]:
    normalized = [normalize_header(value) for value in header]
    columns: dict[str, int] = {}
    for canonical, aliases in HEADER_ALIASES.items():
        for index, value in enumerate(normalized):
            if value in aliases:
                columns[canonical] = index
                break
    required = {"name", "province", "regency", "district", "year"}
    missing = required - columns.keys()
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")
    return columns


def value_at(row: tuple[Any, ...], index: int | None) -> Any:
    if index is None or index >= len(row):
        return None
    return row[index]


def stable_id(source: str, row_number: int, province: str, regency: str, name: str) -> str:
    raw = f"{source}|{row_number}|{province}|{regency}|{name}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def record_is_empty(name: str | None, province: str | None, regency: str | None, district: str | None, year: int | None) -> bool:
    return not any((name, province, regency, district, year))


def transform_workbook(input_path: Path) -> tuple[list[dict[str, Any]], dict[str, Any], dict[str, Any]]:
    workbook = load_workbook(input_path, read_only=True, data_only=True)
    records: list[dict[str, Any]] = []
    sheet_report: dict[str, Any] = {}
    duplicate_counter: Counter[tuple[str, str, str, str, int | None]] = Counter()

    for sheet_name, source in SHEETS.items():
        if sheet_name not in workbook.sheetnames:
            raise ValueError(f"Required sheet not found: {sheet_name}")

        sheet = workbook[sheet_name]
        rows = sheet.iter_rows(values_only=True)
        try:
            header = next(rows)
        except StopIteration as exc:
            raise ValueError(f"Sheet is empty: {sheet_name}") from exc

        columns = find_columns(header)
        source_records = 0
        ignored_blank_rows = 0
        unknown_years = 0

        for row_number, row in enumerate(rows, start=2):
            name = normalize_text(value_at(row, columns["name"]))
            province = normalize_text(value_at(row, columns["province"]))
            regency = normalize_text(value_at(row, columns["regency"]))
            district = normalize_text(value_at(row, columns["district"]))
            year = parse_year(value_at(row, columns["year"]))

            if record_is_empty(name, province, regency, district, year):
                ignored_blank_rows += 1
                continue

            if not name or not province or not regency:
                ignored_blank_rows += 1
                continue

            category = categorize_year(year)
            if category == "unknown":
                unknown_years += 1

            authority = normalize_text(value_at(row, columns.get("authority")))
            slum_level = normalize_text(value_at(row, columns.get("slum_level")))
            map_description = normalize_text(value_at(row, columns.get("map_description")))
            record = {
                "id": stable_id(source, row_number, province, regency, name),
                "source": source,
                "sourceRow": row_number,
                "province": province,
                "regency": regency,
                "district": district,
                "locationName": name,
                "year": year,
                "yearCategory": category,
                "authority": authority,
                "slumLevel": slum_level,
                "mapDescription": map_description,
                "mapDescriptionStatus": "suitable" if map_description and map_description.casefold() == "sesuai" else "no_description",
            }
            records.append(record)
            source_records += 1
            duplicate_counter[(source, province, regency, name, year)] += 1

        sheet_report[source] = {
            "sheetName": sheet_name,
            "records": source_records,
            "ignoredBlankOrIncompleteRows": ignored_blank_rows,
            "unknownYears": unknown_years,
        }

    regency_categories: dict[tuple[str, str], list[str]] = defaultdict(list)
    for record in records:
        regency_categories[(record["province"], record["regency"])].append(record["yearCategory"])

    for record in records:
        record["regencyStatus"] = build_regency_status(
            regency_categories[(record["province"], record["regency"])]
        )

    category_counts = Counter(record["yearCategory"] for record in records)
    source_counts = Counter(record["source"] for record in records)
    years = Counter(str(record["year"]) for record in records if record["year"] is not None)
    duplicate_groups = [
        {
            "source": key[0],
            "province": key[1],
            "regency": key[2],
            "locationName": key[3],
            "year": key[4],
            "count": count,
        }
        for key, count in duplicate_counter.items()
        if count > 1
    ]

    summary = {
        "totalRecords": len(records),
        "totalProvinces": len({record["province"] for record in records}),
        "totalRegencies": len({(record["province"], record["regency"]) for record in records}),
        "totalDistricts": len({(record["province"], record["regency"], record["district"]) for record in records if record["district"]}),
        "categoryCounts": dict(category_counts),
        "sourceCounts": dict(source_counts),
        "yearCounts": dict(sorted(years.items(), key=lambda item: int(item[0]))),
        "categoryLabels": CATEGORY_LABELS,
    }

    quality = {
        "inputFile": str(input_path),
        "sheets": sheet_report,
        "summary": summary,
        "potentialDuplicateGroups": len(duplicate_groups),
        "potentialDuplicates": duplicate_groups[:500],
    }
    return records, summary, quality


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--output-dir", type=Path, default=Path("public/data"))
    parser.add_argument("--report-dir", type=Path, default=Path("reports"))
    args = parser.parse_args()

    records, summary, quality = transform_workbook(args.input)
    write_json(args.output_dir / "location-records.json", records)
    write_json(args.output_dir / "data-summary.json", summary)
    write_json(args.report_dir / "data-quality.json", quality)

    print(json.dumps({
        "records": len(records),
        "output": str(args.output_dir / "location-records.json"),
        "summary": summary,
        "qualityReport": str(args.report_dir / "data-quality.json"),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

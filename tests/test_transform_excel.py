import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from transform_excel import categorize_year, normalize_text, build_regency_status


class TransformRulesTest(unittest.TestCase):
    def test_categorize_year_respects_2021_boundary(self):
        self.assertEqual(categorize_year(2020), "below_2021")
        self.assertEqual(categorize_year(2021), "year_2021")
        self.assertEqual(categorize_year(2022), "above_2021")

    def test_categorize_year_marks_invalid_values_unknown(self):
        for value in (None, "", "-", "Tidak diketahui", 0, 1899, 10000):
            with self.subTest(value=value):
                self.assertEqual(categorize_year(value), "unknown")

    def test_normalize_text_trims_and_collapses_whitespace(self):
        self.assertEqual(normalize_text("  Kota   Jambi  "), "Kota Jambi")
        self.assertIsNone(normalize_text(" - "))
        self.assertIsNone(normalize_text(None))

    def test_regency_status_uses_worst_valid_location_condition(self):
        self.assertEqual(build_regency_status(["above_2021", "below_2021"]), "below_2021")
        self.assertEqual(build_regency_status(["above_2021", "year_2021"]), "year_2021")
        self.assertEqual(build_regency_status(["above_2021", "above_2021"]), "above_2021")
        self.assertEqual(build_regency_status(["unknown", "unknown"]), "unknown")

    def test_unknown_does_not_hide_a_valid_status(self):
        self.assertEqual(build_regency_status(["unknown", "above_2021"]), "above_2021")
        self.assertEqual(build_regency_status(["unknown", "year_2021"]), "year_2021")


if __name__ == "__main__":
    unittest.main()

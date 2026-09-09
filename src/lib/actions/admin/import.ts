// src/lib/actions/admin/import.ts
//
// Generic parse-and-validate step shared by the businesses and idea-library
// bulk import forms. Produces a preview (valid rows + per-row errors) without
// touching the database — the caller decides whether to commit.

import Papa from "papaparse";
import { z } from "zod";

export type ImportPreviewRow<T> =
  | { index: number; status: "valid"; data: T }
  | { index: number; status: "invalid"; raw: unknown; errors: string[] };

export type ImportPreview<T> = {
  rows: ImportPreviewRow<T>[];
  validCount: number;
  invalidCount: number;
};

/**
 * Parses raw CSV or JSON text into an array of unknown records, ready for
 * schema validation. Does not insert anything.
 */
export function parseImportFile(fileText: string, format: "csv" | "json"): unknown[] {
  if (format === "json") {
    const parsed = JSON.parse(fileText);
    if (!Array.isArray(parsed)) {
      throw new Error("JSON import must be an array of objects.");
    }
    return parsed;
  }

  const result = Papa.parse(fileText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // keep everything as strings; schemas coerce explicitly
  });

  if (result.errors.length > 0) {
    throw new Error(
      `CSV parse error at row ${result.errors[0].row}: ${result.errors[0].message}`
    );
  }

  // Papa Parse gives "" for a blank cell, but z.string().optional() /
  // z.enum(...).optional() / z.string().email().optional() all reject ""
  // (it's a valid non-empty-typed value, just not a valid enum member or
  // email address) — only `undefined` satisfies .optional(). Without this,
  // any row with a blank optional column (state, email, phone, etc.) is
  // rejected as "invalid" even though leaving that field blank is exactly
  // what optional is supposed to allow.
  return (result.data as Record<string, unknown>[]).map((row) => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      cleaned[key] = value === "" ? undefined : value;
    }
    return cleaned;
  });
}

/**
 * Validates each raw row against the given Zod schema, returning a preview
 * that never touches the database. Nothing is committed until the caller
 * explicitly confirms.
 */
export function validateImportRows<T>(
  rawRows: unknown[],
  schema: z.ZodType<T>
): ImportPreview<T> {
  const rows: ImportPreviewRow<T>[] = rawRows.map((raw, index) => {
    const result = schema.safeParse(raw);
    if (result.success) {
      return { index, status: "valid", data: result.data };
    }
    return {
      index,
      status: "invalid",
      raw,
      errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  });

  return {
    rows,
    validCount: rows.filter((r) => r.status === "valid").length,
    invalidCount: rows.filter((r) => r.status === "invalid").length,
  };
}

/**
 * Shared currency code list + labels, originally defined inline in
 * currency-tool.tsx. Pulled out here so break-even-tool.tsx and the
 * Marketplace/Prices currency fields can reuse the exact same list instead
 * of each maintaining their own -- currency-tool.tsx now imports these too.
 *
 * This is a quick-pick list for the currency-selector dropdowns, not a
 * DB-level constraint -- currency-tool.tsx's live-rates fetch already
 * treats the real currency universe as open-ended (falls back to this
 * list only when the live fetch fails), and the `currency` columns on
 * `prices`/`marketplace_listings` are plain unconstrained text for the
 * same reason.
 */

export const COMMON_CODES = ["usd", "gbp", "eur", "ngn", "cad", "cny", "zar", "ghs", "kes", "aed"];

export const CODE_LABELS: Record<string, string> = {
  usd: "US Dollar", gbp: "British Pound", eur: "Euro", ngn: "Nigerian Naira",
  cad: "Canadian Dollar", cny: "Chinese Yuan", zar: "South African Rand",
  ghs: "Ghanaian Cedi", kes: "Kenyan Shilling", aed: "UAE Dirham",
};

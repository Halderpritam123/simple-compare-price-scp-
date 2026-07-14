/**
 * Normalization Engine
 *
 * Parses raw quantity strings into a canonical unit and amount,
 * then computes a unit price for each listing.
 */

import type { CanonicalUnit, NormalizedListing, RawListing } from "../types";

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

export interface ParsedQuantity {
  amount: number;
  unit: CanonicalUnit;
}

// ---------------------------------------------------------------------------
// Conversion constants
// ---------------------------------------------------------------------------

const LB_TO_GRAMS = 453.592;
const OZ_TO_GRAMS = 28.3495;
const FL_OZ_TO_ML = 29.5735;

// ---------------------------------------------------------------------------
// parseQuantity
// ---------------------------------------------------------------------------

/**
 * Parses a raw quantity string into a canonical (amount, unit) pair.
 *
 * Supported formats (case-insensitive, optional whitespace between number and unit):
 *   Weight  : "500g", "1kg", "2.5 kg", "16oz", "1lb", "1.5 lbs"
 *   Volume  : "200ml", "1L", "1 litre", "12fl oz", "12 fl oz"
 *   Count   : "6 pack", "12 items", "3 units"
 *
 * Returns null for any string that does not match a recognised pattern.
 */
export function parseQuantity(raw: string): ParsedQuantity | null {
  const s = raw.trim();

  // ---- Weight ----

  // kilograms: "1kg", "1.5 kg"
  const kgMatch = s.match(/^(\d+(?:\.\d+)?)\s*kgs?$/i);
  if (kgMatch) {
    return { amount: parseFloat(kgMatch[1]) * 1000, unit: "GRAM" };
  }

  // pounds: "1lb", "2.5 lbs"
  const lbMatch = s.match(/^(\d+(?:\.\d+)?)\s*lbs?$/i);
  if (lbMatch) {
    return { amount: parseFloat(lbMatch[1]) * LB_TO_GRAMS, unit: "GRAM" };
  }

  // fluid ounces — must be checked BEFORE plain oz to avoid misparse
  // "12fl oz", "12 fl oz", "12floz"
  const flOzMatch = s.match(/^(\d+(?:\.\d+)?)\s*fl\.?\s*oz$/i);
  if (flOzMatch) {
    return { amount: parseFloat(flOzMatch[1]) * FL_OZ_TO_ML, unit: "MILLILITRE" };
  }

  // ounces (weight): "16oz", "1.5 oz"
  const ozMatch = s.match(/^(\d+(?:\.\d+)?)\s*oz$/i);
  if (ozMatch) {
    return { amount: parseFloat(ozMatch[1]) * OZ_TO_GRAMS, unit: "GRAM" };
  }

  // grams: "500g", "500 g", "500gm", "500 gm", "500gram", "500grams"
  const gMatch = s.match(/^(\d+(?:\.\d+)?)\s*(?:grams?|gm|g)$/i);
  if (gMatch) {
    return { amount: parseFloat(gMatch[1]), unit: "GRAM" };
  }

  // ---- Volume ----

  // litres: "1L", "1l", "1 litre", "1 liter", "1 litres", "1 liters"
  const litreMatch = s.match(/^(\d+(?:\.\d+)?)\s*(?:l|litres?|liters?)$/i);
  if (litreMatch) {
    return { amount: parseFloat(litreMatch[1]) * 1000, unit: "MILLILITRE" };
  }

  // millilitres: "200ml", "200 ml"
  const mlMatch = s.match(/^(\d+(?:\.\d+)?)\s*ml$/i);
  if (mlMatch) {
    return { amount: parseFloat(mlMatch[1]), unit: "MILLILITRE" };
  }

  // ---- Count ----

  // "6 pack", "6pack", "12 items", "3 units"
  const countMatch = s.match(/^(\d+)\s*(?:pack|items?|units?)$/i);
  if (countMatch) {
    return { amount: parseInt(countMatch[1], 10), unit: "ITEM" };
  }

  return null;
}

// ---------------------------------------------------------------------------
// normalize
// ---------------------------------------------------------------------------

/** Reference amount used when computing unit price */
function referenceAmountFor(unit: CanonicalUnit): number {
  return unit === "ITEM" ? 1 : 100;
}

/** Human-readable label for the reference unit */
function unitLabel(unit: CanonicalUnit): string {
  switch (unit) {
    case "GRAM":
      return "100g";
    case "MILLILITRE":
      return "100ml";
    case "ITEM":
      return "item";
  }
}

/**
 * Normalizes a raw listing to a unit price.
 *
 * When the quantity can be parsed:
 *   unitPrice = price / (parsedAmount / referenceAmount)
 *   unitPriceLabel = e.g. "₹48.00 per 100g"
 *   normalizationStatus = "ok"
 *
 * When the quantity cannot be parsed:
 *   parsedAmount / parsedUnit / unitPrice / referenceAmount are set to
 *   sentinel values (0 / "ITEM" / 0 / 1) and normalizationStatus = "unavailable".
 */
export function normalize(listing: RawListing): NormalizedListing {
  const parsed = parseQuantity(listing.rawQuantity);

  if (parsed === null) {
    return {
      ...listing,
      parsedAmount: 0,
      parsedUnit: "ITEM",
      unitPrice: 0,
      referenceAmount: 1,
      unitPriceLabel: "unavailable",
      normalizationStatus: "unavailable",
    };
  }

  const { amount, unit } = parsed;
  const refAmount = referenceAmountFor(unit);
  const unitPrice = listing.price / (amount / refAmount);

  return {
    ...listing,
    parsedAmount: amount,
    parsedUnit: unit,
    unitPrice,
    referenceAmount: refAmount,
    unitPriceLabel: `₹${unitPrice.toFixed(2)} per ${unitLabel(unit)}`,
    normalizationStatus: "ok",
  };
}

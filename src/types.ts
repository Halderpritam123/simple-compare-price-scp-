/**
 * Core types for the Price Comparator.
 * All comparison logic operates on these interfaces.
 */

/** Canonical unit of measurement after normalization */
export type CanonicalUnit = "GRAM" | "MILLILITRE" | "ITEM";

/**
 * A raw product listing as entered by the user.
 * This is the input to the system before any normalization.
 */
export interface RawListing {
  /** Online grocery retailer, e.g. "Blinkit", "Zepto" */
  platform: string;
  /** Manufacturer or brand, e.g. "Amul", "Nestlé" */
  company: string;
  /** Product name as entered by the user, e.g. "Butter" */
  productName: string;
  /** Quantity string as entered, e.g. "500g", "1kg", "200ml", "6 pack" */
  rawQuantity: string;
  /** Price in the user's currency */
  price: number;
}

/**
 * A listing that has been parsed and normalized to a unit price.
 * Extends RawListing with computed normalization fields.
 */
export interface NormalizedListing extends RawListing {
  /** Numeric quantity after unit conversion (e.g. 500 for "500g", 1000 for "1kg") */
  parsedAmount: number;
  /** The canonical unit the parsedAmount is expressed in */
  parsedUnit: CanonicalUnit;
  /**
   * Price per reference amount.
   * Reference amount is 100 for weight/volume, 1 for items.
   */
  unitPrice: number;
  /** Reference amount used to compute unitPrice (100 for g/ml, 1 for items) */
  referenceAmount: number;
  /** Human-readable unit price label, e.g. "₹0.45 per 100g" */
  unitPriceLabel: string;
  /**
   * "ok" when quantity was successfully parsed and unit price computed.
   * "unavailable" when the quantity string could not be parsed.
   */
  normalizationStatus: "ok" | "unavailable";
}

/**
 * A single result in the ranked comparison list.
 * Wraps a NormalizedListing with rank and difference metadata.
 */
export interface RankedResult {
  /** 1-based rank position; tied listings share the same rank value */
  rank: number;
  /** The normalized listing this result is for */
  listing: NormalizedListing;
  /**
   * Absolute unit price difference vs the cheapest listing.
   * null for rank 1 (the cheapest listing itself).
   */
  absoluteDiff: number | null;
  /**
   * Percentage unit price difference vs the cheapest listing.
   * Computed as ((unitPrice - cheapestUnitPrice) / cheapestUnitPrice) * 100.
   * null for rank 1.
   */
  percentageDiff: number | null;
  /**
   * Plain-language explanation, e.g.:
   * "Amul Butter on Blinkit is 23% cheaper per 100g than Amul Butter on Zepto"
   */
  explanation: string;
}

/**
 * The final output of a comparison run.
 * Contains the full ranked list sorted cheapest-first.
 * Listings with normalizationStatus = "unavailable" appear at the end.
 */
export interface ComparisonResult {
  results: RankedResult[];
}

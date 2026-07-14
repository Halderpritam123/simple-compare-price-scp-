/**
 * Comparison Orchestrator
 *
 * Ties together the full pipeline:
 *   1. Validate each raw listing (Input Handler)
 *   2. Normalize valid listings to a unit price (Normalization Engine)
 *   3. Rank normalized listings cheapest-first (Ranker & Explainer)
 *
 * All validation errors are collected and surfaced in the returned
 * ComparisonResult so callers can present them all at once.
 */

import type { ComparisonResult, RawListing } from "../types";
import { validateListing, type ValidationErrors } from "./inputHandler";
import { normalize } from "./normalizer";
import { rank } from "./ranker";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * A validation failure for a single listing.
 * `index` is the 0-based position of the listing in the input array so the
 * caller can map errors back to the original entries.
 */
export interface ListingValidationError {
  index: number;
  errors: ValidationErrors;
}

/**
 * Extended comparison result that also carries any validation errors
 * collected during the run.
 *
 * `validationErrors` is empty when every listing passed validation.
 * `results` contains only the listings that were valid and could be ranked.
 */
export interface ComparisonResultWithErrors extends ComparisonResult {
  validationErrors: ListingValidationError[];
}

// ---------------------------------------------------------------------------
// compare
// ---------------------------------------------------------------------------

/**
 * Runs the full comparison pipeline for the given raw listings.
 *
 * Pipeline:
 *   Validate → Normalize → Rank
 *
 * Listings that fail validation are excluded from normalization and ranking.
 * Their per-field errors are collected in `validationErrors`.
 *
 * Listings that pass validation but have an unparseable quantity are
 * normalized with `normalizationStatus = "unavailable"` and placed at the
 * end of the ranked list (handled transparently by the normalizer/ranker).
 *
 * Returns a ComparisonResultWithErrors regardless of how many listings
 * pass or fail — the caller decides how to present the outcome.
 */
export function compare(listings: RawListing[]): ComparisonResultWithErrors {
  const validationErrors: ListingValidationError[] = [];
  const validListings: RawListing[] = [];

  // ---- Step 1: Validate ----
  for (let i = 0; i < listings.length; i++) {
    const result = validateListing(listings[i]);
    if (result.ok) {
      validListings.push(result.listing);
    } else {
      validationErrors.push({ index: i, errors: result.errors });
    }
  }

  // ---- Step 2: Normalize ----
  const normalizedListings = validListings.map((listing) => normalize(listing));

  // ---- Step 3: Rank ----
  const results = rank(normalizedListings);

  return {
    results,
    validationErrors,
  };
}

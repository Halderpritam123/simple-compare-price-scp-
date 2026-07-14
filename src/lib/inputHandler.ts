import type { RawListing } from "../types";

/**
 * Per-field validation errors returned when a listing fails validation.
 * Each key is present only when that field has an error.
 */
export interface ValidationErrors {
  platform?: string;
  company?: string;
  price?: string;
}

/**
 * The result of validating a raw listing.
 * Either the listing is valid (ok: true) or there are per-field errors (ok: false).
 */
export type ValidationResult =
  | { ok: true; listing: RawListing }
  | { ok: false; errors: ValidationErrors };

/**
 * Validates a raw listing entered by the user.
 *
 * Rules (per Requirements 1.4 and 2.1):
 * - price must be a positive number (greater than zero)
 *
 * All failing fields are collected and returned together so the caller can
 * display all errors at once rather than one at a time.
 */
export function validateListing(raw: RawListing): ValidationResult {
  const errors: ValidationErrors = {};

  if (!raw.platform || raw.platform.trim() === "") {
    errors.platform = "Platform is required.";
  }

  if (!isFinite(raw.price) || raw.price <= 0) {
    errors.price = "Price must be a positive number.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, listing: raw };
}

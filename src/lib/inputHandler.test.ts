import { describe, it, expect } from "vitest";
import { validateListing } from "./inputHandler";
import type { RawListing } from "../types";

/** A valid base listing used as a starting point in tests */
const validListing: RawListing = {
  platform: "Blinkit",
  company: "Amul",
  productName: "Butter",
  rawQuantity: "500g",
  price: 55,
};

describe("validateListing", () => {
  // ── Happy path ────────────────────────────────────────────────────────────

  it("accepts a fully valid listing", () => {
    const result = validateListing(validListing);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.listing).toEqual(validListing);
    }
  });

  it("returns the original listing object when valid", () => {
    const result = validateListing(validListing);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.listing).toBe(validListing);
    }
  });

  // ── Platform validation ───────────────────────────────────────────────────

  it("rejects an empty platform string", () => {
    const result = validateListing({ ...validListing, platform: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.platform).toBeDefined();
    }
  });

  it("rejects a whitespace-only platform string", () => {
    const result = validateListing({ ...validListing, platform: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.platform).toBeDefined();
    }
  });

  // ── Company validation ────────────────────────────────────────────────────

  it("rejects an empty company string", () => {
    const result = validateListing({ ...validListing, company: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.company).toBeDefined();
    }
  });

  it("rejects a whitespace-only company string", () => {
    const result = validateListing({ ...validListing, company: "\t" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.company).toBeDefined();
    }
  });

  // ── Product name validation ───────────────────────────────────────────────

  it("rejects an empty productName string", () => {
    const result = validateListing({ ...validListing, productName: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.productName).toBeDefined();
    }
  });

  it("rejects a whitespace-only productName string", () => {
    const result = validateListing({ ...validListing, productName: "  \n  " });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.productName).toBeDefined();
    }
  });

  // ── Price validation ──────────────────────────────────────────────────────

  it("rejects a price of zero", () => {
    const result = validateListing({ ...validListing, price: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.price).toBeDefined();
    }
  });

  it("rejects a negative price", () => {
    const result = validateListing({ ...validListing, price: -10 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.price).toBeDefined();
    }
  });

  it("accepts a price of 0.01 (minimum positive value)", () => {
    const result = validateListing({ ...validListing, price: 0.01 });
    expect(result.ok).toBe(true);
  });

  it("accepts a very large price", () => {
    const result = validateListing({ ...validListing, price: 1_000_000 });
    expect(result.ok).toBe(true);
  });

  // ── Multiple errors at once ───────────────────────────────────────────────

  it("reports errors for all invalid fields simultaneously", () => {
    const result = validateListing({
      platform: "",
      company: "",
      productName: "",
      rawQuantity: "",
      price: -5,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.platform).toBeDefined();
      expect(result.errors.company).toBeDefined();
      expect(result.errors.productName).toBeDefined();
      expect(result.errors.price).toBeDefined();
    }
  });

  // ── rawQuantity is not validated by the input handler ─────────────────────

  it("does not reject an empty rawQuantity (handled downstream by normalizer)", () => {
    const result = validateListing({ ...validListing, rawQuantity: "" });
    expect(result.ok).toBe(true);
  });
});

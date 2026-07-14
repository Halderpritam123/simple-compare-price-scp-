/**
 * Ranker & Explainer
 *
 * Sorts normalized listings by unit price (cheapest first), assigns ranks,
 * computes absolute/percentage differences vs the cheapest, and generates
 * plain-language explanations.
 */

import type { NormalizedListing, RankedResult } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a plain-language explanation for a result.
 *
 * Rank-1 (cheapest available):
 *   "Amul Butter on Blinkit is the cheapest at ₹48.00 per 100g"
 *
 * Non-cheapest (has a valid unit price):
 *   "Amul Butter on Zepto is 6.7% more expensive per 100g than on Blinkit"
 *
 * Unavailable:
 *   "Amul Butter on Zepto: unit price unavailable"
 *
 * Tied with cheapest:
 *   "Amul Butter on Zepto is tied for best value at ₹48.00 per 100g"
 */
function buildExplanation(
  listing: NormalizedListing,
  cheapest: NormalizedListing | null,
  percentageDiff: number | null
): string {
  const subject = `${listing.company ? listing.company + " on " : ""}${listing.platform}`;

  if (listing.normalizationStatus === "unavailable") {
    return `${subject}: unit price unavailable`;
  }

  if (cheapest === null) {
    return `${subject}: unit price unavailable`;
  }

  if (percentageDiff === null || percentageDiff === 0) {
    if (cheapest.platform === listing.platform && percentageDiff === null) {
      return `${subject} is the cheapest at ${listing.unitPriceLabel}`;
    }
    return `${subject} is tied for best value at ${listing.unitPriceLabel}`;
  }

  const pct = percentageDiff.toFixed(1);
  return `${subject} is ${pct}% more expensive per ${_unitSuffix(listing)} than on ${cheapest.platform}`;
}

/** Returns the short unit suffix used in explanations ("100g", "100ml", "item") */
function _unitSuffix(listing: NormalizedListing): string {
  switch (listing.parsedUnit) {
    case "GRAM":
      return "100g";
    case "MILLILITRE":
      return "100ml";
    case "ITEM":
      return "item";
  }
}

// ---------------------------------------------------------------------------
// rank
// ---------------------------------------------------------------------------

/**
 * Ranks an array of normalized listings from cheapest to most expensive.
 *
 * Rules:
 * 1. Listings with `normalizationStatus = "unavailable"` are placed at the end.
 * 2. Available listings are sorted by `unitPrice` ascending.
 * 3. Listings with identical `unitPrice` receive the same rank number.
 *    The next distinct price receives rank = (number of listings with lower price) + 1.
 * 4. For each non-cheapest listing, `absoluteDiff` and `percentageDiff` are
 *    computed relative to the cheapest available listing.
 * 5. The cheapest listing (rank 1) has `absoluteDiff = null`, `percentageDiff = null`.
 * 6. All unavailable listings have `absoluteDiff = null`, `percentageDiff = null`.
 */
export function rank(listings: NormalizedListing[]): RankedResult[] {
  if (listings.length === 0) return [];

  // Partition into available and unavailable
  const available = listings.filter((l) => l.normalizationStatus === "ok");
  const unavailable = listings.filter((l) => l.normalizationStatus === "unavailable");

  // Sort available listings by unitPrice ascending
  const sorted = [...available].sort((a, b) => a.unitPrice - b.unitPrice);

  // The cheapest is the first after sorting (null when no available listings)
  const cheapest: NormalizedListing | null = sorted.length > 0 ? sorted[0] : null;

  // Assign ranks using a dense-rank strategy:
  // rank = number of listings with a strictly lower unitPrice + 1
  const results: RankedResult[] = sorted.map((listing, index) => {
    const isFirst = index === 0;

    // Count how many listings before this one have a strictly lower price
    // (equivalent to: find the first index in the sorted array with this price)
    const rankValue =
      sorted.slice(0, index).filter((l) => l.unitPrice < listing.unitPrice).length + 1;

    if (isFirst || (cheapest && listing.unitPrice === cheapest.unitPrice)) {
      // Cheapest (or tied for cheapest) — no diff vs itself
      // Distinguish: is this THE cheapest (rank 1, first occurrence) or a tie?
      const isTrulyFirst = cheapest && listing === cheapest;
      return {
        rank: rankValue,
        listing,
        absoluteDiff: null,
        percentageDiff: null,
        explanation: isTrulyFirst
          ? buildExplanation(listing, cheapest, null)
          : buildExplanation(listing, cheapest, 0),
      };
    }

    const absoluteDiff = listing.unitPrice - cheapest!.unitPrice;
    const percentageDiff = ((listing.unitPrice - cheapest!.unitPrice) / cheapest!.unitPrice) * 100;

    return {
      rank: rankValue,
      listing,
      absoluteDiff,
      percentageDiff,
      explanation: buildExplanation(listing, cheapest, percentageDiff),
    };
  });

  // Append unavailable listings at the end — rank them after all available ones
  const nextRank = sorted.length + 1;
  const unavailableResults: RankedResult[] = unavailable.map((listing, index) => ({
    rank: nextRank + index,
    listing,
    absoluteDiff: null,
    percentageDiff: null,
    explanation: buildExplanation(listing, cheapest, null),
  }));

  return [...results, ...unavailableResults];
}

import type { RankedResult } from "../types";

interface ResultsTableProps {
  /** Ranked comparison results, sorted cheapest-first. */
  results: RankedResult[];
}

/**
 * ResultsTable — displays the ranked comparison output.
 *
 * Each row shows: rank, platform, company, product name, quantity,
 * unit price label, percentage difference vs cheapest, and a plain-language
 * explanation. The rank-1 row is highlighted as "Best Value". Listings
 * whose quantity could not be parsed show "Unit price unavailable" in place
 * of the unit price and diff columns.
 *
 * Requirements: 1.2, 1.3, 2.1, 3.6, 4.2, 4.3, 4.4
 */
export function ResultsTable({ results }: ResultsTableProps) {
  if (results.length === 0) {
    return (
      <section className="results-table" aria-label="Comparison results">
        <p className="results-table__empty">
          No results yet. Add listings above and click "Compare" to see the
          ranking.
        </p>
      </section>
    );
  }

  return (
    <section className="results-table" aria-label="Comparison results">
      <div className="results-table__scroll">
        <table className="results-table__table">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Platform</th>
              <th scope="col">Company</th>
              <th scope="col">Quantity</th>
              <th scope="col">Unit Price</th>
              <th scope="col">% vs Cheapest</th>
              <th scope="col">Explanation</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <ResultRow key={index} result={result} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Internal ResultRow component
// ---------------------------------------------------------------------------

interface ResultRowProps {
  result: RankedResult;
}

function ResultRow({ result }: ResultRowProps) {
  const { rank, listing, percentageDiff, explanation } = result;
  const isBestValue = rank === 1;
  const isUnavailable = listing.normalizationStatus === "unavailable";

  const rowClass = [
    "results-table__row",
    isBestValue ? "results-table__row--best" : "",
    isUnavailable ? "results-table__row--unavailable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className={rowClass} aria-label={isBestValue ? "Best Value" : undefined}>
      <td data-label="Rank">
        {isBestValue ? (
          <span className="results-table__best-badge" aria-label="Best Value">
            🏆 1
          </span>
        ) : (
          rank
        )}
      </td>
      <td data-label="Platform">{listing.platform}</td>
      <td data-label="Company">{listing.company}</td>
      <td data-label="Quantity">{listing.rawQuantity}</td>
      <td data-label="Unit Price">
        {isUnavailable ? (
          <span className="results-table__unavailable" aria-label="Unit price unavailable">
            Unit price unavailable
          </span>
        ) : (
          listing.unitPriceLabel
        )}
      </td>
      <td data-label="% vs Cheapest">
        {isUnavailable ? (
          <span className="results-table__unavailable">—</span>
        ) : percentageDiff === null ? (
          <span className="results-table__best-diff" aria-label="Cheapest option">
            Cheapest
          </span>
        ) : (
          <span className="results-table__diff">
            +{percentageDiff.toFixed(1)}%
          </span>
        )}
      </td>
      <td data-label="Explanation">
        <span className="results-table__explanation">{explanation}</span>
      </td>
    </tr>
  );
}

import type { RawListing } from "../types";

interface ListingTableProps {
  /** All listings entered so far in the current session. */
  listings: RawListing[];
  /** Called with the 0-based index of the listing to remove. */
  onRemove: (index: number) => void;
  /** Called when the user clicks "Compare". */
  onCompare: () => void;
}

/**
 * ListingTable — shows all entered listings in a summary table.
 *
 * Each row displays the listing's details and a "Remove" button.
 * A "Compare" button at the bottom triggers the comparison run.
 * When there are no listings, a prompt message is shown instead of an empty table.
 *
 * Requirements: 1.5, 2.2
 */
export function ListingTable({ listings, onRemove, onCompare }: ListingTableProps) {
  return (
    <section className="listing-table" aria-label="Entered listings">
      {listings.length === 0 ? (
        <p className="listing-table__empty">
          No listings added yet. Use the form above to add products to compare.
        </p>
      ) : (
        <div className="listing-table__scroll">
          <table className="listing-table__table">
            <thead>
              <tr>
                <th scope="col">Platform</th>
                <th scope="col">Company</th>
                <th scope="col">Quantity</th>
                <th scope="col">Price</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing, index) => (
                <tr key={index} className="listing-table__row">
                  <td data-label="Platform">{listing.platform}</td>
                  <td data-label="Company">{listing.company}</td>
                  <td data-label="Quantity">{listing.rawQuantity}</td>
                  <td data-label="Price">{listing.price}</td>
                  <td className="listing-table__actions">
                    <button
                      type="button"
                      className="listing-table__remove"
                      onClick={() => onRemove(index)}
                      aria-label={`Remove ${listing.company} on ${listing.platform}`}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="listing-table__footer">
        <button
          type="button"
          className="listing-table__compare"
          onClick={onCompare}
          disabled={listings.length < 1}
          aria-label="Compare all listed products"
        >
          Compare
        </button>
        {listings.length > 0 && (
          <span className="listing-table__count" aria-live="polite">
            {listings.length} listing{listings.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </section>
  );
}

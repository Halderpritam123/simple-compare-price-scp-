interface CompanyFilterProps {
  /** List of company names available in the current results. */
  companies: string[];
  /** Currently selected company, or "All" to show all companies. */
  selected: string;
  /** Called when the user picks a different company from the dropdown. */
  onChange: (company: string) => void;
}

/**
 * CompanyFilter — a dropdown that lets the user narrow the results table to
 * a single company, or restore the full list by choosing "All".
 *
 * Requirements: 2.3
 */
export function CompanyFilter({ companies, selected, onChange }: CompanyFilterProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value);
  }

  return (
    <div className="company-filter">
      <label htmlFor="company-filter-select" className="company-filter__label">
        Filter by Company
      </label>
      <select
        id="company-filter-select"
        className="company-filter__select"
        value={selected}
        onChange={handleChange}
        aria-label="Filter results by company"
      >
        <option value="All">All</option>
        {companies.map((company) => (
          <option key={company} value={company}>
            {company}
          </option>
        ))}
      </select>
    </div>
  );
}

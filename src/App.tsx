import { useState } from "react";
import { ResultsTable } from "./components/ResultsTable";
import { CompanyFilter } from "./components/CompanyFilter";
import { compare } from "./lib/comparator";
import { normalize } from "./lib/normalizer";
import type { RankedResult } from "./types";
import "./index.css";

interface Row {
  platform: string;
  company: string;
  rawQuantity: string;
  price: string;
}

const EMPTY_ROW = (): Row => ({ platform: "", company: "", rawQuantity: "", price: "" });

function App() {
  const [rows, setRows] = useState<Row[]>([EMPTY_ROW(), EMPTY_ROW()]);
  const [results, setResults] = useState<RankedResult[]>([]);
  const [activeCompany, setActiveCompany] = useState("All");
  const [compareError, setCompareError] = useState("");

  function updateRow(index: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
    setCompareError("");
  }

  function addRow() {
    setRows((prev) => [...prev, EMPTY_ROW()]);
  }

  function removeRow(index: number) {
    if (rows.length <= 2) return; // keep minimum 2 rows
    setRows((prev) => prev.filter((_, i) => i !== index));
    setResults([]);
    setCompareError("");
  }

  function handleCompare() {
    // Filter out completely empty rows
    const filled = rows.filter(
      (r) => r.platform.trim() || r.rawQuantity.trim() || r.price.trim()
    );

    if (filled.length < 2) {
      setCompareError("Fill in at least 2 listings before comparing.");
      return;
    }

    // Validate each filled row
    const errors: string[] = [];
    filled.forEach((r, i) => {
      if (!r.platform.trim()) errors.push(`Row ${i + 1}: Platform is required.`);
      if (!r.rawQuantity.trim()) errors.push(`Row ${i + 1}: Quantity is required.`);
      const p = parseFloat(r.price);
      if (isNaN(p) || p <= 0) errors.push(`Row ${i + 1}: Price must be a positive number.`);
    });

    if (errors.length > 0) {
      setCompareError(errors[0]);
      return;
    }

    setCompareError("");
    const listings = filled.map((r) => ({
      platform: r.platform.trim(),
      company: r.company.trim(),
      rawQuantity: r.rawQuantity.trim(),
      price: parseFloat(r.price),
    }));

    const { results: ranked } = compare(listings);
    setResults(ranked);
    setActiveCompany("All");
  }

  const companies = Array.from(
    new Set(
      results
        .filter((r) => r.listing.normalizationStatus === "ok")
        .map((r) => r.listing.company)
        .filter(Boolean)
    )
  ).sort();

  const filteredResults =
    activeCompany === "All"
      ? results
      : results.filter((r) => r.listing.company === activeCompany);

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Price Comparator</h1>
        <p className="app__subtitle">
          Fill in the listings below and click Compare to find the best value by unit price.
        </p>
      </header>

      <main className="app__main">
        <section className="app__section">
          <div className="grid-form">
            {/* Header row */}
            <div className="grid-form__header">
              <span>Platform</span>
              <span>Company <em>(optional)</em></span>
              <span>Quantity</span>
              <span>Price</span>
              <span></span>
            </div>

            {/* Data rows */}
            {rows.map((row, i) => {
              const qty = row.rawQuantity.trim();
              const qtyWarn = qty !== "" && normalize({
                platform: row.platform,
                company: row.company,
                rawQuantity: qty,
                price: 1,
              }).normalizationStatus === "unavailable";

              return (
                <div key={i} className="grid-form__row">
                  <input
                    className="grid-form__input"
                    placeholder="e.g. Blinkit"
                    value={row.platform}
                    onChange={(e) => updateRow(i, "platform", e.target.value)}
                    aria-label={`Row ${i + 1} platform`}
                  />
                  <input
                    className="grid-form__input"
                    placeholder="e.g. Amul"
                    value={row.company}
                    onChange={(e) => updateRow(i, "company", e.target.value)}
                    aria-label={`Row ${i + 1} company`}
                  />
                  <div className="grid-form__qty-wrap">
                    <input
                      className={`grid-form__input${qtyWarn ? " grid-form__input--warn" : ""}`}
                      placeholder="e.g. 500g, 1kg, 1L"
                      value={row.rawQuantity}
                      onChange={(e) => updateRow(i, "rawQuantity", e.target.value)}
                      aria-label={`Row ${i + 1} quantity`}
                    />
                    {qtyWarn && (
                      <span className="grid-form__qty-warn" title="Quantity format not recognised — use e.g. 500g, 1kg, 200ml">⚠</span>
                    )}
                  </div>
                  <input
                    className="grid-form__input"
                    placeholder="e.g. 99"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={row.price}
                    onChange={(e) => updateRow(i, "price", e.target.value)}
                    aria-label={`Row ${i + 1} price`}
                  />
                  <button
                    type="button"
                    className="grid-form__remove"
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= 2}
                    aria-label={`Remove row ${i + 1}`}
                  >✕</button>
                </div>
              );
            })}

            {/* Actions */}
            <div className="grid-form__actions">
              <button type="button" className="grid-form__add-row" onClick={addRow}>
                + Add row
              </button>
              <div className="grid-form__right">
                {compareError && (
                  <span className="grid-form__error" role="alert">{compareError}</span>
                )}
                <button type="button" className="grid-form__compare" onClick={handleCompare}>
                  Compare
                </button>
              </div>
            </div>
          </div>
        </section>

        {results.length > 0 && (
          <section className="app__section" aria-labelledby="results-heading">
            <div className="app__results-header">
              <h2 id="results-heading" className="app__section-title">Comparison Results</h2>
              {companies.length > 1 && (
                <CompanyFilter companies={companies} selected={activeCompany} onChange={setActiveCompany} />
              )}
            </div>
            <ResultsTable results={filteredResults} />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;

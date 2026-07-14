import { useState } from "react";
import { validateListing } from "../lib/inputHandler";
import type { ValidationErrors } from "../lib/inputHandler";
import type { RawListing } from "../types";

interface ListingFormProps {
  /** Called with the validated listing when the user clicks "Add Listing". */
  onAdd: (listing: RawListing) => void;
}

interface FormFields {
  platform: string;
  company: string;
  productName: string;
  rawQuantity: string;
  price: string;
}

const EMPTY_FIELDS: FormFields = {
  platform: "",
  company: "",
  productName: "",
  rawQuantity: "",
  price: "",
};

/**
 * ListingForm — lets the user enter a single product listing.
 *
 * On submit the form validates every field and either shows inline errors or
 * calls onAdd with the validated RawListing and resets to empty.
 *
 * Requirements: 1.4, 2.1, 2.4
 */
export function ListingForm({ onAdd }: ListingFormProps) {
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<ValidationErrors & { rawQuantity?: string }>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear the error for this field as the user types
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const priceNum = parseFloat(fields.price);

    const raw: RawListing = {
      platform: fields.platform,
      company: fields.company,
      productName: fields.productName,
      rawQuantity: fields.rawQuantity,
      price: isNaN(priceNum) ? -1 : priceNum,
    };

    // Validate quantity separately (not part of inputHandler, but required by the form)
    const newErrors: ValidationErrors & { rawQuantity?: string } = {};

    if (!fields.rawQuantity || fields.rawQuantity.trim() === "") {
      newErrors.rawQuantity = "Quantity is required.";
    }

    const result = validateListing(raw);
    if (!result.ok) {
      Object.assign(newErrors, result.errors);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onAdd(raw);
    setFields(EMPTY_FIELDS);
    setErrors({});
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Add product listing"
      className="listing-form"
    >
      <div className="listing-form__grid">
        <Field
          id="lf-platform"
          label="Platform"
          name="platform"
          value={fields.platform}
          error={errors.platform}
          placeholder="e.g. Blinkit"
          onChange={handleChange}
        />
        <Field
          id="lf-productName"
          label="Product"
          name="productName"
          value={fields.productName}
          placeholder="e.g. Butter"
          onChange={handleChange}
        />
        <Field
          id="lf-company"
          label="Company (optional)"
          name="company"
          value={fields.company}
          placeholder="e.g. Amul"
          onChange={handleChange}
        />
        <Field
          id="lf-rawQuantity"
          label="Quantity"
          name="rawQuantity"
          value={fields.rawQuantity}
          error={errors.rawQuantity}
          placeholder="e.g. 500g, 500gm, 1kg, 1L, 6 pack"
          onChange={handleChange}
        />
        <Field
          id="lf-price"
          label="Price"
          name="price"
          type="number"
          value={fields.price}
          error={errors.price}
          placeholder="e.g. 99"
          inputMode="decimal"
          min="0"
          step="any"
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="listing-form__submit">
        Add Listing
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Internal Field component
// ---------------------------------------------------------------------------

interface FieldProps {
  id: string;
  label: string;
  name: string;
  value: string;
  error?: string;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  min?: string;
  step?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({
  id,
  label,
  name,
  value,
  error,
  placeholder,
  type = "text",
  inputMode,
  min,
  step,
  onChange,
}: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className={`listing-form__field${error ? " listing-form__field--invalid" : ""}`}>
      <label htmlFor={id} className="listing-form__label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        min={min}
        step={step}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="listing-form__input"
      />
      {error && (
        <span id={errorId} role="alert" className="listing-form__error">
          {error}
        </span>
      )}
    </div>
  );
}

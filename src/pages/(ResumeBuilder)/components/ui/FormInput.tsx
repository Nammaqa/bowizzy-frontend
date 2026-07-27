import type { KeyboardEventHandler } from "react";

interface FormInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  error?: string;
  max?: string;
  min?: string;
  maxLength?: number;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  className = '',
  disabled = false,
  error,
  max,
  min,
  maxLength,
  onKeyDown,
}) => {
  const sanitizeMonthValue = (val: string) => {
    if (!val) return "";
    const cleaned = val.replace(/[^0-9-]/g, "");
    if (cleaned.includes("-")) return cleaned.slice(0, 7);
    return cleaned.slice(0, 4);
  };

  const displayValue = type === "month" ? sanitizeMonthValue(value) : value;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs text-gray-600 font-medium">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => {
          const val = e.target.value as string;
          if (type === "month") {
            // Only the native picker should be able to set this value now,
            // but we still sanitize defensively in case a browser fires a
            // change event without a keydown (e.g. autofill).
            const cleaned = val.replace(/[^0-9-]/g, "");
            if (cleaned.includes("-")) {
              onChange(cleaned.slice(0, 7));
            } else {
              onChange(cleaned.slice(0, 4));
            }
            return;
          }
          onChange(val);
        }}
        onKeyDown={(e) => {
          // Make month inputs "non-typeable" - force picker-only selection.
          if (type === "month") {
            const allowedKeys = ["Tab", "Shift", "Escape", "Enter"];
            if (!allowedKeys.includes(e.key)) {
              e.preventDefault();
            }
          }
        }}
        onPaste={(e) => {
          if (type !== "month") return;
          e.preventDefault();
        }}
        disabled={disabled}
        max={max}
        min={min}
        maxLength={maxLength}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none 
          ${error ? "border-red-500" : "border-gray-200 focus:border-orange-400"}
          disabled:bg-gray-50 disabled:text-gray-400`}
      />

      {error && (
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
      )}
    </div>
  );
};
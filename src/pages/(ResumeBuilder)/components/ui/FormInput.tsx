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
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => {
          const val = e.target.value as string;
          if (type === "month") {
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
        onPaste={(e) => {
          if (type !== "month") return;
          const paste = (e.clipboardData || (window as any).clipboardData).getData("text") as string;
          if (!paste) return;
          e.preventDefault();
          const cleaned = paste.replace(/[^0-9-]/g, "");
          if (cleaned.includes("-")) onChange(cleaned.slice(0, 7));
          else onChange(cleaned.slice(0, 4));
        }}
        disabled={disabled}
        max={max}
        min={min}
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
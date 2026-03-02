// FilterBar.jsx
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const normalizeOption = (opt) => {
  if (typeof opt === "string") {
    return { label: opt, value: opt };
  }
  return opt;
};

const useOutsideClick = (ref, handler) => {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
};

const SelectBox = ({
  label,
  value,
  options = [],
  className = "",
  isOpen,
  onToggle,
  onSelect,
}) => {
  const wrapRef = useRef(null);
  useOutsideClick(wrapRef, () => isOpen && onToggle(false));

  const normalizedOptions = options.map(normalizeOption);

  const selectedLabel =
    normalizedOptions.find((opt) => opt.value === value)?.label || "Select";

  return (
    <div
      ref={wrapRef}
      className={`relative flex w-full flex-col gap-1 ${className}`}
    >
      <span className="text-[11px] font-medium text-gray-500">{label}</span>

      <button
        type="button"
        onClick={() => onToggle(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full rounded-md border border-gray-200 bg-white shadow-sm z-50">
          {normalizedOptions.map((opt) => (
            <button
              key={String(opt.value)} // ✅ always safe
              type="button"
              onClick={() => {
                onSelect(opt.value); // always pass VALUE
                onToggle(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SearchBox = ({
  label = "Search",
  placeholder = "Search",
  className = "",
  value,
  onChange,
}) => (
  <div className={`flex w-full flex-col gap-1 ${className}`}>
    <span className="text-[11px] font-medium text-gray-500">{label}</span>
    <input
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      className="h-9 w-full min-w-0 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      placeholder={placeholder}
    />
  </div>
);

const FilterBar = ({
  filters = [],
  children,
  showActions = true,
  onFilterChange,
  onReset,
  onApply,
}) => {
  const [openKey, setOpenKey] = useState(null);

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex flex-1 flex-wrap items-end gap-4">
          {filters.map((f, idx) => {
            const k = f.key || idx;

            if (f.type === "search") {
              return (
                <SearchBox
                  key={k}
                  label={f.label}
                  placeholder={f.placeholder}
                  className={`w-full sm:w-[220px] ${f.className || ""}`}
                  value={f.value}
                  onChange={(val) => onFilterChange?.(f.key, val)}
                />
              );
            }

            return (
              <SelectBox
                key={k}
                label={f.label}
                value={f.value}
                options={f.options || []}
                className={`w-full sm:w-[220px] ${f.className || ""}`}
                isOpen={openKey === k}
                onToggle={(open) => setOpenKey(open ? k : null)}
                onSelect={(val) => onFilterChange?.(f.key, val)}
              />
            );
          })}

          {children}

          {showActions && (
            <div className="sm:flex items-center gap-2 pt-4 space-y-2 sm:space-y-0 ">
              <button
                type="button"
                onClick={onApply}
                className="w-[120px] me-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={onReset}
                className="w-[120px] rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;

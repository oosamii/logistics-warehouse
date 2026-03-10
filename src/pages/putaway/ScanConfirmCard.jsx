import React from "react";
import { ScanLine } from "lucide-react";

const Card = ({ title, children }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center gap-2">
      <div className="text-lg font-semibold text-gray-900">{title}</div>
    </div>
    {children}
  </div>
);

const StepTitle = ({ num, title, right }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="text-sm font-semibold text-gray-900">
      {num}. {title}
    </div>
    {right}
  </div>
);

const InputLabel = ({ children }) => (
  <div className="mb-2 text-sm font-medium text-gray-900">{children}</div>
);

const TextInput = ({
  value,
  onChange,
  placeholder,
  rightIcon,
  readOnly = false,
}) => (
  <div className="relative">
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={[
        "w-full rounded-lg border px-4 py-3 text-sm",
        readOnly
          ? "border-gray-200 bg-gray-50 text-gray-700"
          : "border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100",
      ].join(" ")}
    />
    {rightIcon && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        {rightIcon}
      </div>
    )}
  </div>
);

const NumberInput = ({ value, onChange, disabled }) => (
  <input
    type="number"
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    disabled={disabled}
    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
  />
);

const ScanConfirmCard = ({
  task,
  scanSku,
  setScanSku,
  goodQty,
  setGoodQty,
  holdQty,
  setHoldQty,
}) => {
  return (
    <Card title="Scan & Confirm">
      {/* Step 1 */}
      <StepTitle
        num={1}
        title="Confirm SKU"
        right={
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-xs text-gray-400">
            ✓
          </span>
        }
      />
      <div className="mt-4">
        <InputLabel>Scan SKU Barcode</InputLabel>
        <TextInput
          disabled
          value={scanSku}
          onChange={setScanSku}
          placeholder="Click to scan or enter SKU..."
          // rightIcon={<ScanLine size={18} />}
        />
      </div>

      <div className="my-6 h-px w-full bg-gray-100" />

      {/* Step 2 */}
      <StepTitle
        num={2}
        title="Confirm Batch/Expiry"
        right={
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Read-Only
          </span>
        }
      />
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <InputLabel>Batch No</InputLabel>
          <TextInput value="B-2023-X99" readOnly />
        </div>
        <div>
          <InputLabel>Expiry Date</InputLabel>
          <TextInput value="2025-12-31" readOnly />
        </div>
      </div>

      <div className="my-6 h-px w-full bg-gray-100" />

      {/* Step 3 */}
      <StepTitle num={3} title="Confirm Quantity" />
      <div className="mt-4 space-y-5">
        <div>
          <InputLabel>Putaway Good Qty</InputLabel>
          <NumberInput disabled value={goodQty} onChange={setGoodQty} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            {/* <InputLabel>Damaged / Hold Qty</InputLabel> */}
            {/* <button className="text-sm font-medium text-blue-600 hover:underline">
              + Add Note
            </button> */}
          </div>
          {/* <NumberInput value={holdQty} onChange={setHoldQty} /> */}
        </div>
      </div>
    </Card>
  );
};

export default ScanConfirmCard;

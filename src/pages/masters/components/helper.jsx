import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
export const ComingSoon = ({ label }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-700">
    {label} CRUD will go here (share APIs next).
  </div>
);

export const Field = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  error = "",
}) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-gray-500">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>

      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className={[
            "w-full rounded-md border px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2",
            error
              ? "border-red-500 focus:ring-red-100"
              : "border-gray-200 focus:ring-blue-100",
          ].join(" ")}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export const Modal = ({ title, subtitle, onClose, children, footer }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
    <div className="w-full max-w-xl rounded-lg bg-white shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-start justify-between border-b px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      {/* Body (scroll happens here) */}
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

      {/* Footer */}
      <div className="border-t px-5 py-4 flex items-center justify-end gap-3">
        {footer}
      </div>
    </div>
  </div>
);

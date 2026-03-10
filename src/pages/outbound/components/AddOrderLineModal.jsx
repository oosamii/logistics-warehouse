import { useEffect, useState, useRef } from "react";
import http from "@/api/http";
import Pagination from "@/pages/components/Pagination";

const AddOrderLineModal = ({ open, onClose, onSave, editLine, clientId }) => {
  const [formData, setFormData] = useState({
    sku_id: editLine?.sku_id || "",
    sku: editLine?.sku || "",
    ordered_qty: editLine?.ordered_qty || 1,
    uom: editLine?.uom || "EA",
    allocation_rule: editLine?.allocation_rule || "FIFO",
    batch_preference: editLine?.batch_preference || "",
    expiry_date_min: editLine?.expiry_date_min || "",
    unit_price: editLine?.unit_price || 0,
    discount_percent: editLine?.discount_percent || 0,
    discount_amount: editLine?.discount_amount || 0,
    tax_percent: editLine?.tax_percent || 0,
    tax_amount: editLine?.tax_amount || 0,
    notes: editLine?.notes || "",
  });

  const [skus, setSkus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 5,
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");

  const wrapperRef = useRef(null);
  const debounceTimeout = useRef(null);

  // const loadSkus = async (page = 1, query = "") => {
  //   try {
  //     setLoading(true);

  //     const qs = new URLSearchParams();
  //     qs.set("page", String(page));
  //     qs.set("limit", "5");
  //     if (query.trim()) qs.set("search", query.trim());

  //     const res = await http.get(`/skus?${qs.toString()}`);
  //     const list = res?.data?.data?.skus || [];
  //     const pag = res?.data?.data?.pagination || {};

  //     setSkus(list);
  //     setPagination({
  //       total: pag.total ?? 0,
  //       page: pag.page ?? page,
  //       pages: pag.pages ?? 1,
  //       limit: pag.limit ?? 5,
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const loadSkus = async (page = 1, query = "") => {
    try {
      setLoading(true);

      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", "5");

      if (query.trim()) qs.set("search", query.trim());

      // add this
      if (clientId) qs.set("client_id", clientId);

      const res = await http.get(`/skus?${qs.toString()}`);

      const list = res?.data?.data?.skus || [];
      const pag = res?.data?.data?.pagination || {};

      setSkus(list);
      setPagination({
        total: pag.total ?? 0,
        page: pag.page ?? page,
        pages: pag.pages ?? 1,
        limit: pag.limit ?? 5,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSkuInputChange = (value) => {
    setFormData((prev) => ({ ...prev, sku: value }));
    setShowDropdown(true);
    setSearch(value);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      loadSkus(1, value);
    }, 300);
  };

  useEffect(() => {
    if (open && showDropdown) loadSkus(1, search);
  }, [open, showDropdown, search]);

  useEffect(() => {
    if (!open || !showDropdown) return;

    const timeout = setTimeout(() => {
      loadSkus(1, search);
    }, 250);

    return () => clearTimeout(timeout);
  }, [search, open, showDropdown]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSkuSelect = (sku) => {
    setFormData((prev) => ({
      ...prev,
      sku_id: sku.id,
      sku: sku.sku_code,
      uom: sku.uom || "EA",
      allocation_rule: sku.pick_rule || "FIFO",
      unit_price: sku.unit_price || 0,
    }));
    setShowDropdown(false);
    setSearch("");
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "sku") {
      setSearch(value);
      setShowDropdown(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const discount_amount =
      (formData.unit_price * formData.ordered_qty * formData.discount_percent) /
      100;
    const tax_amount =
      ((formData.unit_price * formData.ordered_qty - discount_amount) *
        formData.tax_percent) /
      100;
    onSave?.({ ...formData, discount_amount, tax_amount });

    setFormData({
      sku_id: "",
      sku: "",
      ordered_qty: 1,
      uom: "EA",
      allocation_rule: "FIFO",
      batch_preference: "",
      expiry_date_min: "",
      unit_price: 0,
      discount_percent: 0,
      discount_amount: 0,
      tax_percent: 0,
      tax_amount: 0,
      notes: "",
    });
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-2 sm:p-4">
      <div className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col max-h-[95vh] sm:max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-3 sm:p-4 border-b flex items-center justify-between flex-shrink-0">
            <h2 className="font-semibold text-base sm:text-lg">
              Add Order Line
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-900 text-xl sm:text-2xl w-8 h-8 flex items-center justify-center"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div
            className="p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4"
            ref={wrapperRef}
          >
            {/* SKU */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onFocus={() => {
                  setShowDropdown(true);
                  loadSkus(1, search);
                }}
                onChange={(e) => handleSkuInputChange(e.target.value)}
                placeholder="Type or click to select SKU..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />

              {showDropdown && (
                <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md mt-1 max-h-48 sm:max-h-60 overflow-y-auto shadow-lg">
                  {loading ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      Loading…
                    </div>
                  ) : skus.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      No SKUs found
                    </div>
                  ) : (
                    <>
                      {skus.map((sku) => (
                        <button
                          key={sku.id}
                          type="button"
                          onClick={() => handleSkuSelect(sku)}
                          className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0 active:bg-blue-100 transition-colors"
                        >
                          <div className="font-medium">{sku.sku_code}</div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            {sku.sku_name} • UOM: {sku.uom || "-"}
                          </div>
                        </button>
                      ))}

                      {pagination.pages > 1 && (
                        <div className="px-2 py-2 border-t bg-gray-50">
                          <Pagination
                            pagination={pagination}
                            onPageChange={(p) => loadSkus(p, search)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.ordered_qty}
                  onChange={(e) => handleChange("ordered_qty", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  required
                />
              </div>

              {/* UOM */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UOM
                </label>
                <input
                  type="text"
                  value={formData.uom}
                  onChange={(e) => handleChange("uom", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
              </div>

              {/* Allocation Rule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocation Rule
                </label>
                <select
                  value={formData.allocation_rule}
                  onChange={(e) =>
                    handleChange("allocation_rule", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
                >
                  <option value="FIFO">FIFO</option>
                  <option value="LIFO">LIFO</option>
                  <option value="FEFO">FEFO</option>
                </select>
              </div>

              {/* Batch Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Preference
                </label>
                <input
                  type="text"
                  value={formData.batch_preference}
                  onChange={(e) =>
                    handleChange("batch_preference", e.target.value)
                  }
                  placeholder="Optional"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiry_date_min}
                  onChange={(e) =>
                    handleChange("expiry_date_min", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
              </div>

              {/* Unit Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => handleChange("unit_price", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
              </div>

              {/* Discount % */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount %
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={formData.discount_percent}
                  onChange={(e) =>
                    handleChange("discount_percent", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
              </div>

              {/* Tax % */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax %
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.tax_percent}
                  onChange={(e) => handleChange("tax_percent", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Add any additional notes..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 flex-shrink-0 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm shadow-sm"
            >
              Save Line
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrderLineModal;

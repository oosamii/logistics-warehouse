import React, { useEffect, useMemo, useState } from "react";
import http from "../../../api/http";
import PaginatedEntityDropdown from "../../inbound/components/asnform/common/PaginatedEntityDropdown";
import toast from "react-hot-toast";

const CreateManualChargeModal = ({ isOpen, onClose, onSuccess }) => {
  const initialForm = useMemo(
    () => ({
      warehouse_id: "",
      client_id: "",
      description: "",
      qty: 1,
      rate: "",
      amount: "",
      event_date: "",
      notes: "",
    }),
    [],
  );

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [warehouses, setWarehouses] = useState([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchWarehouses = async () => {
      try {
        setWarehouseLoading(true);
        const res = await http.get("/warehouses");
        const list = res?.data?.data || [];
        setWarehouses(
          Array.isArray(list) ? list.filter((w) => w.is_active) : [],
        );
      } catch (e) {
        console.error("Failed to load warehouses", e);
        setWarehouses([]);
      } finally {
        setWarehouseLoading(false);
      }
    };

    fetchWarehouses();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setError("");
      setSubmitting(false);
    }
  }, [isOpen, initialForm]);

  useEffect(() => {
    const qty = Number(form.qty || 0);
    const rate = Number(form.rate || 0);
    const amount = qty * rate;

    if (Number(form.amount || 0) !== amount) {
      setForm((p) => ({ ...p, amount }));
    }
  }, [form.qty, form.rate]);

  if (!isOpen) return null;

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const validate = () => {
    if (!form.warehouse_id) return "Warehouse is required.";
    if (!form.client_id) return "Client is required.";
    if (!form.description?.trim()) return "Description is required.";
    if (!form.event_date) return "Event date is required.";

    const qty = Number(form.qty);
    const rate = Number(form.rate);
    const amount = Number(form.amount);

    if (Number.isNaN(qty) || qty <= 0) return "Qty must be greater than 0.";
    if (Number.isNaN(rate) || rate < 0) return "Rate must be 0 or more.";
    if (Number.isNaN(amount) || amount < 0) return "Amount must be 0 or more.";

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        warehouse_id: Number(form.warehouse_id),
        client_id: Number(form.client_id),
        description: form.description.trim(),
        qty: Number(form.qty),
        rate: Number(form.rate),
        amount: Number(form.amount),
        event_date: form.event_date, // "YYYY-MM-DD"
        notes: form.notes?.trim() || "",
      };

      const res = await http.post("/billable-events/manual", payload);

      const msg = res?.data?.message || "Failed to create manual charge.";
      toast.success(msg);
      if (onSuccess) onSuccess(res?.data?.data || payload);
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create manual charge.";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={submitting ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header (fixed) */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Create Manual Charge
            </h2>
            <p className="text-sm text-gray-500">
              Add an ad-hoc billable event for a client.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ✅ Scrollable body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          {error ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Warehouse ID *
              </label>
              <select
                value={form.warehouse_id}
                onChange={(e) => update("warehouse_id", e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm
             focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {warehouseLoading
                    ? "Loading warehouses..."
                    : "Select Warehouse"}
                </option>

                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouse_name} ({w.warehouse_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Client ID *
              </label>
              <PaginatedEntityDropdown
                endpoint="/clients"
                listKey="clients"
                value={form.client_id}
                onChange={(id, obj) => update("client_id", id)}
                placeholder="Select Client"
                limit={10}
                enableSearch={true}
                searchParam="search"
                searchPlaceholder="Search client…"
                renderItem={(c) => ({
                  title: `${c.client_name} (${c.client_code})`,
                  subtitle: c.email || c.phone || "",
                })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Description *
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="e.g., Another Event"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Qty *</label>
              <input
                type="number"
                min="1"
                value={form.qty}
                onChange={(e) => update("qty", e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Rate *
              </label>
              <input
                type="number"
                min="0"
                value={form.rate}
                onChange={(e) => update("rate", e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">Auto-calculated</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Event Date *
              </label>
              <input
                type="date"
                value={form.event_date}
                onChange={(e) => update("event_date", e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="e.g., Service Charges"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ✅ Footer fixed at bottom (inside form) */}
          <div className="sticky bottom-[-20px] mt-2 py-4 flex justify-end gap-3 border-t bg-white pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Charge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateManualChargeModal;

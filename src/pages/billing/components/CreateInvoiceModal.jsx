import React, { useEffect, useState } from "react";
import http from "../../../api/http"; // adjust if needed
import PaginatedEntityDropdown from "../../inbound/components/asnform/common/PaginatedEntityDropdown"; // adjust if needed
import { useToast } from "../../components/toast/ToastProvider";

const CreateInvoiceModal = ({
  isOpen,
  onClose,
  selectedEventIds = [],
  clientId,
  warehouseId,
  onSuccess,
}) => {
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState(clientId || "");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(
    warehouseId || "",
  );

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [isInterState, setIsInterState] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSelectedClientId(clientId || "");
    setSelectedWarehouseId(warehouseId || "");

    const loadWarehouses = async () => {
      try {
        setWarehouseLoading(true);
        const res = await http.get("/warehouses");
        const list = res?.data?.data || [];
        setWarehouses(
          Array.isArray(list) ? list.filter((w) => w.is_active) : [],
        );
      } catch {
        setWarehouses([]);
      } finally {
        setWarehouseLoading(false);
      }
    };

    loadWarehouses();
  }, [isOpen, clientId, warehouseId]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedEventIds.length) {
      setError("Please select at least one billable event.");
      return;
    }
    if (!selectedClientId) {
      setError("Please select client.");
      return;
    }
    if (!selectedWarehouseId) {
      setError("Please select warehouse.");
      return;
    }
    if (!periodStart || !periodEnd) {
      setError("Please select billing period.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await http.post("/invoices/", {
        client_id: Number(selectedClientId),
        warehouse_id: Number(selectedWarehouseId),
        period_start: periodStart,
        period_end: periodEnd,
        event_ids: selectedEventIds,
        is_inter_state: Boolean(isInterState),
      });

      console.log("Invoice creation response:", res);
      if (res?.data?.success) {
        toast.success("Invoice created successfully.");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create invoice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={!loading ? onClose : undefined}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col rounded-lg bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Create Invoice
          </h2>
          <p className="text-sm text-gray-500">
            {selectedEventIds.length} event(s) selected
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Client */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Client *</p>
            <PaginatedEntityDropdown
              endpoint="/clients"
              listKey="clients"
              value={selectedClientId}
              onChange={(id) => setSelectedClientId(id)}
              placeholder="Select Client"
              enableSearch
              limit={10}
              searchParam="search"
              renderItem={(c) => ({
                title: `${c.client_name} (${c.client_code})`,
                subtitle: c.email || c.phone || "",
              })}
            />
          </div>

          {/* Warehouse */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Warehouse *</p>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
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

          {/* Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Period Start *</p>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Period End *</p>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Inter-state toggle */}
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Inter State GST
              </p>
              <p className="text-xs text-gray-500">
                Enable IGST instead of CGST + SGST
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsInterState((p) => !p)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isInterState ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isInterState ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || selectedEventIds.length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceModal;

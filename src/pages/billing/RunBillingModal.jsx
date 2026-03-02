import React, { useState, useEffect } from "react";
import http from "../../api/http";

const RunBillingModal = ({ isOpen, onClose, onRunBilling }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    warehouse_id: "",
    start_date: "",
    end_date: "",
    client_id: "",
    charge_types: [
      "STORAGE",
      "INBOUND_HANDLING",
      "PUTAWAY",
      "PICKING",
      "PACKING",
      "SHIPPING_ADMIN",
      "MANUAL",
    ],
  });

  const chargeTypeOptions = [
    { value: "STORAGE", label: "Storage" },
    { value: "INBOUND_HANDLING", label: "Inbound Handling" },
    { value: "PUTAWAY", label: "Putaway" },
    { value: "PICKING", label: "Picking" },
    { value: "PACKING", label: "Packing" },
    { value: "SHIPPING_ADMIN", label: "Shipping Admin" },
    { value: "VALUE_ADDED_SERVICE", label: "Value Added Service" },
    { value: "OTHER", label: "Other" },
    { value: "MANUAL", label: "Manual" },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchWarehouses();
      fetchClients();
    } else {
      // Reset preview when modal closes
      setPreviewData(null);
      setShowPreview(false);
    }
  }, [isOpen]);

  const fetchWarehouses = async () => {
    try {
      const response = await http.get("/warehouses");
      if (response.data?.success) {
        setWarehouses(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await http.get("/clients");
      if (response.data?.success) {
        setClients(response.data.data.clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for API
      const apiData = {
        warehouse_id: parseInt(formData.warehouse_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        client_id: parseInt(formData.client_id),
        charge_types: formData.charge_types,
      };

      const response = await http.post("/billing/run", apiData);

      if (response.data?.success) {
        onRunBilling(response.data.data);
        onClose();
        // Reset form
        setFormData({
          warehouse_id: "",
          start_date: "",
          end_date: "",
          client_id: "",
          charge_types: [
            "STORAGE",
            "INBOUND_HANDLING",
            "PUTAWAY",
            "PICKING",
            "PACKING",
            "SHIPPING_ADMIN",
            "MANUAL",
          ],
        });
        setPreviewData(null);
        setShowPreview(false);
      }
    } catch (error) {
      console.error("Error running billing:", error);
      alert("Failed to run billing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    // Validate required fields
    if (
      !formData.warehouse_id ||
      !formData.start_date ||
      !formData.end_date ||
      !formData.client_id
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setPreviewLoading(true);

    try {
      const apiData = {
        warehouse_id: parseInt(formData.warehouse_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        client_id: parseInt(formData.client_id),
        charge_types: formData.charge_types,
      };

      const response = await http.post("/billing/preview", apiData);

      if (response.data?.success) {
        setPreviewData(response.data.data);
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Error fetching preview:", error);
      alert("Failed to fetch preview. Please try again.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleChargeTypeChange = (chargeType) => {
    const newTypes = formData.charge_types.includes(chargeType)
      ? formData.charge_types.filter((t) => t !== chargeType)
      : [...formData.charge_types, chargeType];

    setFormData({ ...formData, charge_types: newTypes });
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewData(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        ></div>

        <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Run Billing
          </h2>

          {/* Preview Section */}
          {showPreview && previewData && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-blue-900">Billing Preview</h3>
                <button
                  onClick={handleClosePreview}
                  className="text-blue-700 hover:text-blue-900"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Events Created:</span>
                  <span className="ml-2 font-semibold text-blue-900">
                    {previewData.summary?.events_created || 0}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Events Ready:</span>
                  <span className="ml-2 font-semibold text-blue-900">
                    {previewData.summary?.events_ready || 0}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Events Blocked:</span>
                  <span className="ml-2 font-semibold text-blue-900">
                    {previewData.summary?.events_blocked || 0}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Total Amount:</span>
                  <span className="ml-2 font-semibold text-blue-900">
                    ₹{previewData.summary?.total_amount || 0}
                  </span>
                </div>
              </div>
              {previewData.events?.length > 0 && (
                <div className="mt-3 text-xs text-blue-600">
                  {previewData.events.length} events will be processed
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Warehouse Selection */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Warehouse *
                </label>
                <select
                  value={formData.warehouse_id}
                  onChange={(e) =>
                    setFormData({ ...formData, warehouse_id: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.warehouse_name} ({warehouse.warehouse_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Selection */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Client *
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) =>
                    setFormData({ ...formData, client_id: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.client_name} ({client.client_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Charge Types */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900">
                  Include Charge Types
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {chargeTypeOptions.map((type) => (
                    <label key={type.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.charge_types.includes(type.value)}
                        onChange={() => handleChargeTypeChange(type.value)}
                        className="mr-2"
                      />
                      {type.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Info Text */}
              <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
                Running billing will calculate charges for all selected events.
                You can review the calculations in the "Ready to Invoice" tab
                before final generation.
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={loading || previewLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={previewLoading || loading}
                  className="rounded-md border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {previewLoading ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      Previewing...
                    </>
                  ) : (
                    "Preview Run"
                  )}
                </button>
                <button
                  type="submit"
                  disabled={loading || previewLoading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      Running...
                    </>
                  ) : (
                    "Run & Generate"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RunBillingModal;

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useToast } from "../../components/toast/ToastProvider";
import http from "../../../api/http";
const RateCardModal = ({ isOpen, onClose, onSuccess, rateCard }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    rate_card_name: "",
    client_id: "",
    warehouse_id: "",
    charge_type: "STORAGE",
    billing_basis: "PER_UNIT",
    rate: "",
    currency: "INR",
    min_charge: "",
    effective_from: "",
    effective_to: "",
    description: "",
    is_active: true,
  });

  const [clients, setClients] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Charge type options
  const chargeTypeOptions = [
    { value: "STORAGE", label: "Storage" },
    { value: "INBOUND_HANDLING", label: "Inbound Handling" },
    { value: "PUTAWAY", label: "Putaway" },
    { value: "PICKING", label: "Picking" },
    { value: "PACKING", label: "Packing" },
    { value: "SHIPPING_ADMIN", label: "Shipping Admin" },
    { value: "VALUE_ADDED_SERVICE", label: "Value Added Service" },
    { value: "OTHER", label: "Other" },
  ];

  // Billing basis options
  const billingBasisOptions = [
    { value: "PER_UNIT_PER_DAY", label: "Per Unit / Day" },
    { value: "PER_PALLET_PER_DAY", label: "Per Pallet / Day" },
    { value: "PER_SQFT_PER_DAY", label: "Per Sq Ft / Day" },
    { value: "PER_UNIT", label: "Per Unit" },
    { value: "PER_PALLET", label: "Per Pallet" },
    { value: "PER_CASE", label: "Per Case" },
    { value: "PER_LINE", label: "Per Line" },
    { value: "PER_ORDER", label: "Per Order" },
    { value: "PER_CARTON", label: "Per Carton" },
    { value: "PER_SHIPMENT", label: "Per Shipment" },
    { value: "PER_KG", label: "Per KG" },
    { value: "FLAT_RATE", label: "Flat Rate" },
  ];

  // Currency options
  const currencyOptions = ["INR", "USD", "EUR", "GBP"];

  // Fetch clients and warehouses
  useEffect(() => {
    const fetchInitialData = async () => {
      setFetchingData(true);
      try {
        const [clientsRes, warehousesRes] = await Promise.all([
          http.get("/clients"),
          http.get("/warehouses"),
        ]);

        if (clientsRes.data.success) {
          setClients(clientsRes.data.data.clients);
        }

        if (warehousesRes.data.success) {
          setWarehouses(warehousesRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load clients and warehouses");
      } finally {
        setFetchingData(false);
      }
    };

    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen, toast]);

  // Set form data when editing
  useEffect(() => {
    if (rateCard) {
      setFormData({
        rate_card_name: rateCard.rate_card_name || "",
        client_id: rateCard.client_id || "",
        warehouse_id: rateCard.warehouse_id || "",
        charge_type: rateCard.charge_type || "STORAGE",
        billing_basis: rateCard.billing_basis || "PER_UNIT",
        rate: rateCard.rate || "",
        currency: rateCard.currency || "INR",
        min_charge: rateCard.min_charge || "",
        effective_from: rateCard.effective_from 
          ? new Date(rateCard.effective_from).toISOString().split('T')[0] 
          : "",
        effective_to: rateCard.effective_to 
          ? new Date(rateCard.effective_to).toISOString().split('T')[0] 
          : "",
        description: rateCard.description || "",
        is_active: rateCard.is_active !== undefined ? rateCard.is_active : true,
      });
    } else {
      // Reset form for new rate card
      setFormData({
        rate_card_name: "",
        client_id: "",
        warehouse_id: "",
        charge_type: "STORAGE",
        billing_basis: "PER_UNIT",
        rate: "",
        currency: "INR",
        min_charge: "",
        effective_from: "",
        effective_to: "",
        description: "",
        is_active: true,
      });
    }
  }, [rateCard]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        rate: parseFloat(formData.rate),
        min_charge: parseFloat(formData.min_charge),
      };

      let response;
      if (rateCard) {
        // Update existing rate card
        response = await http.put(`/rate-cards/${rateCard.id}`, payload);
      } else {
        // Create new rate card
        response = await http.post("/rate-cards/", payload);
      }

      if (response.data.success) {
        toast.success(response.data.message || `Rate card ${rateCard ? 'updated' : 'created'} successfully`);
        onSuccess(response.data.message);
        onClose();
      }
    } catch (error) {
      console.error("Error saving rate card:", error);
      toast.error(error.response?.data?.message || `Error ${rateCard ? 'updating' : 'creating'} rate card`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {rateCard ? "Edit Rate Card" : "Create New Rate Card"}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {fetchingData ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* Rate Card Name */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate Card Name *
                  </label>
                  <input
                    type="text"
                    name="rate_card_name"
                    value={formData.rate_card_name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.client_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Warehouse */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warehouse *
                  </label>
                  <select
                    name="warehouse_id"
                    value={formData.warehouse_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Charge Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Charge Type *
                  </label>
                  <select
                    name="charge_type"
                    value={formData.charge_type}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    {chargeTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Billing Basis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Basis *
                  </label>
                  <select
                    name="billing_basis"
                    value={formData.billing_basis}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    {billingBasisOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate *
                  </label>
                  <input
                    type="number"
                    name="rate"
                    value={formData.rate}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency *
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    {currencyOptions.map(currency => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Charge */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Charge *
                  </label>
                  <input
                    type="number"
                    name="min_charge"
                    value={formData.min_charge}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Effective From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Effective From *
                  </label>
                  <input
                    type="date"
                    name="effective_from"
                    value={formData.effective_from}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Effective To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Effective To *
                  </label>
                  <input
                    type="date"
                    name="effective_to"
                    value={formData.effective_to}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Active Status (only for edit) */}
                {rateCard && (
                  <div className="col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Active
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || fetchingData}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : (rateCard ? "Update" : "Create")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RateCardModal;
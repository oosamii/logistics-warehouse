import React, { useState } from "react";
import { X, Truck } from "lucide-react";
import { useToast } from "@/pages/components/toast/ToastProvider";

const DispatchModal = ({ shipment, onClose, onDispatch, loading }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    awb_no: shipment.awb_no || "",
    // Add these if your API supports them in the future
    vehicle_no: "",
    driver_name: "",
    driver_phone: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.awb_no.trim()) {
      toast.showError("Please enter AWB number");
      return;
    }

    setIsSubmitting(true);
    try {
      // Currently only sending awb_no as per API
      await onDispatch({ awb_no: formData.awb_no });
      toast.showSuccess(`Shipment ${shipment.shipment_no} dispatched successfully`);
    } catch (error) {
      toast.showError(error.message || "Failed to dispatch shipment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Truck size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Dispatch Shipment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Shipment Info Card */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Shipment:</span>
                <span className="text-sm font-semibold text-gray-900">{shipment.shipment_no}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Order:</span>
                <span className="text-sm font-semibold text-gray-900">{shipment.SalesOrder?.order_no}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customer:</span>
                <span className="text-sm font-semibold text-gray-900">{shipment.ship_to_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Carrier:</span>
                <span className="text-sm font-semibold text-gray-900">{shipment.Carrier?.carrier_name}</span>
              </div>
            </div>

            {/* AWB Number Input */}
            <div>
              <label htmlFor="awb_no" className="block text-sm font-medium text-gray-700 mb-1">
                AWB / Tracking Number <span className="text-red-500">*</span>
              </label>
              <input
                id="awb_no"
                name="awb_no"
                type="text"
                value={formData.awb_no}
                onChange={handleChange}
                placeholder="Enter AWB number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the AWB/tracking number provided by the carrier
              </p>
            </div>

            {/* Optional Fields (commented out for now) */}
            {/* 
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle No
                </label>
                <input
                  type="text"
                  name="vehicle_no"
                  value={formData.vehicle_no}
                  onChange={handleChange}
                  placeholder="e.g., MH-01-AB-1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  name="driver_name"
                  value={formData.driver_name}
                  onChange={handleChange}
                  placeholder="Driver name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                placeholder="Any additional information..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            */}

            {/* Info Message */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700 flex items-start gap-2">
                <span className="font-medium text-base">📦</span>
                <span>
                  Dispatching this shipment will update its status to <strong>"DISPATCHED"</strong> 
                  and record the AWB number for tracking.
                </span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.awb_no.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Dispatching...
                </>
              ) : (
                <>
                  <Truck size={16} />
                  Confirm Dispatch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispatchModal;
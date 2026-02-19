import React, { useState } from "react";
import { X } from "lucide-react";
import http from "../../../api/http";
import { useToast } from "../../components/toast/ToastProvider";

const cartonTypes = ["SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE", "CUSTOM"];
const initialcarton = {
  carton_type: "MEDIUM",
  length: "",
  width: "",
  height: "",
  tare_weight: "",
  notes: "",
};
const CreateCartonModal = ({ open, onClose, orderId, onSuccess }) => {
  const [form, setForm] = useState(initialcarton);
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const res = await http.post(`/packing/${orderId}/cartons`, {
        ...form,
        length: Number(form.length),
        width: Number(form.width),
        height: Number(form.height),
        tare_weight: Number(form.tare_weight),
      });

      if (res?.data?.success) {
        toast.success(res?.data?.message);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Create carton failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Create Carton</h2>
          <button
            onClick={() => {
              setForm(initialcarton);
              onClose();
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Carton Type */}
        <div>
          <label className="text-sm font-medium">Carton Type</label>
          <select
            value={form.carton_type}
            onChange={(e) => handleChange("carton_type", e.target.value)}
            className="w-full border rounded-md px-3 py-2 mt-1"
          >
            {cartonTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-3 gap-3">
          <input
            type="number"
            placeholder="Length"
            value={form.length}
            onChange={(e) => handleChange("length", e.target.value)}
            className="border rounded-md px-2 py-2"
          />
          <input
            type="number"
            placeholder="Width"
            value={form.width}
            onChange={(e) => handleChange("width", e.target.value)}
            className="border rounded-md px-2 py-2"
          />
          <input
            type="number"
            placeholder="Height"
            value={form.height}
            onChange={(e) => handleChange("height", e.target.value)}
            className="border rounded-md px-2 py-2"
          />
        </div>

        {/* Weight */}
        <div>
          <label className="text-sm font-medium">Tare Weight</label>
          <input
            type="number"
            value={form.tare_weight}
            onChange={(e) => handleChange("tare_weight", e.target.value)}
            className="w-full border rounded-md px-3 py-2 mt-1"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            className="w-full border rounded-md px-3 py-2 mt-1"
            rows={2}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md"
        >
          {loading ? "Creating..." : "Create Carton"}
        </button>
      </div>
    </div>
  );
};

export default CreateCartonModal;

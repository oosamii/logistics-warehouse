import React, { useEffect, useState } from "react";
import http from "../../../api/http"; // adjust path

const EditInvoiceModal = ({ isOpen, onClose, invoice, onUpdated }) => {
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setDueDate(invoice?.due_date ? String(invoice.due_date).slice(0, 10) : "");
    setNotes(invoice?.notes || "");
  }, [isOpen, invoice]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!invoice?.id) return;

    setLoading(true);
    setError("");
    try {
      await http.put(`/invoices/${invoice.id}`, {
        due_date: dueDate || null,
        notes: notes || null,
      });
      onUpdated?.();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update invoice.");
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

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Invoice</h2>
          <p className="text-sm text-gray-500">{invoice?.invoice_no || ""}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 mb-1">Due Date</p>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Add notes…"
            />
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
            onClick={handleSave}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditInvoiceModal;

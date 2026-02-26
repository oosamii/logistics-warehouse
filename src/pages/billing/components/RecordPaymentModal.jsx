import React, { useEffect, useMemo, useState } from "react";
import http from "../../../api/http";

const METHODS = [
  "BANK_TRANSFER",
  "NEFT",
  "RTGS",
  "UPI",
  "CHEQUE",
  "CASH",
  "CREDIT_NOTE",
  "OTHER",
];

const RecordPaymentModal = ({ isOpen, onClose, client, onSuccess }) => {
  const [form, setForm] = useState({
    invoice_id: "",
    amount: "",
    payment_date: "",
    payment_method: "BANK_TRANSFER",
    reference_no: "",
    bank_name: "",
    tds_amount: "",
    notes: "",
  });

  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");

    // default date
    const today = new Date().toISOString().slice(0, 10);
    setForm((p) => ({ ...p, payment_date: p.payment_date || today }));

    // load invoices for client (to choose invoice_id)
    const loadInvoices = async () => {
      if (!client?.id) return;
      setLoadingInvoices(true);
      try {
        const res = await http.get(
          `/invoices/?client_id=${client.id}&page=1&limit=50`,
        );
        const list = res?.data?.data || [];
        setInvoiceOptions(Array.isArray(list) ? list : []);
      } catch {
        setInvoiceOptions([]);
      } finally {
        setLoadingInvoices(false);
      }
    };

    loadInvoices();
  }, [isOpen, client?.id]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const canSubmit = useMemo(() => {
    return (
      form.invoice_id && form.amount && form.payment_date && form.payment_method
    );
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setError("Invoice, Amount, Date and Method are required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await http.post("/payments/", {
        invoice_id: Number(form.invoice_id),
        amount: Number(form.amount),
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        reference_no: form.reference_no || null,
        bank_name: form.bank_name || null,
        tds_amount: form.tds_amount ? Number(form.tds_amount) : 0,
        notes: form.notes || null,
      });

      onSuccess?.();
    } catch (e2) {
      setError(e2?.response?.data?.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={!submitting ? onClose : undefined}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col rounded-lg bg-white shadow-xl">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Record Payment
            </h2>
            <p className="text-sm text-gray-500">
              {client?.name} {client?.code ? `(${client.code})` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={submit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 mb-1">Invoice *</p>
            <select
              value={form.invoice_id}
              onChange={(e) => update("invoice_id", e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              disabled={loadingInvoices}
            >
              <option value="">
                {loadingInvoices ? "Loading..." : "Select invoice"}
              </option>
              {invoiceOptions.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_no} — Balance ₹
                  {Number(inv.balance_due || 0).toLocaleString("en-IN")}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Amount *</p>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Payment Date *</p>
              <input
                type="date"
                value={form.payment_date}
                onChange={(e) => update("payment_date", e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Payment Method *</p>
            <select
              value={form.payment_method}
              onChange={(e) => update("payment_method", e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Reference No</p>
              <input
                type="text"
                value={form.reference_no}
                onChange={(e) => update("reference_no", e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Bank Name</p>
              <input
                type="text"
                value={form.bank_name}
                onChange={(e) => update("bank_name", e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">TDS Amount</p>
            <input
              type="number"
              value={form.tds_amount}
              onChange={(e) => update("tds_amount", e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="border-t pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;

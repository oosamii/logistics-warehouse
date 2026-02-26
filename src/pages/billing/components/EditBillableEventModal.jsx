import React, { useEffect, useMemo, useState } from "react";
import http from "../../../api/http";

const toNum = (v) => {
  // allow empty -> 0, numeric strings -> number
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const EditBillableEventModal = ({ isOpen, onClose, event, onUpdated }) => {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const canEdit = useMemo(() => {
    const st = String(event?.status || "").toUpperCase();
    return isOpen && event?.id && !["INVOICED", "VOID"].includes(st);
  }, [isOpen, event]);

  const [form, setForm] = useState({
    warehouse_id: "",
    client_id: "",
    description: "",
    qty: "",
    rate: "",
    amount: "",
    notes: "",
    status: "READY",
    blocked_reason: "",
  });

  useEffect(() => {
    if (!isOpen || !event?.id) return;

    setErr("");
    setForm({
      warehouse_id: String(event.warehouse_id ?? ""),
      client_id: String(event.client_id ?? ""),
      description: event.description ?? "",
      qty: event.qty ?? "",
      rate: event.rate ?? "",
      amount: event.amount ?? "",
      notes: event.notes ?? "",
      status: String(event.status || event.rawStatus || "READY").toUpperCase(),
      blocked_reason: event.blocked_reason ?? "",
    });
  }, [isOpen, event?.id]);

  if (!isOpen) return null;

  const onChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!event?.id) return;

    setSaving(true);
    setErr("");

    try {
      await http.put(`/billable-events/${event.id}`, {
        warehouse_id: Number(form.warehouse_id),
        client_id: Number(form.client_id),

        description: form.description ?? "",
        qty: toNum(form.qty),
        rate: toNum(form.rate),
        amount: toNum(form.amount),
        notes: form.notes ?? "",
        status: String(form.status || "READY").toUpperCase(),
        blocked_reason:
          String(form.status).toUpperCase() === "BLOCKED"
            ? (form.blocked_reason ?? "")
            : "",
      });

      onClose?.();
      onUpdated?.();
    } catch (e) {
      console.error(e);
      setErr("Failed to update billable event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              Edit Billable Event
            </div>
            <div className="text-xs text-gray-500">
              {event?.event_id || `#${event?.id || ""}`}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!canEdit && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              This event cannot be edited when status is INVOICED or VOID.
            </div>
          )}

          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Warehouse ID">
              <input
                value={form.warehouse_id}
                onChange={(e) => onChange("warehouse_id", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                disabled
              />
            </Field>

            <Field label="Client ID">
              <input
                value={form.client_id}
                onChange={(e) => onChange("client_id", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                disabled
              />
            </Field>

            <Field label="Qty">
              <input
                type="number"
                value={form.qty}
                onChange={(e) => onChange("qty", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                disabled={!canEdit}
              />
            </Field>

            <Field label="Rate">
              <input
                type="number"
                value={form.rate}
                onChange={(e) => onChange("rate", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                disabled={!canEdit}
              />
            </Field>

            <Field label="Amount">
              <input
                type="number"
                value={form.amount}
                onChange={(e) => onChange("amount", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                disabled={!canEdit}
              />
            </Field>

            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => onChange("status", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                disabled={!canEdit}
              >
                <option value="PENDING">PENDING</option>
                <option value="READY">READY</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="INVOICED">INVOICED</option>
                <option value="VOID">VOID</option>
              </select>
            </Field>
          </div>

          <Field label="Description">
            <input
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              disabled={!canEdit}
            />
          </Field>

          <Field label="Notes">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              disabled={!canEdit}
            />
          </Field>

          {String(form.status).toUpperCase() === "BLOCKED" && (
            <Field label="Blocked Reason">
              <input
                value={form.blocked_reason}
                onChange={(e) => onChange("blocked_reason", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                disabled={!canEdit}
              />
            </Field>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={saving || !event?.id}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBillableEventModal;

const Field = ({ label, children }) => (
  <div>
    <div className="mb-1 text-xs font-semibold text-gray-500">{label}</div>
    {children}
  </div>
);

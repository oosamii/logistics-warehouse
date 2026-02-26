import React, { useEffect, useState } from "react";
import http from "../../../api/http";

const PaymentsLedgerModal = ({
  isOpen,
  onClose,
  client,
  reloadKey = 0,
  onConfirmPayment,
  onReversePayment,
  onOpenInvoice,
}) => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    if (!client?.id) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await http.get(`/payments/?client_id=${client.id}`);
        setPayments(res?.data?.data || []);
      } catch {
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, client?.id, reloadKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Payments Ledger
            </h2>
            <p className="text-sm text-gray-500">
              {client?.name} {client?.code ? `(${client.code})` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : payments.length === 0 ? (
            <div className="text-sm text-gray-500">No payments found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                      Payment No
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                      Invoice
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                      Method
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((p) => {
                    const status = String(p.status || "").toUpperCase();
                    const canConfirm = status !== "CONFIRMED";
                    return (
                      <tr key={p.id}>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {p.payment_no}
                        </td>

                        <td className="px-3 py-2 text-sm">
                          {p.Invoice?.invoice_no ? (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenInvoice?.(p.Invoice.invoice_no)
                              }
                              className="text-blue-600 hover:underline"
                            >
                              {p.Invoice.invoice_no}
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-3 py-2 text-sm text-gray-900">
                          ₹{Number(p.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {p.payment_date || "-"}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {p.payment_method || "-"}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {status}
                        </td>

                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              disabled={!canConfirm}
                              onClick={() => onConfirmPayment?.(p)}
                              className="rounded-md bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => onReversePayment?.(p)}
                              className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                            >
                              Reverse
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentsLedgerModal;

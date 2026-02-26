// import React, { useMemo } from "react";
// import PageHeader from "../components/PageHeader";
// import {
//   ArrowLeft,
//   Download,
//   Share2,
//   Plus,
//   CreditCard,
//   List,
//   BookOpen,
// } from "lucide-react";

// const InvoiceDetail = ({ invoiceNo = "INV-2024-03-0012", onBack }) => {
//   const invoiceDetails = useMemo(
//     () => ({
//       invoiceNo,
//       status: "Sent",
//       customer: "Acme Corp",
//       warehouse: "WH-NYC-01 (Main Hub)",
//       billingPeriod: "01 Mar 2024 - 31 Mar 2024",
//       statusDetail: "Awaiting Payment",
//       invoiceDate: "31 Mar 2024",
//       dueDate: "15 Apr 2024",
//       subtotal: "₹ 1,45,200.00",
//       tax: "₹ 26,136.00",
//       totalAmount: "₹ 1,71,336.00",
//       outstanding: "₹ 1,71,336.00",
//     }),
//     [invoiceNo],
//   );

//   const customerDetails = useMemo(
//     () => ({
//       billingName: "Acme Corporation Pvt Ltd",
//       billingAddress:
//         "Level 4, Tech Park, Outer Ring Road\nBangalore, KA 560103",
//       taxId: "27ABCDE1234F1Z5",
//       email: "finance@acmecorp.com",
//       phone: "+91 98765 43210",
//     }),
//     [],
//   );

//   const chargeRows = useMemo(
//     () => [
//       { type: "Storage", basis: "450 Pallet-Days", amount: "95,400.00" },
//       { type: "Inbound Handling", basis: "125 Pallets", amount: "18,750.00" },
//       { type: "Picking", basis: "2,400 Units", amount: "12,000.00" },
//       { type: "Packing", basis: "1,800 Cartons", amount: "14,400.00" },
//       { type: "Shipping / Admin", basis: "Flat fee", amount: "4,650.00" },
//     ],
//     [],
//   );

//   const Chip = ({ children }) => (
//     <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
//       {children}
//     </span>
//   );

//   const ChargeChip = ({ value }) => (
//     <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
//       {value}
//     </span>
//   );

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="mx-auto max-w-7xl px-6 py-6">
//         <PageHeader
//           title="Invoice Detail"
//           breadcrumbs={[
//             { label: "Billing", href: "/billing" },
//             { label: "Invoice Detail" },
//           ]}
//           actions={
//             <div className="flex flex-wrap gap-3">
//               <button
//                 onClick={onBack}
//                 className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
//               >
//                 <ArrowLeft size={16} />
//                 Back
//               </button>

//               <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
//                 <Download size={16} />
//                 PDF
//               </button>

//               <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
//                 <Share2 size={16} />
//                 Share
//               </button>

//               <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
//                 <Plus size={16} />
//                 Adjustment
//               </button>

//               <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
//                 <CreditCard size={16} />
//                 Record Payment
//               </button>
//             </div>
//           }
//         />

//         <div className="space-y-6">
//           {/* Summary Card */}
//           <div className="rounded-xl border border-gray-200 bg-white p-6">
//             <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//               <div className="min-w-0">
//                 <div className="flex items-center gap-3">
//                   <div className="text-2xl font-bold text-gray-900">
//                     {invoiceDetails.invoiceNo}
//                   </div>
//                   <Chip>{invoiceDetails.status}</Chip>
//                 </div>

//                 <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
//                   <Info label="Customer" value={invoiceDetails.customer} />
//                   <Info label="Warehouse" value={invoiceDetails.warehouse} />
//                   <Info
//                     label="Billing Period"
//                     value={invoiceDetails.billingPeriod}
//                   />
//                   <Info
//                     label="Status"
//                     value={
//                       <span className="font-semibold text-blue-600">
//                         {invoiceDetails.statusDetail}
//                       </span>
//                     }
//                   />
//                   <Info
//                     label="Invoice Date"
//                     value={invoiceDetails.invoiceDate}
//                   />
//                   <Info label="Due Date" value={invoiceDetails.dueDate} />
//                 </div>
//               </div>

//               <div className="flex flex-wrap gap-4 lg:justify-end">
//                 <button className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
//                   <List size={16} />
//                   View Billable Events
//                 </button>
//                 <button className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
//                   <BookOpen size={16} />
//                   View Ledger
//                 </button>
//               </div>
//             </div>

//             <div className="mt-5 border-t border-gray-100 pt-6 ">
//               <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 ">
//                 <Amount label="Subtotal" value={invoiceDetails.subtotal} />
//                 <Amount label="Tax (18%)" value={invoiceDetails.tax} />
//                 <Amount
//                   label="Total Amount"
//                   value={invoiceDetails.totalAmount}
//                   emphasized="blue"
//                 />
//                 <Amount
//                   label="Outstanding"
//                   value={invoiceDetails.outstanding}
//                   emphasized="red"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Customer Details */}
//           <div className="rounded-xl border border-gray-200 bg-white p-6">
//             <div className="flex items-center gap-2">
//               <span className="text-lg font-semibold text-gray-900">
//                 Customer Details
//               </span>
//             </div>

//             <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
//               <div className="space-y-4">
//                 <Info
//                   label="Billing Name"
//                   value={customerDetails.billingName}
//                 />
//                 <Info
//                   label="Billing Address"
//                   value={
//                     <div className="whitespace-pre-line">
//                       {customerDetails.billingAddress}
//                     </div>
//                   }
//                 />
//               </div>

//               <div className="space-y-4">
//                 <Info label="GSTIN / Tax ID" value={customerDetails.taxId} />
//                 <Info
//                   label="Primary Contact"
//                   value={
//                     <div className="space-y-1">
//                       <div>{customerDetails.email}</div>
//                       <div>{customerDetails.phone}</div>
//                     </div>
//                   }
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Charges Breakdown */}
//           <div className="rounded-xl border border-gray-200 bg-white p-6">
//             <div className="flex items-center gap-2">
//               <span className="text-lg font-semibold text-gray-900">
//                 Charges Breakdown
//               </span>
//             </div>

//             <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
//               <table className="w-full text-sm">
//                 <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
//                   <tr>
//                     <th className="px-4 py-3">Charge Type</th>
//                     <th className="px-4 py-3">Basis</th>
//                     <th className="px-4 py-3 text-right">Amount (₹)</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100 bg-white">
//                   {chargeRows.map((r, idx) => (
//                     <tr key={idx}>
//                       <td className="px-4 py-3">
//                         <ChargeChip value={r.type} />
//                       </td>
//                       <td className="px-4 py-3 font-medium text-gray-900">
//                         {r.basis}
//                       </td>
//                       <td className="px-4 py-3 text-right font-medium text-gray-900">
//                         {r.amount}
//                       </td>
//                     </tr>
//                   ))}

//                   <tr className="bg-blue-50">
//                     <td className="px-4 py-3 font-semibold text-gray-900">
//                       Total before Tax
//                     </td>
//                     <td className="px-4 py-3" />
//                     <td className="px-4 py-3 text-right font-semibold text-gray-900">
//                       1,45,200.00
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Notes & Terms */}
//           <div className="rounded-xl border border-gray-200 bg-white p-6">
//             <div className="flex items-center gap-2">
//               <span className="text-lg font-semibold text-gray-900">
//                 Notes & Terms
//               </span>
//             </div>

//             <div className="mt-5 space-y-6">
//               <div>
//                 <div className="text-sm font-medium text-gray-500">
//                   Invoice Notes
//                 </div>
//                 <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
//                   Storage charges include temperature controlled zone surcharge.
//                   Inbound handling reflects peak season rates.
//                 </div>
//               </div>

//               <div>
//                 <div className="text-sm font-medium text-gray-500">
//                   Payment Terms
//                 </div>
//                 <div className="mt-1 text-sm font-semibold text-gray-900">
//                   Net 15 Days. Please include Invoice No in payment reference.
//                   Late payments subject to 2% interest/month.
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* bottom spacing */}
//         <div className="h-4" />
//       </div>
//     </div>
//   );
// };

// export default InvoiceDetail;

// const Info = ({ label, value }) => (
//   <div>
//     <div className="text-sm text-gray-500">{label}</div>
//     <div className="mt-1 font-semibold text-gray-900">{value}</div>
//   </div>
// );

// const Amount = ({ label, value, emphasized }) => {
//   const style =
//     emphasized === "blue"
//       ? "text-blue-600 text-3xl"
//       : emphasized === "red"
//         ? "text-red-600 text-3xl"
//         : "text-gray-900 text-2xl";
//   return (
//     <div>
//       <div className="text-sm text-gray-500">{label}</div>
//       <div className={`mt-2 font-bold ${style}`}>{value}</div>
//     </div>
//   );
// };

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import http from "../../api/http";
import {
  ArrowLeft,
  Download,
  Share2,
  Plus,
  CreditCard,
  List,
  BookOpen,
} from "lucide-react";
import PaymentsLedgerModal from "./components/PaymentsLedgerModal";

const fmtINR = (n) => {
  const num = Number(n || 0);
  if (Number.isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
};

const StatusChip = ({ value }) => {
  const v = String(value || "").toUpperCase();
  const map = {
    PAID: "bg-green-50 text-green-700",
    PARTIAL: "bg-orange-50 text-orange-700",
    SENT: "bg-blue-50 text-blue-700",
    DRAFT: "bg-gray-100 text-gray-700",
    VOID: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        map[v] || map.DRAFT
      }`}
    >
      {v || "—"}
    </span>
  );
};

const InvoiceDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");

  const [showLedger, setShowLedger] = useState(false);
  const [showRecordPay, setShowRecordPay] = useState(false);
  const [activeClient, setActiveClient] = useState(null);

  const loadInvoice = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await http.get(`/invoices/${id}`);
      console.log("Invoice API response", res);
      setInvoice(res?.data?.data || null);
    } catch (e) {
      setInvoice(null);
      setError("Failed to load invoice.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadInvoice();
  }, [id]);

  const charges = useMemo(() => invoice?.lineItems || [], [invoice]);
  const payments = useMemo(() => invoice?.payments || [], [invoice]);

  const totals = useMemo(() => {
    const subtotal = Number(invoice?.subtotal || 0);
    const tax = Number(invoice?.tax_amount || 0);
    const total = Number(invoice?.total_amount || 0);
    const paid = Number(invoice?.paid_amount || 0);
    const balance = Number(invoice?.balance_due || 0);
    return { subtotal, tax, total, paid, balance };
  }, [invoice]);

  const breadcrumbs = [
    { label: "Billing", to: "/billing" },
    { label: "Invoice Detail" },
  ];

  return (
    <div className="min-h-screen ">
      <div className="mx-auto px-4 py-6">
        <PageHeader
          title="Invoice Detail"
          breadcrumbs={breadcrumbs}
          actions={
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                type="button"
              >
                <Download size={16} />
                PDF
              </button>

              <button
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                type="button"
              >
                <Share2 size={16} />
                Share
              </button>

              <button
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                type="button"
              >
                <Plus size={16} />
                Adjustment
              </button>

              <button
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                type="button"
              >
                <CreditCard size={16} />
                Record Payment
              </button>
            </div>
          }
        />

        {/* Loading / Error */}
        {loading && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Loading…
          </div>
        )}

        {!loading && error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && invoice && (
          <div className="space-y-6 mt-6">
            {/* Summary Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-gray-900">
                      {invoice.invoice_no}
                    </div>
                    <StatusChip value={invoice.status} />
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Info
                      label="Customer"
                      value={invoice.client?.client_name || "-"}
                    />
                    <Info
                      label="Warehouse"
                      value={invoice.warehouse?.warehouse_name || "-"}
                    />
                    <Info
                      label="Billing Period"
                      value={
                        invoice.period_start && invoice.period_end
                          ? `${invoice.period_start} → ${invoice.period_end}`
                          : "-"
                      }
                    />
                    <Info
                      label="Status"
                      value={
                        <span className="font-semibold text-blue-600">
                          {String(invoice.status || "").toUpperCase()}
                        </span>
                      }
                    />
                    <Info
                      label="Invoice Date"
                      value={invoice.invoice_date || "-"}
                    />
                    <Info label="Due Date" value={invoice.due_date || "-"} />
                    <Info
                      label="Client GSTIN"
                      value={
                        invoice.client_gstin || invoice.client?.tax_id || "-"
                      }
                    />
                    <Info label="HSN/SAC" value={invoice.hsn_sac_code || "-"} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 lg:justify-end">
                  <button
                    onClick={() =>
                      navigate(`/billing/billableEventDetail/${id}`)
                    }
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <List size={16} />
                    View Billable Events
                  </button>
                  <button
                    onClick={() => {
                      setActiveClient({
                        id: invoice.client_id,
                        name: invoice.client?.client_name || "",
                        code: invoice.client?.client_code || "",
                      });
                      setShowLedger(true);
                    }}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <BookOpen size={16} />
                    View Ledger
                  </button>
                </div>
              </div>

              <div className="mt-5 border-t border-gray-100 pt-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                  <Amount label="Subtotal" value={fmtINR(totals.subtotal)} />
                  <Amount label="Tax" value={fmtINR(totals.tax)} />
                  <Amount
                    label="Total"
                    value={fmtINR(totals.total)}
                    emphasized="blue"
                  />
                  <Amount label="Paid" value={fmtINR(totals.paid)} />
                  <Amount
                    label="Balance Due"
                    value={fmtINR(totals.balance)}
                    emphasized="red"
                  />
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="text-lg font-semibold text-gray-900">
                Customer Details
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <Info
                    label="Billing Name"
                    value={invoice.client?.client_name || "-"}
                  />
                  <Info
                    label="Billing Address"
                    value={
                      <div className="whitespace-pre-line">
                        {invoice.client?.billing_address || "-"}
                      </div>
                    }
                  />
                </div>

                <div className="space-y-4">
                  <Info
                    label="GSTIN / Tax ID"
                    value={
                      invoice.client_gstin || invoice.client?.tax_id || "-"
                    }
                  />
                  <Info
                    label="Place of Supply"
                    value={invoice.place_of_supply || "-"}
                  />
                </div>
              </div>
            </div>

            {/* Charges Breakdown */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="text-lg font-semibold text-gray-900">
                Charges Breakdown
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Event ID</th>
                      <th className="px-4 py-3">Charge Type</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Basis</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {charges.map((li) => (
                      <tr key={li.id}>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {li.event_id || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {li.charge_type || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {li.reference_no || "-"}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {li.qty
                            ? `${li.qty} (${li.billing_basis || "-"})`
                            : li.billing_basis || "-"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {fmtINR(li.amount)}
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-blue-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        Subtotal
                      </td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {fmtINR(invoice.subtotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tax breakdown */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Mini
                  label="CGST"
                  value={`${invoice.cgst_rate || "0"}% • ${fmtINR(invoice.cgst_amount)}`}
                />
                <Mini
                  label="SGST"
                  value={`${invoice.sgst_rate || "0"}% • ${fmtINR(invoice.sgst_amount)}`}
                />
                <Mini
                  label="IGST"
                  value={`${invoice.igst_rate || "0"}% • ${fmtINR(invoice.igst_amount)}`}
                />
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="text-lg font-semibold text-gray-900">Notes</div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
                {invoice.notes || "—"}
              </div>
            </div>

            {/* Payments */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="text-lg font-semibold text-gray-900">
                Payments
              </div>

              {payments.length === 0 ? (
                <div className="mt-3 text-sm text-gray-500">
                  No payments recorded.
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Mode</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-3">{p.payment_date || "-"}</td>
                          <td className="px-4 py-3">{p.mode || "-"}</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {fmtINR(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <PaymentsLedgerModal
        isOpen={showLedger}
        onClose={() => setShowLedger(false)}
        client={activeClient}
        showActions={false}
      />
    </div>
  );
};

export default InvoiceDetail;

/* ───────── small UI atoms ───────── */
const Info = ({ label, value }) => (
  <div>
    <div className="text-sm text-gray-500">{label}</div>
    <div className="mt-1 font-semibold text-gray-900">{value}</div>
  </div>
);

const Amount = ({ label, value, emphasized }) => {
  const style =
    emphasized === "blue"
      ? "text-blue-600 text-3xl"
      : emphasized === "red"
        ? "text-red-600 text-3xl"
        : "text-gray-900 text-2xl";
  return (
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`mt-2 font-bold ${style}`}>{value}</div>
    </div>
  );
};

const Mini = ({ label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
    <div className="text-xs font-semibold text-gray-500">{label}</div>
    <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
  </div>
);

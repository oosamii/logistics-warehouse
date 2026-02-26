import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../../../api/http";
import {
  ArrowLeft,
  Eye,
  Zap,
  AlertTriangle,
  Package,
  User,
  Building2,
  CreditCard,
  BarChart3,
  FileText,
  Clock,
} from "lucide-react";

const fmtINR = (n) => {
  const num = Number(n || 0);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

const Pill = ({ status }) => {
  const styles = {
    READY: "bg-green-50 text-green-700",
    PENDING: "bg-blue-50 text-blue-700",
    BLOCKED: "bg-red-50 text-red-700",
    VOID: "bg-gray-100 text-gray-700",
    INVOICED: "bg-purple-50 text-purple-700",
  };

  const dot = {
    READY: "bg-green-600",
    PENDING: "bg-blue-600",
    BLOCKED: "bg-red-600",
    VOID: "bg-gray-500",
    INVOICED: "bg-purple-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-extrabold tracking-widest uppercase ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dot[status] || "bg-gray-500"}`}
      />
      {status || "—"}
    </span>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 px-5 py-2.5 hover:bg-gray-50">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="max-w-[65%] break-words text-right text-sm font-medium text-gray-900">
      {value ?? "—"}
    </span>
  </div>
);

const Card = ({ title, icon: Icon, right, children }) => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
          <Icon size={14} />
        </div>
        <div className="text-xs font-extrabold tracking-widest uppercase text-gray-900">
          {title}
        </div>
      </div>
      {right}
    </div>
    <div className="py-1">{children}</div>
  </div>
);

const StorageDetailsSection = ({ storage_details }) => {
  const rows = useMemo(() => {
    if (!storage_details || typeof storage_details !== "object") return [];
    return Object.entries(storage_details)
      .map(([date, units]) => ({ date, units: Number(units || 0) }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [storage_details]);

  const summary = useMemo(() => {
    if (!rows.length) return null;
    const nonZeroDays = rows.filter((r) => r.units > 0).length;
    const maxUnits = rows.reduce((m, r) => Math.max(m, r.units), 0);
    const totalUnits = rows.reduce((s, r) => s + r.units, 0);
    return { nonZeroDays, maxUnits, totalUnits };
  }, [rows]);

  return (
    <Card
      title="Storage Details"
      icon={BarChart3}
      right={
        summary ? (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-700">
              Active days:{" "}
              <span className="font-semibold text-gray-900">
                {summary.nonZeroDays}
              </span>
            </span>
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-700">
              Peak units:{" "}
              <span className="font-semibold text-gray-900">
                {summary.maxUnits}
              </span>
            </span>
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-700">
              Total units:{" "}
              <span className="font-semibold text-gray-900">
                {summary.totalUnits.toLocaleString("en-IN")}
              </span>
            </span>
          </div>
        ) : null
      }
    >
      {!rows.length ? (
        <div className="px-5 py-6 text-center text-sm text-gray-500">
          No storage data available.
        </div>
      ) : (
        <div className="max-h-[380px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-5 py-2 text-left text-[11px] font-extrabold uppercase tracking-widest text-gray-500">
                  Date
                </th>
                <th className="px-5 py-2 text-left text-[11px] font-extrabold uppercase tracking-widest text-gray-500">
                  Distribution
                </th>
                <th className="px-5 py-2 text-right text-[11px] font-extrabold uppercase tracking-widest text-gray-500">
                  Units
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const pct = summary?.maxUnits
                  ? (r.units / summary.maxUnits) * 100
                  : 0;
                return (
                  <tr
                    key={r.date}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-5 py-2 text-gray-700 tabular-nums">
                      {r.date}
                    </td>

                    <td className="px-5 py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-full min-w-[80px] overflow-hidden rounded bg-gray-200">
                          <div
                            className="h-full rounded bg-blue-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-2 text-right font-semibold text-gray-900">
                      {r.units.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

const BillableEventDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");

  const loadDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await http.get(`/billable-events/${id}`);
      setEvent(res?.data?.data || null);
    } catch {
      setEvent(null);
      setError("Failed to load billable event details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto  px-5 py-14">
          <div className="flex flex-col items-center gap-3 text-sm text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
            Loading event details…
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-5 py-10 space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5" />
            <div>
              <div className="font-semibold">Error loading event</div>
              {error}
            </div>
          </div>

          <button
            onClick={loadDetail}
            className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const isStorage = event.charge_type === "STORAGE";
  const isBlocked = event.status === "BLOCKED";

  return (
    <div className="min-h-screen">
      <div className="px-6 pb-16 pt-7 space-y-4">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft size={14} /> Back to events
        </button>

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 rounded-2xl border border-gray-200 bg-white p-6 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-2xl font-extrabold tracking-tight text-gray-900">
                {event.event_id || `Event #${event.id}`}
              </div>
              <Pill status={event.status} />
            </div>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Clock size={12} /> Created {event.createdAt || "—"}
              </span>
              <span>Updated {event.updatedAt || "—"}</span>
              {event.charge_type && <span>{event.charge_type}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isBlocked ? (
              <button className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">
                <Zap size={14} /> Fix Rate Card
              </button>
            ) : (
              <button
                onClick={() =>
                  navigate(`/billing/invoices/${event?.invoice_id || ""}`)
                }
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Eye size={14} /> View Invoice
              </button>
            )}
          </div>
        </div>

        {/* Blocked banner */}
        {isBlocked && event.blocked_reason && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5" />
            <div>
              <span className="font-semibold">Blocked: </span>
              {event.blocked_reason}
            </div>
          </div>
        )}

        {/* Stat Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {event.amount && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Amount
              </div>
              <div className="mt-1 text-xl font-extrabold text-gray-900">
                {fmtINR(event.amount)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {event.currency || ""}
              </div>
            </div>
          )}

          {event.rate && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Rate
              </div>
              <div className="mt-1 text-xl font-extrabold text-gray-900">
                {fmtINR(event.rate)}
              </div>
              <div className="mt-1 text-xs text-gray-500">per unit</div>
            </div>
          )}

          {event.qty != null && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Quantity
              </div>
              <div className="mt-1 text-xl font-extrabold text-gray-900">
                {event.qty}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {event.billing_basis || "units"}
              </div>
            </div>
          )}

          {event.event_date && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Event Date
              </div>
              <div className="mt-1 text-base font-extrabold text-gray-900">
                {event.event_date}
              </div>
              <div className="mt-1 text-xs text-gray-500">&nbsp;</div>
            </div>
          )}
        </div>

        {/* Event Summary */}
        <Card title="Event Summary" icon={FileText}>
          <InfoRow label="Charge Type" value={event.charge_type} />
          <InfoRow label="Billing Basis" value={event.billing_basis} />
          <InfoRow label="Description" value={event.description} />
          <InfoRow label="Notes" value={event.notes} />
        </Card>

        {/* Reference */}
        <Card title="Reference" icon={Package}>
          <InfoRow label="Reference Type" value={event.reference_type} />
          <InfoRow label="Reference ID" value={event.reference_id} />
          <InfoRow label="Reference No" value={event.reference_no} />
          {isStorage && (
            <>
              <InfoRow label="Storage Start" value={event.storage_start_date} />
              <InfoRow label="Storage End" value={event.storage_end_date} />
            </>
          )}
        </Card>

        {/* Client + Warehouse */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card title="Client" icon={User}>
            <InfoRow label="Name" value={event.client?.client_name} />
            <InfoRow label="Code" value={event.client?.client_code} />
            <InfoRow label="Contact" value={event.client?.contact_person} />
            <InfoRow label="Email" value={event.client?.email} />
            <InfoRow label="Phone" value={event.client?.phone} />
            <InfoRow label="Billing Type" value={event.client?.billing_type} />
            <InfoRow
              label="Payment Terms"
              value={event.client?.payment_terms}
            />
            <InfoRow label="GST / Tax ID" value={event.client?.tax_id} />
            <InfoRow
              label="Billing Address"
              value={event.client?.billing_address}
            />
          </Card>

          <Card title="Warehouse" icon={Building2}>
            <InfoRow label="Name" value={event.warehouse?.warehouse_name} />
            <InfoRow label="Code" value={event.warehouse?.warehouse_code} />
            <InfoRow label="City" value={event.warehouse?.city} />
            <InfoRow label="State" value={event.warehouse?.state} />
            <InfoRow label="Pincode" value={event.warehouse?.pincode} />
            <InfoRow label="Timezone" value={event.warehouse?.timezone} />
            <InfoRow label="Type" value={event.warehouse?.warehouse_type} />
            <InfoRow
              label="Capacity (sqft)"
              value={event.warehouse?.capacity_sqft}
            />
          </Card>
        </div>

        {/* Rate Card */}
        <Card title="Rate Card" icon={CreditCard}>
          {event.RateCard ? (
            <>
              <InfoRow label="Name" value={event.RateCard.rate_card_name} />
              <InfoRow label="Charge Type" value={event.RateCard.charge_type} />
              <InfoRow
                label="Billing Basis"
                value={event.RateCard.billing_basis}
              />
              <InfoRow label="Rate" value={fmtINR(event.RateCard.rate)} />
              <InfoRow
                label="Min Charge"
                value={fmtINR(event.RateCard.min_charge)}
              />
              <InfoRow
                label="Effective From"
                value={event.RateCard.effective_from}
              />
              <InfoRow
                label="Effective To"
                value={event.RateCard.effective_to}
              />
              <InfoRow label="Description" value={event.RateCard.description} />
            </>
          ) : (
            <div className="px-5 py-6 text-center text-sm text-gray-500">
              No rate card linked for this event.
            </div>
          )}
        </Card>

        {/* Storage Details */}
        {isStorage && (
          <StorageDetailsSection storage_details={event?.storage_details} />
        )}

        {/* Audit */}
        <Card title="Audit Trail" icon={Clock}>
          <InfoRow
            label="Created By"
            value={event.creator?.username || event.created_by}
          />
          <InfoRow label="Creator Email" value={event.creator?.email} />
          <InfoRow label="Updated By" value={event.updated_by} />
          <InfoRow label="Invoice ID" value={event.invoice_id} />
        </Card>
      </div>
    </div>
  );
};

export default BillableEventDetail;

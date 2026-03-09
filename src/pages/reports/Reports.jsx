// src/pages/reports/Reports.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "../../pages/components/PageHeader";
import {
  CalendarDays,
  Download,
  Clock,
  Hourglass,
  Boxes,
  Activity,
  Package,
  Truck,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import ReportCard from "./components/ReportCard";
import http from "../../api/http";
import { useAccess } from "../utils/useAccess";

// ---------------- helpers ----------------
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmtHours = (v) => `${toNum(v).toFixed(2)}h`;

const fmtPct = (v) => `${toNum(v).toFixed(2)}%`;

const fmtINR = (n) => {
  const v = toNum(n);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
};

const fmtSecondsAsMmSs = (sec) => {
  const s = Math.max(0, Math.floor(toNum(sec)));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}m ${String(ss).padStart(2, "0")}s`;
};

export default function Reports() {
  const navigate = useNavigate();
  const reportsAccess = useAccess("REPORTS");
  const inboundAccess = useAccess("INBOUND");
  const inventoryAccess = useAccess("INVENTORY");
  const pickingAccess = useAccess("PICKING");
  const packingAccess = useAccess("PACKING");
  const outboundAccess = useAccess("OUTBOUND");
  const billingAccess = useAccess("BILLING");

  // Redirect if no read access to reports
  useEffect(() => {
    if (!reportsAccess.loading && !reportsAccess.canRead) {
      navigate("/unauthorized");
    }
  }, [reportsAccess.loading, reportsAccess.canRead, navigate]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const reqIdRef = useRef(0);
  const didInitRef = useRef(false);

  const [summary, setSummary] = useState({
    inbound: null,
    putaway: null,
    space: null,
    pick: null,
    pack: null,
    outbound: null,
    billing: null,
  });

  const isCanceled = (reason) => {
    const msg = reason?.message?.toLowerCase?.() || "";
    return (
      reason?.name === "CanceledError" ||
      reason?.code === "ERR_CANCELED" ||
      reason?.name === "AbortError" ||
      msg.includes("canceled") ||
      msg.includes("aborted")
    );
  };

  const safeGetSummary = (settled) => {
    if (settled.status !== "fulfilled") return null;
    const d = settled.value?.data;
    return d?.success ? (d?.data?.summary ?? null) : null;
  };

  const loadAllSummaries = useCallback(async () => {
    const myReqId = ++reqIdRef.current;
    setLoading(true);
    setErr("");

    try {
      const results = await Promise.allSettled([
        http.get("/reports/inbound-tat"),
        http.get("/reports/putaway-aging"),
        http.get("/reports/space-utilization"),
        http.get("/reports/pick-productivity"),
        http.get("/reports/pack-productivity"),
        http.get("/reports/outbound-sla"),
        http.get("/reports/billing-revenue"),
      ]);

      if (reqIdRef.current !== myReqId) return;

      const inbound = safeGetSummary(results[0]);
      const putaway = safeGetSummary(results[1]);
      const space = safeGetSummary(results[2]);
      const pick = safeGetSummary(results[3]);
      const pack = safeGetSummary(results[4]);
      const outbound = safeGetSummary(results[5]);
      const billing = safeGetSummary(results[6]);

      setSummary({ inbound, putaway, space, pick, pack, outbound, billing });

      const realFailures = results.filter(
        (r) => r.status === "rejected" && !isCanceled(r.reason),
      ).length;

      setErr(
        realFailures > 0
          ? `${realFailures} report(s) failed to load. Showing available data.`
          : "",
      );
    } catch (e) {
      if (isCanceled(e)) return;
      if (reqIdRef.current !== myReqId) return;
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load reports.",
      );
    } finally {
      if (reqIdRef.current === myReqId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllSummaries();
  }, [loadAllSummaries]);

  const cards = useMemo(() => {
    const inbound = summary.inbound;
    const putaway = summary.putaway;
    const space = summary.space;
    const pick = summary.pick;
    const pack = summary.pack;
    const outbound = summary.outbound;
    const billing = summary.billing;

    return {
      inbound: {
        leftValue: inbound ? String(inbound.total_asns_received ?? 0) : "-",
        rightValue: inbound ? fmtHours(inbound.avg_inbound_tat_hours) : "-",
        rightSub: inbound ? fmtPct(inbound.sla_compliance_pct) : "",
        rightSubTone:
          inbound && toNum(inbound.sla_compliance_pct) < 90
            ? "danger"
            : "neutral",
      },
      putaway: {
        leftValue: putaway ? String(putaway.pending_tasks ?? 0) : "-",
        rightValue: putaway ? String(putaway.aging_over_24h ?? 0) : "-",
        rightSub: "",
        rightSubTone: "danger",
      },
      space: {
        leftValue: space ? fmtPct(space.avg_utilization_pct) : "-",
        rightValue: space ? String(space.overfilled_bins ?? 0) : "-",
        rightSub: space ? `Empty: ${space.empty_bins ?? 0}` : "",
        rightSubTone:
          space && toNum(space.overfilled_bins) > 0 ? "danger" : "neutral",
      },
      pick: {
        leftValue: pick ? String(toNum(pick.picks_per_hour).toFixed(2)) : "-",
        rightValue: pick ? fmtSecondsAsMmSs(pick.avg_pick_time_seconds) : "-",
        rightSub: pick ? `Exceptions: ${fmtPct(pick.exception_rate_pct)}` : "",
        rightSubTone:
          pick && toNum(pick.exception_rate_pct) > 2 ? "danger" : "neutral",
      },
      pack: {
        leftValue: pack ? String(toNum(pack.cartons_per_hour).toFixed(2)) : "-",
        rightValue: pack ? fmtSecondsAsMmSs(pack.avg_pack_time_seconds) : "-",
        rightSub: pack ? `Reprints: ${pack.label_reprints ?? 0}` : "",
        rightSubTone:
          pack && toNum(pack.label_reprints) > 0 ? "danger" : "neutral",
      },
      outbound: {
        leftValue: outbound ? String(outbound.orders_shipped ?? 0) : "-",
        rightValue: outbound ? fmtPct(outbound.shipped_within_sla_pct) : "-",
        rightSub: outbound ? `Breaches: ${outbound.sla_breaches ?? 0}` : "",
        rightSubTone:
          outbound && toNum(outbound.shipped_within_sla_pct) < 90
            ? "danger"
            : "success",
      },
      billing: {
        leftValue: billing ? String(billing.billable_events ?? 0) : "-",
        rightValue: billing ? fmtINR(billing.est_revenue) : "-",
        rightSub: billing ? `Invoices: ${billing.invoices_raised ?? 0}` : "",
        rightSubTone: "success",
      },
    };
  }, [summary]);

  if (reportsAccess.loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto w-full max-w-7xl sm:px-4 py-5">
          <div className="p-6 text-center text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-7xl sm:px-4 py-5">
        <PageHeader
          title="Reports"
          subtitle="Inbound to dispatch performance, inventory accuracy, space utilization and billing"
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
              >
                <CalendarDays className="h-4 w-4" />
                Schedule Report
              </button>

              {/* <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button> */}
            </div>
          }
        />

        {/* Loading / warning */}
        <div className="mt-3">
          {loading && (
            <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
              Loading reports...
            </div>
          )}
          {!!err && (
            <div className="mt-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
              {err}
            </div>
          )}
        </div>

        {/* Cards */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {inboundAccess.canRead && (
            <ReportCard
              title="Inbound TAT"
              Icon={Clock}
              leftLabel="ASNs Received"
              leftValue={cards.inbound.leftValue}
              rightLabel="Avg TAT"
              rightValue={cards.inbound.rightValue}
              rightSub={cards.inbound.rightSub}
              rightSubTone={cards.inbound.rightSubTone}
              route="/reports/inboundTAT"
            />
          )}

          {inboundAccess.canRead && (
            <ReportCard
              title="Putaway Aging"
              Icon={Hourglass}
              leftLabel="Pending Tasks"
              leftValue={cards.putaway.leftValue}
              rightLabel="Aging > 24h"
              rightValue={cards.putaway.rightValue}
              rightSub={cards.putaway.rightSub}
              rightSubTone={cards.putaway.rightSubTone}
              route="/putawayAging"
            />
          )}

          {inventoryAccess.canRead && (
            <ReportCard
              title="Space Utilization"
              Icon={Boxes}
              leftLabel="Avg Utilized"
              leftValue={cards.space.leftValue}
              rightLabel="Overfilled"
              rightValue={cards.space.rightValue}
              rightSub={cards.space.rightSub}
              rightSubTone={cards.space.rightSubTone}
              route="/spaceUtilization"
            />
          )}

          {pickingAccess.canRead && (
            <ReportCard
              title="Pick Productivity"
              Icon={Activity}
              leftLabel="Picks / Hour"
              leftValue={cards.pick.leftValue}
              rightLabel="Avg Time"
              rightValue={cards.pick.rightValue}
              rightSub={cards.pick.rightSub}
              rightSubTone={cards.pick.rightSubTone}
              route="/pickProductivity"
            />
          )}

          {packingAccess.canRead && (
            <ReportCard
              title="Pack Productivity"
              Icon={Package}
              leftLabel="Cartons / Hour"
              leftValue={cards.pack.leftValue}
              rightLabel="Avg Pack Time"
              rightValue={cards.pack.rightValue}
              rightSub={cards.pack.rightSub}
              rightSubTone={cards.pack.rightSubTone}
              route="/packProductivity"
            />
          )}

          {outboundAccess.canRead && (
            <ReportCard
              title="Outbound SLA"
              Icon={Truck}
              leftLabel="Orders Shipped"
              leftValue={cards.outbound.leftValue}
              rightLabel="Within SLA"
              rightValue={cards.outbound.rightValue}
              rightSub={cards.outbound.rightSub}
              rightSubTone={cards.outbound.rightSubTone}
              route="/outboundSLA"
            />
          )}
        </div>

        {billingAccess.canRead && (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ReportCard
              title="Billing Revenue"
              Icon={IndianRupee}
              leftLabel="Billable Events"
              leftValue={cards.billing.leftValue}
              rightLabel="Est. Revenue"
              rightValue={cards.billing.rightValue}
              rightSub={cards.billing.rightSub}
              rightSubTone={cards.billing.rightSubTone}
              route="/billingRevenue"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// import React, { useMemo, useState } from "react";
// import PageHeader from "../components/PageHeader";
// import FilterBar from "../components/FilterBar";
// import StatCard from "../components/StatCard";
// import CusTable from "../components/CusTable";
// import { StatusPill } from "./components/helper";

// export default function InboundTAT() {
//   // filters (UI only)
//   const [dateRange, setDateRange] = useState("This Month (Oct 2023)");
//   const [warehouse, setWarehouse] = useState("All Warehouses");
//   const [client, setClient] = useState("All Clients");
//   const [supplier, setSupplier] = useState("All Suppliers");

//   const filtersObj = useMemo(
//     () => ({ dateRange, warehouse, client, supplier }),
//     [dateRange, warehouse, client, supplier],
//   );

//   const handleApply = () => {
//     console.log("Apply Filters:", filtersObj);
//   };

//   const handleReset = () => {
//     setDateRange("This Month (Oct 2023)");
//     setWarehouse("All Warehouses");
//     setClient("All Clients");
//     setSupplier("All Suppliers");
//   };

//   const rows = [
//     {
//       id: "ASN-2023-001",
//       asnNo: "ASN-2023-001",
//       grnNo: "GRN-9982",
//       supplier: "Global Tech Supplies",
//       receivingStart: "Oct 24, 08:30",
//       grnTime: "Oct 24, 11:15",
//       putawayComplete: "Oct 24, 12:45",
//       totalTat: "4.25h",
//       status: "Completed",
//     },
//     {
//       id: "ASN-2023-005",
//       asnNo: "ASN-2023-005",
//       grnNo: "GRN-9988",
//       supplier: "MediCare Corp",
//       receivingStart: "Oct 24, 09:00",
//       grnTime: "Oct 24, 10:30",
//       putawayComplete: "Oct 24, 11:00",
//       totalTat: "2.0h",
//       status: "Completed",
//     },
//     {
//       id: "ASN-2023-012",
//       asnNo: "ASN-2023-012",
//       grnNo: "GRN-9991",
//       supplier: "FastFashion Ltd",
//       receivingStart: "Oct 23, 14:00",
//       grnTime: "Oct 23, 18:30",
//       putawayComplete: "Oct 24, 09:00",
//       totalTat: "19.0h",
//       status: "Delayed Putaway",
//     },
//     {
//       id: "ASN-2023-018",
//       asnNo: "ASN-2023-018",
//       grnNo: "GRN-9994",
//       supplier: "Office Depot Inc",
//       receivingStart: "Oct 23, 10:15",
//       grnTime: "Oct 23, 12:45",
//       putawayComplete: "Oct 23, 13:30",
//       totalTat: "3.25h",
//       status: "Completed",
//     },
//     {
//       id: "ASN-2023-022",
//       asnNo: "ASN-2023-022",
//       grnNo: "GRN-9999",
//       supplier: "Electro World",
//       receivingStart: "Oct 23, 08:00",
//       grnTime: "Oct 23, 11:00",
//       putawayComplete: "Oct 23, 11:45",
//       totalTat: "3.75h",
//       status: "Completed",
//     },
//     {
//       id: "ASN-2023-025",
//       asnNo: "ASN-2023-025",
//       grnNo: "GRN-10002",
//       supplier: "Pharma Plus",
//       receivingStart: "Oct 22, 16:00",
//       grnTime: "Oct 22, 18:00",
//       putawayComplete: "Oct 22, 18:45",
//       totalTat: "2.75h",
//       status: "Completed",
//     },
//   ];

//   const columns = [
//     {
//       key: "asnNo",
//       title: "ASN No",
//       render: (row) => (
//         <button className="text-blue-600 hover:underline">{row.asnNo}</button>
//       ),
//     },
//     {
//       key: "grnNo",
//       title: "GRN No",
//       render: (row) => (
//         <button className="text-blue-600 hover:underline">{row.grnNo}</button>
//       ),
//     },
//     { key: "supplier", title: "Supplier" },
//     { key: "receivingStart", title: "Receiving Start" },
//     { key: "grnTime", title: "GRN Time" },
//     { key: "putawayComplete", title: "Putaway Complete" },
//     {
//       key: "totalTat",
//       title: "Total TAT",
//       render: (row) => (
//         <span
//           className={
//             row.status === "Delayed Putaway"
//               ? "font-semibold text-orange-600"
//               : ""
//           }
//         >
//           {row.totalTat}
//         </span>
//       ),
//     },
//     {
//       key: "status",
//       title: "Status",
//       render: (row) => <StatusPill status={row.status} variant="inbound" />,
//     },
//     {
//       key: "actions",
//       title: "Actions",
//       render: () => (
//         <button className="text-blue-600 hover:underline">View</button>
//       ),
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="mx-auto w-full max-w-7xl px-4 py-5">
//         <PageHeader
//           title="Inbound Turnaround Time"
//           subtitle="Monitor inbound receiving and putaway efficiency"
//           breadcrumbs={[
//             { label: "Reports", to: "/reports" },
//             { label: "Inbound TAT" },
//           ]}
//           actions={
//             <>
//               <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
//                 Export CSV
//               </button>
//               <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
//                 Print
//               </button>
//             </>
//           }
//         />

//         {/* Filters */}
//         <div className="mt-3">
//           <FilterBar
//             filters={[
//               {
//                 key: "dateRange",
//                 label: "Date Range",
//                 value: dateRange,
//                 options: [
//                   "Today",
//                   "This Week",
//                   "This Month (Oct 2023)",
//                   "Last Month",
//                 ],
//               },
//               {
//                 key: "warehouse",
//                 label: "Warehouse",
//                 value: warehouse,
//                 options: [
//                   "All Warehouses",
//                   "WH-NYC-01",
//                   "WH-LA-02",
//                   "WH-CHI-03",
//                 ],
//               },
//               {
//                 key: "client",
//                 label: "Client",
//                 value: client,
//                 options: ["All Clients", "Acme Corp", "Globex", "Initech"],
//               },
//               {
//                 key: "supplier",
//                 label: "Supplier",
//                 value: supplier,
//                 options: [
//                   "All Suppliers",
//                   "Global Tech Supplies",
//                   "MediCare Corp",
//                   "Pharma Plus",
//                 ],
//               },
//             ]}
//             onFilterChange={(key, val) => {
//               if (key === "dateRange") setDateRange(val);
//               if (key === "warehouse") setWarehouse(val);
//               if (key === "client") setClient(val);
//               if (key === "supplier") setSupplier(val);
//             }}
//             onApply={handleApply}
//             onReset={handleReset}
//             showActions={true}
//           />
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
//           <StatCard
//             title="ASNs Received"
//             value="156"
//             accentColor="#2563EB"
//             subtext="vs last period"
//           />
//           <StatCard
//             title="Avg Inbound TAT"
//             value="4.2h"
//             accentColor="#0F766E"
//             subtext="Target: < 5.0h"
//           />
//           <StatCard
//             title="Avg Putaway Time"
//             value="0.5h"
//             accentColor="#7C3AED"
//             subtext="GRN to Shelf"
//             meta="- 0.0h"
//           />
//           <StatCard
//             title="SLA Compliance"
//             value="98.5%"
//             accentColor="#16A34A"
//             subtext="Inbound within 24h"
//           />
//         </div>

//         {/* Table */}
//         <div className="mt-6 rounded-xl border border-gray-200 bg-white">
//           <div className="border-b border-gray-200 px-4 py-3">
//             <h3 className="text-sm font-semibold text-gray-900">
//               Drill-down: Received Shipments
//             </h3>
//           </div>

//           <div className="p-2">
//             <CusTable columns={columns} data={rows} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useMemo, useState, useEffect, useCallback } from "react";
import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import StatCard from "../components/StatCard";
import CusTable from "../components/CusTable";
import { StatusPill } from "./components/helper";
import PaginatedEntityDropdown from "../inbound/components/asnform/common/PaginatedEntityDropdown";
import http from "../../api/http";
import { useNavigate } from "react-router-dom";

const pad2 = (n) => String(n).padStart(2, "0");

const toYMD = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const fmtDateTime = (iso) => {
  if (!iso) return "-";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const hoursLabel = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return `${n.toFixed(2)}h`;
};

const pctLabel = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return `${n.toFixed(2)}%`;
};

function deriveDateRange(rangeKey) {
  const now = new Date();

  if (rangeKey === "ALL") return {};

  if (rangeKey === "TODAY") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { date_from: toYMD(d), date_to: toYMD(d) };
  }

  if (rangeKey === "WEEK") {
    const day = now.getDay();
    const diffToMon = (day + 6) % 7;
    const mon = new Date(now);
    mon.setDate(now.getDate() - diffToMon);

    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    return { date_from: toYMD(mon), date_to: toYMD(sun) };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { date_from: toYMD(start), date_to: toYMD(end) };
}

export default function InboundTAT() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    date_range: "ALL",
    warehouse_id: "",
    client_id: "",
  });

  const [warehouses, setWarehouses] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState({
    total_asns_received: 0,
    avg_inbound_tat_hours: "0",
    avg_putaway_time_hours: "0",
    sla_compliance_pct: "0",
  });
  const [tableRows, setTableRows] = useState([]);

  const handleFilterChange = (key, value) => {
    setFilters((p) => ({ ...p, [key]: value }));
  };

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoadingWarehouses(true);
      try {
        const { data } = await http.get("/warehouses", {
          signal: controller.signal,
        });
        if (data?.success && Array.isArray(data?.data)) {
          setWarehouses(data.data.filter((w) => w.is_active));
        } else {
          setWarehouses([]);
        }
      } catch (e) {
        if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
        setWarehouses([]);
      } finally {
        setLoadingWarehouses(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const queryParams = useMemo(() => {
    const params = {
      ...deriveDateRange(filters.date_range),
    };

    if (filters.warehouse_id) params.warehouse_id = filters.warehouse_id;
    if (filters.client_id) params.client_id = filters.client_id;

    return params;
  }, [filters]);

  const fetchReport = useCallback(
    async (signal) => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await http.get("/reports/inbound-tat", {
          params: queryParams,
          signal,
        });

        if (!data?.success) {
          setErr("Failed to load report.");
          setTableRows([]);
          return;
        }

        const s = data?.data?.summary || {};
        setSummary({
          total_asns_received: Number(s.total_asns_received || 0),
          avg_inbound_tat_hours: String(s.avg_inbound_tat_hours ?? "0"),
          avg_putaway_time_hours: String(s.avg_putaway_time_hours ?? "0"),
          sla_compliance_pct: String(s.sla_compliance_pct ?? "0"),
        });

        const apiRows = Array.isArray(data?.data?.rows) ? data.data.rows : [];
        const uiRows = apiRows.map((r, idx) => ({
          id: `${r.asn_no || ""}-${idx}`,
          asnNo: r.asn_no || "",
          grnNo: r.grn_no || "",
          supplier: r.supplier_name || "",
          receivingStart: fmtDateTime(r.receiving_started_at),
          grnTime: fmtDateTime(r.grn_posted_at),
          putawayComplete: fmtDateTime(r.putaway_completed_at),
          totalTat: hoursLabel(r.total_tat_hours),
          status: r.status || "-",
          _raw: r,
        }));

        setTableRows(uiRows);
      } catch (e) {
        if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
        setErr(
          e?.response?.data?.message || e?.message || "Something went wrong.",
        );
        setTableRows([]);
      } finally {
        setLoading(false);
      }
    },
    [queryParams],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchReport(controller.signal);
    return () => controller.abort();
  }, [fetchReport]);

  const handleApply = () => {
    const controller = new AbortController();
    fetchReport(controller.signal);
  };

  const handleReset = () => {
    setFilters({
      date_range: "ALL",
      warehouse_id: "",
      client_id: "",
    });
  };

  const extractNumericId = (value) => {
    if (!value) return "";
    const match = String(value).match(/\d+/);
    return match ? Number(match[0]) : "";
  };

  const columns = useMemo(
    () => [
      {
        key: "asnNo",
        title: "ASN No",
        render: (row) => (
          <button
            onClick={() =>
              navigate(`/inbound/ASNdetails/${extractNumericId(row.id)}`)
            }
            className="text-blue-600 hover:underline"
          >
            {row.asnNo}
          </button>
        ),
      },
      { key: "grnNo", title: "GRN No" },
      { key: "supplier", title: "Supplier" },
      { key: "receivingStart", title: "Receiving Start" },
      { key: "grnTime", title: "GRN Time" },
      { key: "putawayComplete", title: "Putaway Complete" },
      {
        key: "totalTat",
        title: "Total TAT",
        render: (row) => (
          <span
            className={
              Number(row?._raw?.total_tat_hours) > 24
                ? "font-semibold text-orange-600"
                : ""
            }
          >
            {row.totalTat}
          </span>
        ),
      },
      {
        key: "status",
        title: "Status",
        render: (row) => <StatusPill status={row.status} variant="inbound" />,
      },
    ],
    [],
  );

  const filterConfig = useMemo(
    () => [
      {
        key: "date_range",
        label: "Date Range",
        value: filters.date_range,
        options: [
          { label: "All", value: "ALL" },
          { label: "Today", value: "TODAY" },
          { label: "Week", value: "WEEK" },
          { label: "Month", value: "MONTH" },
        ],
      },
    ],
    [filters.date_range],
  );

  return (
    <div>
      <PageHeader
        title="Inbound Turnaround Time"
        subtitle="Monitor inbound receiving and putaway efficiency"
        breadcrumbs={[
          { label: "Reports", to: "/reports" },
          { label: "Inbound TAT" },
        ]}
        actions={
          <>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              onClick={() => console.log("export csv")}
            >
              Export CSV
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              onClick={() => window.print()}
            >
              Print
            </button>
          </>
        }
      />

      <FilterBar
        filters={filterConfig}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onApply={handleApply}
      >
        <div className="w-full sm:w-[220px]">
          <p className="mb-1 text-xs text-gray-500">Warehouse</p>
          <select
            value={filters.warehouse_id}
            onChange={(e) => handleFilterChange("warehouse_id", e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-100"
            disabled={loadingWarehouses}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.warehouse_name} ({w.warehouse_code})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-[260px]">
          <p className="mb-1 text-xs text-gray-500">Client</p>
          <PaginatedEntityDropdown
            endpoint="/clients"
            listKey="clients"
            value={filters.client_id}
            onChange={(id) => handleFilterChange("client_id", id)}
            placeholder="All Clients"
            limit={10}
            // enableSearch
            searchParam="search"
            renderItem={(c) => ({
              title: `${c.client_name} (${c.client_code})`,
              subtitle: c.email || c.phone || "",
            })}
          />
        </div>
      </FilterBar>

      <div className="mt-2">
        {loading && (
          <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            Loading report...
          </div>
        )}
        {!!err && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          title="ASNs Received"
          value={String(summary.total_asns_received ?? 0)}
          accentColor="#2563EB"
          subtext="Selected period"
        />
        <StatCard
          title="Avg Inbound TAT"
          value={hoursLabel(summary.avg_inbound_tat_hours)}
          accentColor="#0F766E"
          subtext="Receiving → Putaway"
        />
        <StatCard
          title="Avg Putaway Time"
          value={hoursLabel(summary.avg_putaway_time_hours)}
          accentColor="#7C3AED"
          subtext="GRN → Shelf"
        />
        <StatCard
          title="SLA Compliance"
          value={pctLabel(summary.sla_compliance_pct)}
          accentColor="#16A34A"
          subtext="Inbound within SLA"
        />
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Drill-down: Received Shipments
          </h3>
          <p className="text-xs text-gray-500">{tableRows.length} rows</p>
        </div>

        <div className="p-2">
          {!loading && !err && tableRows.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              No data for selected filters.
            </div>
          ) : (
            <CusTable columns={columns} data={tableRows} />
          )}
        </div>
      </div>
    </div>
  );
}

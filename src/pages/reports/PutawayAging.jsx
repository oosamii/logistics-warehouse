// // src/pages/reports/PutawayAging.jsx
// import React, { useMemo, useState } from "react";
// import { RefreshCw, Download, Search } from "lucide-react";

// import PageHeader from "../components/PageHeader";
// import FilterBar from "../components/FilterBar";
// import StatCard from "../components/StatCard";
// import CusTable from "../components/CusTable";
// import { StatusPill, Badge } from "./components/helper";

// export default function PutawayAging() {
//   const [dateRange, setDateRange] = useState("This Week");
//   const [zone, setZone] = useState("All Zones");
//   const [user, setUser] = useState("All Users");
//   const [search, setSearch] = useState("");

//   const filtersObj = useMemo(
//     () => ({ dateRange, zone, user, search }),
//     [dateRange, zone, user, search],
//   );

//   const handleApply = () => console.log("Apply Filters:", filtersObj);

//   const handleReset = () => {
//     setDateRange("This Week");
//     setZone("All Zones");
//     setUser("All Users");
//     setSearch("");
//   };

//   const data = [
//     {
//       id: "TSK-9001",
//       taskId: "TSK-9001",
//       grnNo: "GRN-2023-089",
//       sku: "SKU-A100 (Widget X)",
//       qty: 500,
//       source: "Dock-01",
//       suggestedBin: "A-01-02",
//       assignedTo: "John Doe",
//       createdTime: "Oct 24, 08:30 AM",
//       aging: "26h 15m",
//       status: "Pending",
//     },
//     {
//       id: "TSK-9012",
//       taskId: "TSK-9012",
//       grnNo: "GRN-2023-095",
//       sku: "SKU-C300 (Tool Z)",
//       qty: 50,
//       source: "Recv-Area",
//       suggestedBin: "C-02-01",
//       assignedTo: "Jane Smith",
//       createdTime: "Oct 25, 06:00 AM",
//       aging: "5h 45m",
//       status: "In Progress",
//     },
//     {
//       id: "TSK-9018",
//       taskId: "TSK-9018",
//       grnNo: "GRN-2023-098",
//       sku: "SKU-D400 (Part A)",
//       qty: 1000,
//       source: "Dock-03",
//       suggestedBin: "D-10-05",
//       assignedTo: "-",
//       createdTime: "Oct 25, 07:00 AM",
//       aging: "4h 45m",
//       status: "Pending",
//     },
//     {
//       id: "TSK-9022",
//       taskId: "TSK-9022",
//       grnNo: "GRN-2023-101",
//       sku: "SKU-E500 (Part B)",
//       qty: 200,
//       source: "Recv-Area",
//       suggestedBin: "E-01-01",
//       assignedTo: "Mike Ross",
//       createdTime: "Oct 25, 10:00 AM",
//       aging: "1h 45m",
//       status: "Pending",
//     },
//     {
//       id: "TSK-9025",
//       taskId: "TSK-9025",
//       grnNo: "GRN-2023-102",
//       sku: "SKU-F600 (Part C)",
//       qty: 50,
//       source: "Dock-01",
//       suggestedBin: "F-03-03",
//       assignedTo: "Mike Ross",
//       createdTime: "Oct 25, 10:30 AM",
//       aging: "1h 15m",
//       status: "Pending",
//     },
//   ];

//   const filtered = useMemo(() => {
//     const q = (search || "").toLowerCase().trim();
//     if (!q) return data;
//     return data.filter((r) =>
//       [
//         r.taskId,
//         r.grnNo,
//         r.sku,
//         r.source,
//         r.suggestedBin,
//         r.assignedTo,
//         r.status,
//       ]
//         .join(" ")
//         .toLowerCase()
//         .includes(q),
//     );
//   }, [data, search]);

//   const columns = [
//     {
//       key: "taskId",
//       title: "Task ID",
//       render: (row) => (
//         <button className="text-blue-600 hover:underline">{row.taskId}</button>
//       ),
//     },
//     { key: "grnNo", title: "GRN No" },
//     { key: "sku", title: "SKU" },
//     { key: "qty", title: "Qty" },
//     { key: "source", title: "Source" },
//     { key: "suggestedBin", title: "Suggested Bin" },
//     { key: "assignedTo", title: "Assigned To" },
//     { key: "createdTime", title: "Created Time" },
//     {
//       key: "aging",
//       title: "Aging",
//       render: (row) => (
//         <span
//           className={
//             row.aging.startsWith("26") ? "font-semibold text-red-600" : ""
//           }
//         >
//           {row.aging}
//         </span>
//       ),
//     },
//     {
//       key: "status",
//       title: "Status",
//       render: (row) => <StatusPill status={row.status} variant="task" />,
//     },
//   ];

//   return (
//     <div className="">
//       <PageHeader
//         title="Putaway Aging Report"
//         subtitle="Monitor delays in stock movement from dock to storage"
//         breadcrumbs={[
//           { label: "Reports", to: "/reports" },
//           { label: "Putaway Aging" },
//         ]}
//         actions={
//           <>
//             <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
//               Refresh
//             </button>
//             <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
//               Export CSV
//             </button>
//           </>
//         }
//       />

//       {/* Filters (3 selects + Apply) */}
//       <div className="mt-3">
//         <FilterBar
//           filters={[
//             {
//               key: "dateRange",
//               label: "Date Range",
//               value: dateRange,
//               options: ["Today", "This Week", "This Month", "Last Week"],
//             },
//             {
//               key: "zone",
//               label: "Zone",
//               value: zone,
//               options: ["All Zones", "Zone A", "Zone B", "Zone C"],
//             },
//             {
//               key: "user",
//               label: "User",
//               value: user,
//               options: ["All Users", "John Doe", "Jane Smith", "Mike Ross"],
//             },
//           ]}
//           onFilterChange={(key, val) => {
//             if (key === "dateRange") setDateRange(val);
//             if (key === "zone") setZone(val);
//             if (key === "user") setUser(val);
//           }}
//           onApply={handleApply}
//           onReset={handleReset}
//           showActions={true}
//         />
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
//         <StatCard
//           title="Total Tasks Created"
//           value="158"
//           accentColor="#2563EB"
//           subtext="This week"
//         />
//         <StatCard
//           title="Pending Tasks"
//           value="45"
//           accentColor="#F59E0B"
//           subtext="Action required"
//         />
//         <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
//           <div
//             className="absolute left-0 top-0 h-full w-1"
//             style={{ backgroundColor: "#FB923C" }}
//           />
//           <p className="text-sm text-gray-500">Aging &gt; 4 Hours</p>
//           <p className="text-2xl font-semibold text-gray-900 mt-2">12</p>
//           <div className="mt-2">
//             <Badge text="+3 since morning" tone="orange" />
//           </div>
//         </div>
//         <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
//           <div
//             className="absolute left-0 top-0 h-full w-1"
//             style={{ backgroundColor: "#EF4444" }}
//           />
//           <p className="text-sm text-gray-500">Aging &gt; 24 Hours</p>
//           <p className="text-2xl font-semibold text-gray-900 mt-2">2</p>
//           <div className="mt-2">
//             <Badge text="Critical" tone="red" />
//           </div>
//         </div>
//       </div>

//       {/* Detailed Task List */}
//       <div className="mt-6 rounded-xl border border-gray-200 bg-white">
//         <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
//           <h3 className="text-sm font-semibold text-gray-900">
//             Detailed Task List
//           </h3>

//           <div className="relative w-full sm:w-[220px]">
//             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
//             <input
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="h-9 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
//               placeholder="Search task..."
//             />
//           </div>
//         </div>

//         <div className="p-2">
//           <CusTable columns={columns} data={filtered} />
//         </div>
//       </div>
//     </div>
//   );
// }

// src/pages/reports/PutawayAging.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";

import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import StatCard from "../components/StatCard";
import CusTable from "../components/CusTable";
import { StatusPill, Badge } from "./components/helper";
import http from "../../api/http";
import PaginatedEntityDropdown from "../inbound/components/asnform/common/PaginatedEntityDropdown";
import { useNavigate } from "react-router-dom";

// ---------------- helpers ----------------
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

function deriveDateRange(rangeKey) {
  const now = new Date();

  if (rangeKey === "ALL") return {};

  if (rangeKey === "TODAY") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { date_from: toYMD(d), date_to: toYMD(d) };
  }

  if (rangeKey === "WEEK") {
    // Monday -> Sunday
    const day = now.getDay(); // 0 Sun..6 Sat
    const diffToMon = (day + 6) % 7;
    const mon = new Date(now);
    mon.setDate(now.getDate() - diffToMon);

    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    return { date_from: toYMD(mon), date_to: toYMD(sun) };
  }

  // MONTH
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { date_from: toYMD(start), date_to: toYMD(end) };
}

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmtAging = (hoursVal) => {
  const h = toNum(hoursVal);
  const totalMins = Math.round(h * 60);
  const hh = Math.floor(totalMins / 60);
  const mm = totalMins % 60;
  return `${hh}h ${mm}m`;
};

export default function PutawayAging() {
  const navigate = useNavigate();
  // ✅ production filters
  const [filters, setFilters] = useState({
    date_range: "ALL", // ALL | TODAY | WEEK | MONTH
    zone: "",
    user_id: "",
  });

  const [search, setSearch] = useState("");

  // api state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [summary, setSummary] = useState({
    total_tasks_created: 0,
    pending_tasks: "0",
    aging_over_4h: "0",
    aging_over_24h: "0",
  });

  const [rows, setRows] = useState([]);

  const handleFilterChange = (key, val) => {
    setFilters((p) => ({ ...p, [key]: val }));
  };

  const handleReset = () => {
    setFilters({ date_range: "ALL", zone: "", user_id: "" });
    setSearch("");
  };

  const extractNumericId = (value) => {
    if (!value) return "";
    const match = String(value).match(/\d+/);
    return match ? Number(match[0]) : "";
  };

  const queryParams = useMemo(() => {
    const params = { ...deriveDateRange(filters.date_range) };

    if (filters.zone) params.zone = filters.zone;
    if (filters.user_id) params.assigned_to = filters.user_id;

    return params;
  }, [filters]);

  const fetchReport = useCallback(
    async (signal) => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await http.get("/reports/putaway-aging", {
          params: queryParams,
          signal,
        });

        if (!data?.success) {
          setErr("Failed to load report.");
          setRows([]);
          return;
        }

        const s = data?.data?.summary || {};
        setSummary({
          total_tasks_created: Number(s.total_tasks_created || 0),
          pending_tasks: String(s.pending_tasks ?? "0"),
          aging_over_4h: String(s.aging_over_4h ?? "0"),
          aging_over_24h: String(s.aging_over_24h ?? "0"),
        });

        const apiRows = Array.isArray(data?.data?.rows) ? data.data.rows : [];
        const uiRows = apiRows.map((r, idx) => ({
          id: `${r.pt_task_id || "PT"}-${idx}`,
          taskId: r.pt_task_id || "-",
          grnNo: r.grn_no || "-",
          sku: `${r.sku_code || "-"} (${r.sku_name || "-"})`,
          qty: r.qty ?? 0,
          source: r.source_location || "-",
          suggestedBin: r.suggested_bin || "-",
          assignedTo: r.assigned_to_name || "-",
          createdTime: fmtDateTime(r.created_at),
          aging: fmtAging(r.aging_hours),
          status: r.putaway_status || "-",
          _raw: r,
        }));

        setRows(uiRows);
      } catch (e) {
        if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
        setErr(
          e?.response?.data?.message || e?.message || "Something went wrong.",
        );
        setRows([]);
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

  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.taskId,
        r.grnNo,
        r.sku,
        r.source,
        r.suggestedBin,
        r.assignedTo,
        r.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

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

  const columns = useMemo(
    () => [
      {
        key: "taskId",
        title: "Task ID",
        render: (row) => (
          <button
            onClick={() =>
              navigate(
                `/putaway/putawaydetails/${extractNumericId(row.taskId)}`,
              )
            }
            className="text-blue-600 hover:underline"
          >
            {row.taskId}
          </button>
        ),
      },
      { key: "grnNo", title: "GRN No" },
      { key: "sku", title: "SKU" },
      { key: "qty", title: "Qty" },
      { key: "source", title: "Source" },
      { key: "suggestedBin", title: "Suggested Bin" },
      { key: "assignedTo", title: "Assigned To" },
      { key: "createdTime", title: "Created Time" },
      {
        key: "aging",
        title: "Aging",
        render: (row) => {
          const h = toNum(row?._raw?.aging_hours);
          const cls =
            h > 24
              ? "font-semibold text-red-600"
              : h > 4
                ? "font-semibold text-orange-600"
                : "";
          return <span className={cls}>{row.aging}</span>;
        },
      },
      {
        key: "status",
        title: "Status",
        render: (row) => <StatusPill status={row.status} variant="task" />,
      },
    ],
    [],
  );

  return (
    <div className="">
      <PageHeader
        title="Putaway Aging Report"
        subtitle="Monitor delays in stock movement from dock to storage"
        breadcrumbs={[
          { label: "Reports", to: "/reports" },
          { label: "Putaway Aging" },
        ]}
        actions={
          <>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              onClick={handleApply}
            >
              Refresh
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              onClick={() => console.log("export csv")}
            >
              Export CSV
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="mt-3">
        <FilterBar
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          onApply={handleApply}
        >
          {/* Zone dummy */}
          <div className="w-full sm:w-[180px]">
            <p className="text-xs text-gray-500 mb-1">Zone</p>
            <select
              value={filters.zone}
              onChange={(e) => handleFilterChange("zone", e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Zones</option>
              <option value="A">Zone A</option>
              <option value="B">Zone B</option>
              <option value="C">Zone C</option>
            </select>
          </div>

          <div className="w-full sm:w-[260px]">
            <p className="mb-1 text-xs text-gray-500">User</p>

            <PaginatedEntityDropdown
              endpoint="/users"
              listKey="users"
              value={filters.user_id}
              onChange={(id) => handleFilterChange("user_id", id)}
              placeholder="All Users"
              limit={10}
              enableSearch
              searchParam="search"
              renderItem={(u) => ({
                title:
                  `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                  u.username,
                subtitle: u.email || u.phone || u.username || "",
              })}
            />
          </div>
        </FilterBar>
      </div>

      {/* Loading / error */}
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

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mt-3">
        <StatCard
          title="Total Tasks Created"
          value={String(summary.total_tasks_created ?? 0)}
          accentColor="#2563EB"
          subtext="Selected period"
        />

        <StatCard
          title="Pending Tasks"
          value={String(summary.pending_tasks ?? "0")}
          accentColor="#F59E0B"
          subtext="Action required"
        />

        <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full w-1"
            style={{ backgroundColor: "#FB923C" }}
          />
          <p className="text-sm text-gray-500">Aging &gt; 4 Hours</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {String(summary.aging_over_4h ?? "0")}
          </p>
          <div className="mt-2">
            <Badge text="Watchlist" tone="orange" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full w-1"
            style={{ backgroundColor: "#EF4444" }}
          />
          <p className="text-sm text-gray-500">Aging &gt; 24 Hours</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {String(summary.aging_over_24h ?? "0")}
          </p>
          <div className="mt-2">
            <Badge text="Critical" tone="red" />
          </div>
        </div>
      </div>

      {/* Table + Search */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Detailed Task List
          </h3>

          <div className="relative w-full sm:w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Search task..."
            />
          </div>
        </div>

        <div className="p-2">
          {!loading && !err && filtered.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              No data for selected filters.
            </div>
          ) : (
            <CusTable columns={columns} data={filtered} />
          )}
        </div>
      </div>
    </div>
  );
}

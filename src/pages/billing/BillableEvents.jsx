import React, { useEffect, useMemo, useState } from "react";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import { Download, Plus, Play, Eye, Pencil } from "lucide-react";
import http from "../../api/http";
import StatCard from "../components/StatCard";
import PaginatedEntityDropdown from "../inbound/components/asnform/common/PaginatedEntityDropdown";
import Pagination from "../components/Pagination";
import { useNavigate } from "react-router-dom";
import EditBillableEventModal from "./components/EditBillableEventModal";

const BillableEvents = () => {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [summaryRows, setSummaryRows] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState("billable");

  const [showEdit, setShowEdit] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  const openEdit = (row) => {
    const full = eventsData.find((e) => e.id === row.id);
    setEditEvent(full || null);
    setShowEdit(true);
  };

  const [eventsPagination, setEventsPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  });

  const [filters, setFilters] = useState({
    period: "This Quarter",
    warehouse_id: "",
    client_id: "",
    status: "All",
    charge_type: "",
    date_from: "",
    date_to: "",
    search: "",
  });

  const getRangeFromPeriod = (period) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const toYMD = (d) => d.toISOString().slice(0, 10);

    if (period === "This Month") {
      return { date_from: toYMD(startOfMonth), date_to: toYMD(endOfMonth) };
    }
    if (period === "Last Month") {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { date_from: toYMD(s), date_to: toYMD(e) };
    }
    if (period === "This Quarter") {
      const q = Math.floor(now.getMonth() / 3);
      const s = new Date(now.getFullYear(), q * 3, 1);
      const e = new Date(now.getFullYear(), q * 3 + 3, 0);
      return { date_from: toYMD(s), date_to: toYMD(e) };
    }
    return { date_from: "", date_to: "" };
  };

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const res = await http.get("/warehouses");
        const list = res?.data?.data || [];
        setWarehouses(
          Array.isArray(list) ? list.filter((w) => w.is_active) : [],
        );
      } catch {
        setWarehouses([]);
      }
    };

    loadWarehouses();
  }, []);

  const loadSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await http.get("/billable-events/summary");
      setSummaryRows(res?.data?.data || []);
    } catch {
      setSummaryRows([]);
    } finally {
      setLoadingSummary(false);
    }
  };

  const buildEventsParams = (page = 1) => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", String(eventsPagination.limit || 20));

    const range =
      filters.period === "Custom Range"
        ? { date_from: filters.date_from, date_to: filters.date_to }
        : getRangeFromPeriod(filters.period);

    if (filters.client_id) params.set("client_id", filters.client_id);
    if (filters.warehouse_id) params.set("warehouse_id", filters.warehouse_id);

    if (filters.status && filters.status !== "All")
      params.set("status", filters.status);

    if (filters.charge_type) params.set("charge_type", filters.charge_type);

    if (range.date_from) params.set("date_from", range.date_from);
    if (range.date_to) params.set("date_to", range.date_to);

    if (filters.search?.trim()) params.set("search", filters.search.trim());

    return params.toString();
  };

  const loadEvents = async (page = 1) => {
    setLoadingEvents(true);
    try {
      const qs = buildEventsParams(page);
      const res = await http.get(`/billable-events/?${qs}`);

      const list = res?.data?.data?.billable_events || [];
      const pag = res?.data?.data?.pagination || {};

      setEventsData(Array.isArray(list) ? list : []);
      setEventsPagination({
        total: pag.total ?? 0,
        page: pag.page ?? page,
        pages: pag.pages ?? 1,
        limit: pag.limit ?? (eventsPagination.limit || 20),
      });
    } catch {
      setEventsData([]);
      setEventsPagination({ total: 0, page: 1, pages: 1, limit: 20 });
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadEvents(1);
  }, []);

  const tabs = [
    { id: "billable", label: "Billable Events" },
    { id: "ready", label: "Ready to Invoice" },
    { id: "invoiced", label: "Invoiced" },
    { id: "payments", label: "Payments / Aging" },
    { id: "rate", label: "Rate Cards" },
  ];

  const statsCards = [
    { title: "Storage Charges", amount: "₹45,200", status: "Pending" },
    { title: "Handling Charges", amount: "₹12,450", status: "Inbound pending" },
    {
      title: "Pick/Pack Charges",
      amount: "₹28,800",
      status: "Outbound pending",
    },
    { title: "Shipping Admin", amount: "₹5,100", status: "Pending" },
    {
      title: "Blocked Events",
      amount: "24",
      status: "Missing rate cards",
      danger: true,
    },
  ];

  const StatusPill = ({ value }) => {
    const styles = {
      Pending: "bg-blue-50 text-blue-700",
      Ready: "bg-green-50 text-green-700",
      Blocked: "bg-red-50 text-red-700",
    };
    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          styles[value] || "bg-gray-100 text-gray-700"
        }`}
      >
        {value}
      </span>
    );
  };

  const TypeChip = ({ value }) => (
    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
      {value}
    </span>
  );

  const columns = [
    {
      key: "eventId",
      title: "Event ID",
      render: (row) => (
        <button
          onClick={() => navigate(`/billing/billableEventDetail/${row.id}`)}
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          {row.eventId}
        </button>
      ),
    },
    {
      key: "type",
      title: "Type",
      render: (row) => <TypeChip value={row.type} />,
    },
    {
      key: "reference",
      title: "Reference",
    },
    { key: "customer", title: "Customer" },
    { key: "basis", title: "Basis" },
    { key: "rate", title: "Rate" },
    { key: "amount", title: "Amount" },
    {
      key: "status",
      title: "Status",
      render: (row) => <StatusPill value={row.status} />,
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => {
        const canEdit = !["INVOICED", "VOID"].includes(
          String(row.rawStatus || "").toUpperCase(),
        );

        return (
          <div className="flex items-center justify-end gap-2">
            {/* Edit */}
            {row.status !== "Invoiced" && (
              <button
                onClick={() => openEdit(row)}
                disabled={!canEdit}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                title={!canEdit ? "Cannot edit INVOICED/VOID" : "Edit"}
              >
                <Pencil size={16} />
              </button>
            )}
            {/* View */}
            <button
              onClick={() => navigate(`/billing/billableEventDetail/${row.id}`)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              title="View"
            >
              <Eye size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const next = {
      period: "This Month",
      warehouse_id: "",
      client_id: "",
      status: "READY",
      charge_type: "",
      date_from: "",
      date_to: "",
      search: "",
    };
    setFilters(next);
    setTimeout(() => loadEvents(), 0);
  };
  const handleApply = () => loadEvents(1);

  const tableData = useMemo(() => {
    return eventsData.map((e) => ({
      id: e.id,
      eventId: e.event_id,
      type: e.charge_type,
      reference: e.reference_no,
      customer: e.client?.client_name || "-",
      basis: `${e.qty} (${e.billing_basis || "-"})`,
      rate: e.rate ? `₹${e.rate}` : "-",
      amount: e.amount ? `₹${e.amount}` : "-",
      rawStatus: e.status,
      status:
        e.status === "READY"
          ? "Ready"
          : e.status === "BLOCKED"
            ? "Blocked"
            : e.status === "INVOICED"
              ? "Invoiced"
              : e.status === "VOID"
                ? "Void"
                : "Pending",
    }));
  }, [eventsData]);

  const summary = useMemo(() => {
    if (!summaryRows.length) {
      return {
        pending_amount: 0,
        ready_amount: 0,
        blocked_amount: 0,
        total_unbilled: 0,
        pending_count: 0,
        ready_count: 0,
        blocked_count: 0,
        clients: 0,
      };
    }

    if (filters.client_id) {
      const row = summaryRows.find(
        (r) => String(r.client_id) === String(filters.client_id),
      );
      if (row) return { ...row, clients: 1 };
    }

    return summaryRows.reduce(
      (acc, r) => {
        return {
          pending_amount: acc.pending_amount + (r.pending_amount || 0),
          ready_amount: acc.ready_amount + (r.ready_amount || 0),
          blocked_amount: acc.blocked_amount + (r.blocked_amount || 0),
          total_unbilled: acc.total_unbilled + (r.total_unbilled || 0),
          pending_count: acc.pending_count + (r.pending_count || 0),
          ready_count: acc.ready_count + (r.ready_count || 0),
          blocked_count: acc.blocked_count + (r.blocked_count || 0),
          clients: acc.clients + 1,
        };
      },
      {
        pending_amount: 0,
        ready_amount: 0,
        blocked_amount: 0,
        total_unbilled: 0,
        pending_count: 0,
        ready_count: 0,
        blocked_count: 0,
        clients: 0,
      },
    );
  }, [summaryRows, filters.client_id]);

  const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const filterConfig = [
    {
      key: "period",
      label: "Period",
      value: filters.period,
      options: ["This Month", "Last Month", "This Quarter", "Custom Range"],
    },
    {
      key: "status",
      label: "Status",
      value: filters.status,
      options: ["All", "PENDING", "READY", "BLOCKED"],
    },
    {
      key: "search",
      type: "search",
      label: "Search",
      placeholder: "Search reference/event…",
      value: filters.search,
      className: "min-w-[320px]",
    },
  ];

  return (
    <div className="min-h-screen ">
      <div className="mx-auto space-y-5">
        <FilterBar
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          onApply={handleApply}
        >
          <div className="w-full sm:w-[220px]">
            <p className="text-xs text-gray-500 mb-1">Warehouse</p>
            <select
              value={filters.warehouse_id}
              onChange={(e) =>
                handleFilterChange("warehouse_id", e.target.value)
              }
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
            <p className="text-xs text-gray-500 mb-1">Client</p>
            <PaginatedEntityDropdown
              endpoint="/clients"
              listKey="clients"
              value={filters.client_id}
              onChange={(id) => handleFilterChange("client_id", id)}
              placeholder="All Clients"
              limit={10}
              enableSearch
              searchParam="search"
              renderItem={(c) => ({
                title: `${c.client_name} (${c.client_code})`,
                subtitle: c.email || c.phone || "",
              })}
            />
          </div>
        </FilterBar>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Clients"
            value={filters.client_id ? "Selected" : String(summary.clients)}
            accentColor="#6b7280"
          />
          <StatCard
            title="Total Unbilled"
            value={fmtINR(summary.total_unbilled)}
            accentColor="#111827"
          />
          <StatCard
            title={`Ready (${summary.ready_count})`}
            value={fmtINR(summary.ready_amount)}
            accentColor="#16a34a"
          />
          <StatCard
            title={`Pending (${summary.pending_count})`}
            value={fmtINR(summary.pending_amount)}
            accentColor="#2563eb"
          />
          <StatCard
            title={`Blocked (${summary.blocked_count})`}
            value={fmtINR(summary.blocked_amount)}
            accentColor="#dc2626"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <CusTable
            columns={columns}
            data={tableData}
            loading={loadingEvents}
          />

          <div className="border-t border-gray-200">
            <Pagination
              pagination={eventsPagination}
              onPageChange={(p) => loadEvents(p)}
            />
          </div>
        </div>
      </div>
      <EditBillableEventModal
        isOpen={showEdit}
        onClose={() => {
          setShowEdit(false);
          setEditEvent(null);
        }}
        event={editEvent}
        onUpdated={() => loadEvents(eventsPagination.page)}
      />
    </div>
  );
};

export default BillableEvents;

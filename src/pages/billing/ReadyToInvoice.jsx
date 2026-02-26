import React, { useEffect, useMemo, useState } from "react";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import Pagination from "../components/Pagination";
import PaginatedEntityDropdown from "../inbound/components/asnform/common/PaginatedEntityDropdown";
import CreateInvoiceModal from "./components/CreateInvoiceModal";
import http from "../../api/http";

const ReadyToInvoice = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 5,
  });

  const [selectedIds, setSelectedIds] = useState(new Set());

  const [filters, setFilters] = useState({
    period: "This Month",
    warehouse_id: "",
    client_id: "",
    status: "All",
    date_from: "",
    date_to: "",
    page: 1,
    limit: 10,
    search: "",
  });

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [activeWarehouse, setActiveWarehouse] = useState(null);

  const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const getRangeFromPeriod = (period) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const toYMD = (d) => d.toISOString().slice(0, 10);

    if (period === "This Month")
      return { date_from: toYMD(startOfMonth), date_to: toYMD(endOfMonth) };
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

  const buildQs = (pageOverride) => {
    const qs = new URLSearchParams();
    const page = pageOverride ?? filters.page;
    qs.set("page", String(page));
    qs.set("limit", String(filters.limit));

    const range =
      filters.period === "Custom Range"
        ? { date_from: filters.date_from, date_to: filters.date_to }
        : getRangeFromPeriod(filters.period);

    if (filters.client_id) qs.set("client_id", filters.client_id);
    if (filters.warehouse_id) qs.set("warehouse_id", filters.warehouse_id);
    if (filters.status && filters.status !== "All")
      qs.set("status", filters.status);
    if (range.date_from) qs.set("date_from", range.date_from);
    if (range.date_to) qs.set("date_to", range.date_to);

    // add only if backend supports it
    if (filters.search?.trim()) qs.set("search", filters.search.trim());

    return qs.toString();
  };

  const loadEvents = async (page = 1) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(filters.limit));

      // READY page should always be READY
      qs.set("status", "READY");

      const range =
        filters.period === "Custom Range"
          ? { date_from: filters.date_from, date_to: filters.date_to }
          : getRangeFromPeriod(filters.period);

      if (filters.client_id) qs.set("client_id", filters.client_id);
      if (filters.warehouse_id) qs.set("warehouse_id", filters.warehouse_id);
      if (range.date_from) qs.set("date_from", range.date_from);
      if (range.date_to) qs.set("date_to", range.date_to);
      if (filters.search?.trim()) qs.set("search", filters.search.trim());

      const res = await http.get(`/billable-events/?${qs.toString()}`);

      const list = res?.data?.data?.billable_events || [];
      const pag = res?.data?.data?.pagination || {};

      setRows(Array.isArray(list) ? list : []);
      setPagination({
        total: pag.total ?? 0,
        page: pag.page ?? page,
        pages: pag.pages ?? 1,
        limit: pag.limit ?? filters.limit,
      });

      setFilters((p) => ({ ...p, page: pag.page ?? page }));
    } catch {
      setRows([]);
      setPagination({ total: 0, page: 1, pages: 1, limit: filters.limit });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents(1);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((p) => ({ ...p, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      period: "This Month",
      warehouse_id: "",
      client_id: "",
      status: "All",
      date_from: "",
      date_to: "",
      page: 1,
      limit: 10,
      search: "",
    });
    setSelectedIds(new Set());
    setTimeout(() => loadEvents(1), 0);
  };

  const handleApply = () => {
    setSelectedIds(new Set());
    loadEvents(1);
  };

  const visibleIds = useMemo(() => rows.map((r) => r.id), [rows]);

  const allVisibleSelected = useMemo(() => {
    if (!visibleIds.length) return false;
    return visibleIds.every((id) => selectedIds.has(id));
  }, [visibleIds, selectedIds]);

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filterConfig = [
    {
      key: "period",
      label: "Period",
      value: filters.period,
      options: ["This Month", "Last Month", "This Quarter", "Custom Range"],
    },
    {
      key: "search",
      type: "search",
      label: "Search",
      placeholder: "Search reference/event…",
      value: filters.search,
      className: "min-w-[300px]",
    },
  ];

  const tableData = useMemo(() => {
    return rows.map((e) => ({
      id: e.id,
      eventId: e.event_id,
      type: e.charge_type,
      reference: e.reference_no,
      customer: e.client?.client_name || "-",
      warehouse: e.warehouse?.warehouse_name || "-",
      qty: e.qty,
      rate: e.rate ? `₹${e.rate}` : "-",
      amount: e.amount ? `₹${e.amount}` : "-",
      date: e.event_date,
    }));
  }, [rows]);

  // const runConfirmedAction = async () => {
  //   const { type, invoiceId } = confirm;
  //   if (!type || !invoiceId) return;

  //   setConfirmLoading(true);
  //   try {
  //     if (type === "send") {
  //       await http.post(`/invoices/${invoiceId}/send`);
  //     } else if (type === "void") {
  //       await http.post(`/invoices/${invoiceId}/void`);
  //     }

  //     closeConfirm();
  //     loadInvoices(pagination.page);
  //   } catch (e) {
  //     // optional: toast here
  //     console.error(e);
  //   } finally {
  //     setConfirmLoading(false);
  //   }
  // };

  // const openConfirm = (type, invoice) => {
  //   setConfirm({
  //     open: true,
  //     type,
  //     invoiceId: invoice.id,
  //     invoiceNo: invoice.invoice_no,
  //   });
  // };

  // const closeConfirm = () => {
  //   if (confirmLoading) return;
  //   setConfirm({ open: false, type: null, invoiceId: null, invoiceNo: "" });
  // };

  const columns = [
    {
      key: "select",
      title: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={toggleSelectAllVisible}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelectOne(row.id)}
        />
      ),
    },
    { key: "eventId", title: "Event ID" },
    { key: "type", title: "Charge Type" },
    { key: "reference", title: "Reference" },
    { key: "customer", title: "Client" },
    { key: "warehouse", title: "Warehouse" },
    { key: "qty", title: "Qty" },
    { key: "rate", title: "Rate" },
    { key: "amount", title: "Amount" },
    { key: "date", title: "Event Date" },
  ];

  return (
    <div className="space-y-5">
      <FilterBar
        filters={filterConfig}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onApply={handleApply}
      >
        {/* Warehouse */}
        <div className="w-full sm:w-[240px]">
          <p className="text-xs text-gray-500 mb-1">Warehouse</p>
          <select
            value={filters.warehouse_id}
            onChange={(e) => handleFilterChange("warehouse_id", e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.warehouse_name} ({w.warehouse_code})
              </option>
            ))}
          </select>
        </div>

        {/* Client (paginated dropdown) */}
        <div className="w-full sm:w-[280px]">
          <p className="text-xs text-gray-500 mb-1">Client</p>
          <PaginatedEntityDropdown
            endpoint="/clients"
            listKey="clients"
            value={filters.client_id}
            onChange={(id) => handleFilterChange("client_id", id)}
            placeholder="All Clients"
            enableSearch
            limit={10}
            searchParam="search"
            renderItem={(c) => ({
              title: `${c.client_name} (${c.client_code})`,
              subtitle: c.email || c.phone || "",
            })}
          />
        </div>
      </FilterBar>
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
          Selected:
          <span className="ml-2 rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
            {selectedIds.size}
          </span>
        </div>

        <button
          type="button"
          disabled={selectedIds.size === 0}
          onClick={() => {
            setSelectedEventIds(Array.from(selectedIds));
            setActiveClient(filters.client_id || null);
            setActiveWarehouse(filters.warehouse_id || null);
            setShowInvoiceModal(true);
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Create Invoice
        </button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white">
        <CusTable columns={columns} data={tableData} loading={loading} />

        <div className="border-t border-gray-200">
          <Pagination
            pagination={pagination}
            onPageChange={(p) => loadEvents(p)}
          />
        </div>
      </div>
      <CreateInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        selectedEventIds={selectedEventIds}
        clientId={activeClient}
        warehouseId={activeWarehouse}
        onSuccess={() => {
          setShowInvoiceModal(false);
          setSelectedIds(new Set());
          loadEvents(1);
        }}
      />
    </div>
  );
};

export default ReadyToInvoice;

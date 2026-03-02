import React, { useEffect, useMemo, useState } from "react";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import Pagination from "../components/Pagination";
import PaginatedEntityDropdown from "../inbound/components/asnform/common/PaginatedEntityDropdown";
import http from "../../api/http";

import EditInvoiceModal from "./components/EditInvoiceModal";
import ConfirmActionModal from "./components/ConfirmActionModal";

import { Eye } from "lucide-react";

const Invoiced = ({ onOpenInvoice }) => {
  const [warehouses, setWarehouses] = useState([]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
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
    date_from: "",
    date_to: "",
    page: 1,
    limit: 10,
    search: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    type: null, // "send" | "void"
    invoiceId: null,
    invoiceNo: "",
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

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

  const buildInvoiceQs = (pageOverride) => {
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

    if (filters.search?.trim()) qs.set("search", filters.search.trim());

    return qs.toString();
  };

  const loadInvoices = async (page = 1) => {
    setLoading(true);
    try {
      const res = await http.get(`/invoices/?${buildInvoiceQs(page)}`);
      const list = res?.data?.data || [];
      const meta = res?.data?.meta || {};

      setRows(Array.isArray(list) ? list : []);
      setPagination({
        total: meta.total ?? 0,
        page: meta.page ?? page,
        pages: meta.pages ?? 1,
        limit: meta.limit ?? filters.limit,
      });

      setFilters((p) => ({ ...p, page: meta.page ?? page }));
    } catch {
      setRows([]);
      setPagination({ total: 0, page: 1, pages: 1, limit: filters.limit });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices(1);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((p) => ({ ...p, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      period: "This Quarter",
      warehouse_id: "",
      client_id: "",
      status: "All",
      date_from: "",
      date_to: "",
      page: 1,
      limit: 10,
      search: "",
    });
    setTimeout(() => loadInvoices(1), 0);
  };

  const handleApply = () => {
    loadInvoices(1);
  };

  const openConfirm = (type, invoice) => {
    setConfirm({
      open: true,
      type,
      invoiceId: invoice.id,
      invoiceNo: invoice.invoice_no,
    });
  };

  const closeConfirm = () => {
    if (confirmLoading) return;
    setConfirm({ open: false, type: null, invoiceId: null, invoiceNo: "" });
  };

  const runConfirmedAction = async () => {
    const { type, invoiceId } = confirm;
    if (!type || !invoiceId) return;

    setConfirmLoading(true);
    try {
      if (type === "send") {
        await http.post(`/invoices/${invoiceId}/send`);
      } else if (type === "void") {
        await http.post(`/invoices/${invoiceId}/void`);
      }
      closeConfirm();
      loadInvoices(pagination.page);
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmLoading(false);
    }
  };

  const filterConfig = [
    {
      key: "period",
      label: "",
      value: filters.period,
      options: ["This Quarter", "This Month", "Last Month", "Custom Range"],
    },
    {
      key: "status",
      label: "",
      value: filters.status,
      options: ["All", "DRAFT", "SENT", "PARTIAL", "PAID", "VOID"],
    },
    {
      key: "search",
      type: "search",
      label: "",
      placeholder: "Search invoice no…",
      value: filters.search,
      className: "min-w-[320px]",
    },
  ];

  const tableData = useMemo(() => {
    return rows.map((r) => ({
      id: r.id,
      invoiceNo: r.invoice_no,
      customer: r.client?.client_name || "-",
      invoiceDate: r.invoice_date || "-",
      periodCovered: `${r.period_start} → ${r.period_end}`,
      amount: fmtINR(r.total_amount),
      status: r.status,
    }));
  }, [rows]);

  const StatusPill = ({ value }) => {
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
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${map[v] || map.DRAFT}`}
      >
        {v}
      </span>
    );
  };

  const columns = [
    {
      key: "invoiceNo",
      title: "Invoice No",
      render: (row) => (
        <button
          onClick={() => onOpenInvoice?.(row.id)}
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          {row.invoiceNo}
        </button>
      ),
    },
    { key: "customer", title: "Customer" },
    { key: "invoiceDate", title: "Invoice Date" },
    { key: "periodCovered", title: "Period Covered" },
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
        const inv = rows.find((x) => x.id === row.id) || {};
        const status = String(inv.status || "").toUpperCase();
        const canSend = status === "DRAFT";
        // const canUpdate = ["DRAFT", "SENT"].includes(status);

        return (
          <div className="flex items-center justify-end gap-2">
            {canSend && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveInvoice(inv);
                    setShowEditModal(true);
                  }}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50"
                  title="Edit (Due date / Notes)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => openConfirm("send", inv)}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                  title="Send invoice"
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => openConfirm("void", inv)}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                  title="Void invoice"
                >
                  Void
                </button>
              </>
            )}
            <button
              onClick={() => onOpenInvoice?.(row.id)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              title="View"
              type="button"
            >
              <Eye size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-3">
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
              onChange={(e) =>
                handleFilterChange("warehouse_id", e.target.value)
              }
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

          {/* Client */}
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
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <CusTable columns={columns} data={tableData} loading={loading} />

        <div className="border-t border-gray-200">
          <Pagination
            pagination={pagination}
            onPageChange={(p) => loadInvoices(p)}
          />
        </div>
      </div>

      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        invoice={activeInvoice}
        onUpdated={() => loadInvoices(pagination.page)}
      />

      {/* Confirm Send/Void */}
      <ConfirmActionModal
        isOpen={confirm.open}
        title={confirm.type === "void" ? "Void Invoice" : "Send Invoice"}
        message={
          confirm.type === "void"
            ? `Are you sure you want to VOID ${confirm.invoiceNo}? This action cannot be undone.`
            : `Are you sure you want to SEND ${confirm.invoiceNo} to the client?`
        }
        confirmText={confirm.type === "void" ? "Yes, Void" : "Yes, Send"}
        danger={confirm.type === "void"}
        loading={confirmLoading}
        onConfirm={runConfirmedAction}
        onClose={closeConfirm}
      />
    </div>
  );
};

export default Invoiced;

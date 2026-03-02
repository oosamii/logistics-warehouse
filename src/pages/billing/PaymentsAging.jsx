import React, { useEffect, useMemo, useState } from "react";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import PaginatedEntityDropdown from "../inbound/components/asnform/common/PaginatedEntityDropdown";
import http from "../../api/http";

import ConfirmActionModal from "./components/ConfirmActionModal";
import PaymentsLedgerModal from "./components/PaymentsLedgerModal";
import RecordPaymentModal from "./components/RecordPaymentModal";
import { useToast } from "../components/toast/ToastProvider";

const PaymentsAging = ({ onOpenInvoice }) => {
  const toast = useToast();
  const [warehouses, setWarehouses] = useState([]);
  const [rows, setRows] = useState([]);
  const [loadingAging, setLoadingAging] = useState(false);

  const [filters, setFilters] = useState({
    warehouse_id: "",
    client_id: "",
    search: "",
  });

  const [showLedger, setShowLedger] = useState(false);
  const [showRecordPay, setShowRecordPay] = useState(false);
  const [activeClient, setActiveClient] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    type: null, // "confirm" | "reverse"
    paymentId: null,
    paymentNo: "",
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

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

  const loadAging = async () => {
    setLoadingAging(true);
    try {
      const qs = new URLSearchParams();
      if (filters.warehouse_id) qs.set("warehouse_id", filters.warehouse_id);
      if (filters.client_id) qs.set("client_id", filters.client_id); // if backend supports; harmless if ignored
      if (filters.search?.trim()) qs.set("search", filters.search.trim()); // if backend supports

      const res = await http.get(`/payments/aging?${qs.toString()}`);
      const list = res?.data?.data || [];
      setRows(Array.isArray(list) ? list : []);
    } catch {
      setRows([]);
    } finally {
      setLoadingAging(false);
    }
  };

  useEffect(() => {
    loadAging();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((p) => ({ ...p, [key]: value }));
  };

  const handleReset = () => {
    setFilters({ warehouse_id: "", client_id: "", search: "" });
    setTimeout(() => loadAging(), 0);
  };

  const handleApply = () => loadAging();

  const riskChip = (risk) => {
    const v = String(risk || "").toUpperCase();
    const map = {
      HIGH: "bg-red-100 text-red-700",
      MEDIUM: "bg-amber-100 text-amber-700",
      LOW: "bg-green-100 text-green-700",
      GOOD: "bg-blue-100 text-blue-700",
    };
    return (
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${map[v] || "bg-gray-100 text-gray-700"}`}
      >
        {v || "-"}
      </span>
    );
  };

  const tableData = useMemo(() => {
    // Optional: client side search on client name/code if backend doesn't support search
    const s = filters.search.trim().toLowerCase();
    const filtered = s
      ? rows.filter((r) => {
          const name = r?.client?.client_name || "";
          const code = r?.client?.client_code || "";
          return `${name} ${code}`.toLowerCase().includes(s);
        })
      : rows;

    return filtered.map((r) => ({
      id: r.client_id,
      clientId: r.client_id,
      customer: `${r.client?.client_name || "-"} (${r.client?.client_code || "-"})`,
      totalOutstanding: fmtINR(r.total_outstanding),
      overdueAmount: fmtINR(r.overdue_amount),
      oldestInvoice: r.oldest_invoice?.invoice_no
        ? `${r.oldest_invoice.invoice_no} (${r.max_days_overdue || 0} days overdue)`
        : "-",
      oldestInvoiceNo: r.oldest_invoice?.invoice_no || null,
      riskLevel: r.risk_level,
      raw: r,
    }));
  }, [rows, filters.search]);

  const columns = [
    { key: "customer", title: "Customer" },
    { key: "totalOutstanding", title: "Total Outstanding" },
    { key: "overdueAmount", title: "Overdue Amount" },
    {
      key: "oldestInvoice",
      title: "Oldest Invoice",
      render: (row) =>
        row.oldestInvoiceNo ? (
          <button
            type="button"
            onClick={() => onOpenInvoice?.(row.oldestInvoiceNo)}
            className="text-left text-blue-600 hover:text-blue-800 hover:underline"
          >
            {row.oldestInvoice}
          </button>
        ) : (
          <span className="text-gray-500">-</span>
        ),
    },
    {
      key: "riskLevel",
      title: "Risk Level",
      render: (row) => riskChip(row.riskLevel),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveClient({
                id: row.clientId,
                name: row.raw?.client?.client_name || "",
                code: row.raw?.client?.client_code || "",
              });
              setShowLedger(true);
            }}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            Open Ledger
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveClient({
                id: row.clientId,
                name: row.raw?.client?.client_name || "",
                code: row.raw?.client?.client_code || "",
              });
              setShowRecordPay(true);
            }}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
          >
            Record Pay
          </button>
        </div>
      ),
    },
  ];

  const openConfirm = (type, payment) => {
    setConfirm({
      open: true,
      type,
      paymentId: payment.id,
      paymentNo: payment.payment_no,
    });
  };

  const closeConfirm = () => {
    if (confirmLoading) return;
    setConfirm({ open: false, type: null, paymentId: null, paymentNo: "" });
  };

  const runConfirmedAction = async () => {
    const { type, paymentId } = confirm;
    if (!type || !paymentId) return;

    setConfirmLoading(true);
    try {
      let res;
      if (type === "confirm") {
        res = await http.post(`/payments/${paymentId}/confirm`);
      } else if (type === "reverse") {
        res = await http.post(`/payments/${paymentId}/reverse`);
      }
      toast.success(res?.data?.message || "Action completed successfully.");
      closeConfirm();
      setLedgerReloadKey((k) => k + 1);
      loadAging();
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmLoading(false);
    }
  };

  const [ledgerReloadKey, setLedgerReloadKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <FilterBar
          filters={[
            {
              key: "search",
              type: "search",
              label: "Search",
              placeholder: "Search client name/code…",
              value: filters.search,
              className: "min-w-[300px]",
            },
          ]}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          onApply={handleApply}
        >
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

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <CusTable columns={columns} data={tableData} loading={loadingAging} />
      </div>

      <PaymentsLedgerModal
        isOpen={showLedger}
        onClose={() => setShowLedger(false)}
        client={activeClient}
        reloadKey={ledgerReloadKey}
        onConfirmPayment={(payment) => openConfirm("confirm", payment)}
        onReversePayment={(payment) => openConfirm("reverse", payment)}
        onOpenInvoice={(invoiceNo) => onOpenInvoice?.(invoiceNo)}
      />
      <RecordPaymentModal
        isOpen={showRecordPay}
        onClose={() => setShowRecordPay(false)}
        client={activeClient}
        onSuccess={() => {
          setShowRecordPay(false);
          setLedgerReloadKey((k) => k + 1);
          loadAging();
        }}
      />

      <ConfirmActionModal
        isOpen={confirm.open}
        title={
          confirm.type === "reverse" ? "Reverse Payment" : "Confirm Payment"
        }
        message={
          confirm.type === "reverse"
            ? `Are you sure you want to REVERSE ${confirm.paymentNo}?`
            : `Are you sure you want to CONFIRM ${confirm.paymentNo}?`
        }
        confirmText={
          confirm.type === "reverse" ? "Yes, Reverse" : "Yes, Confirm"
        }
        danger={confirm.type === "reverse"}
        loading={confirmLoading}
        onConfirm={runConfirmedAction}
        onClose={closeConfirm}
      />
    </div>
  );
};

export default PaymentsAging;

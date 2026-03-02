import React, { useEffect, useMemo, useState } from "react";
import FilterBar from "../components/FilterBar";
import PaginatedEntityDropdown from "../inbound/components/asnform/common/PaginatedEntityDropdown";
import CreateInvoiceModal from "./components/CreateInvoiceModal";
import http from "../../api/http";
import { ChevronDown, ChevronRight } from "lucide-react";

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const niceChargeType = (t = "") =>
  String(t)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());

const eventTitle = (e) => {
  if (String(e.charge_type).toUpperCase() === "STORAGE") {
    if (e.storage_start_date && e.storage_end_date) {
      return `Period: ${e.storage_start_date} → ${e.storage_end_date}`;
    }
    if (e.reference_no) return e.reference_no;
    return "Storage";
  }
  return e.reference_no || e.event_id || "-";
};

const eventMeta = (e) => {
  const qty = Number(e.qty || 0);
  const basis = e.billing_basis
    ? String(e.billing_basis).replaceAll("_", " ")
    : "";
  if (qty)
    return `${qty.toLocaleString("en-IN")} ${basis ? `(${basis})` : ""}`.trim();
  return basis || "-";
};

const ReadyToInvoice = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    period: "This Quarter",
    warehouse_id: "",
    client_id: "",
    search: "",
  });

  const [openKeys, setOpenKeys] = useState(new Set());

  const [selectedByGroup, setSelectedByGroup] = useState({});

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [activeWarehouse, setActiveWarehouse] = useState(null);

  const groupKey = (g) => `${g.client_id}-${g.warehouse_id}`;

  const getSelectedSet = (key) => selectedByGroup[key] || new Set();

  const toggleEvent = (key, eventId) => {
    setSelectedByGroup((prev) => {
      const cur = new Set(prev[key] || []);
      if (cur.has(eventId)) cur.delete(eventId);
      else cur.add(eventId);
      return { ...prev, [key]: cur };
    });
  };

  const toggleSelectAllInGroup = (key, eventIds) => {
    setSelectedByGroup((prev) => {
      const cur = new Set(prev[key] || []);
      const allSelected =
        eventIds.length > 0 && eventIds.every((id) => cur.has(id));

      const next = new Set(cur);
      if (allSelected) eventIds.forEach((id) => next.delete(id));
      else eventIds.forEach((id) => next.add(id));

      return { ...prev, [key]: next };
    });
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

  const buildQs = () => {
    const qs = new URLSearchParams();
    if (filters.warehouse_id) qs.set("warehouse_id", filters.warehouse_id);
    if (filters.client_id) qs.set("client_id", filters.client_id);
    return qs.toString();
  };

  const loadReadyGroups = async () => {
    setLoading(true);
    try {
      const res = await http.get(`/billing/ready-to-invoice?${buildQs()}`);
      const list = res?.data?.data || [];
      setGroups(Array.isArray(list) ? list : []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadyGroups();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((p) => ({ ...p, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      period: "This Quarter",
      warehouse_id: "",
      client_id: "",
      search: "",
    });
    setOpenKeys(new Set());
    setSelectedByGroup({});
    setTimeout(loadReadyGroups, 0);
  };

  const handleApply = () => {
    setOpenKeys(new Set());
    setSelectedByGroup({});
    loadReadyGroups();
  };

  const filterConfig = [
    {
      key: "period",
      label: "",
      value: filters.period,
      options: ["This Month", "Last Month", "This Quarter"],
    },
    {
      key: "search",
      type: "search",
      label: "",
      placeholder: "Search Invoice, Customer…",
      value: filters.search,
      className: "min-w-[260px]",
    },
  ];

  const filteredGroups = useMemo(() => {
    const q = filters.search?.trim().toLowerCase();
    if (!q) return groups;

    return groups
      .map((g) => {
        const events = (g.events || []).filter((e) => {
          const hay = [
            e.event_id,
            e.charge_type,
            e.reference_no,
            e.description,
            e.notes,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        });

        const clientHay =
          `${g.client?.client_name || ""} ${g.client?.client_code || ""}`.toLowerCase();
        const matchClient = clientHay.includes(q);

        if (matchClient) return g;
        if (events.length) return { ...g, events, event_count: events.length };
        return null;
      })
      .filter(Boolean);
  }, [groups, filters.search]);

  const toggleOpen = (key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
          <div className="w-full sm:w-[220px]">
            <p className="mb-1 text-xs text-gray-500">Warehouse</p>
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
            <p className="mb-1 text-xs text-gray-500">Client</p>
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

      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Loading…
        </div>
      )}

      {!loading && filteredGroups.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          No ready-to-invoice data found.
        </div>
      )}

      {!loading &&
        filteredGroups.map((g) => {
          const key = groupKey(g);
          const isOpen = openKeys.has(key);

          const events = Array.isArray(g.events) ? g.events : [];
          const preview = isOpen ? events : events.slice(0, 2);

          const eventIds = events.map((e) => e.id).filter(Boolean);
          const selectedSet = getSelectedSet(key);
          const selectedCount = selectedSet.size;
          const allSelected =
            eventIds.length > 0 && eventIds.every((id) => selectedSet.has(id));

          return (
            <div
              key={key}
              className="rounded-xl border border-gray-200 bg-white"
            >
              <button
                type="button"
                onClick={() => toggleOpen(key)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                    {isOpen ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>

                  <div className="min-w-0 text-left">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {g.client?.client_name || "—"}{" "}
                      {g.client?.client_code ? (
                        <span className="text-gray-400 font-medium">
                          ({g.client.client_code})
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-500">
                      Warehouse ID: {g.warehouse_id}
                    </div>

                    {/* ✅ selection controls in header */}
                    <div
                      className="mt-2 flex items-center gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => toggleSelectAllInGroup(key, eventIds)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        Select All
                      </label>

                      <div className="text-xs text-gray-500">
                        Selected:{" "}
                        <span className="font-semibold text-gray-900">
                          {selectedCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase">
                      Events
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {Number(g.event_count || events.length || 0)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase">
                      Ready Amount
                    </div>
                    <div className="text-sm font-bold text-blue-600">
                      {fmtINR(g.ready_amount)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const ids = Array.from(selectedSet);
                      setSelectedEventIds(ids);
                      setActiveClient(g.client_id);
                      setActiveWarehouse(g.warehouse_id);
                      setShowInvoiceModal(true);
                    }}
                    disabled={selectedCount === 0}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create Invoice
                  </button>
                </div>
              </button>

              {/* Expanded list */}
              <div className="divide-y divide-gray-200 bg-blue-50/40">
                {preview.map((e) => {
                  const checked = selectedSet.has(e.id);

                  return (
                    <div
                      key={e.id}
                      className="grid grid-cols-12 gap-3 px-4 py-3 text-sm"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      <div className="col-span-1 flex items-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEvent(key, e.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </div>

                      <div className="col-span-3 text-gray-700">
                        {niceChargeType(e.charge_type)}
                      </div>

                      <div className="col-span-4 font-medium text-blue-700">
                        {eventTitle(e)}
                      </div>

                      <div className="col-span-2 text-gray-600">
                        {eventMeta(e)}
                      </div>

                      <div className="col-span-2 text-right font-semibold text-gray-900">
                        {fmtINR(e.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isOpen && events.length > 5 && (
                <button
                  type="button"
                  onClick={() => toggleOpen(key)}
                  className="w-full px-5 py-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all {events.length} events
                </button>
              )}
            </div>
          );
        })}

      <CreateInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        selectedEventIds={selectedEventIds}
        clientId={activeClient}
        warehouseId={activeWarehouse}
        onSuccess={() => {
          setShowInvoiceModal(false);
          setSelectedEventIds([]);
          setSelectedByGroup({});
          loadReadyGroups();
        }}
      />
    </div>
  );
};

export default ReadyToInvoice;

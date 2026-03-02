// src/pages/reports/OutboundSLA.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Download, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, parseISO } from "date-fns";

import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import StatCard from "../components/StatCard";
import CusTable from "../components/CusTable";
import Pagination from "../components/Pagination";
import { Badge } from "./components/helper";
import http from "../../api/http";

// Date range options mapping
const DATE_RANGES = {
  "All": { days: null },
  "Today": { days: 0 },
  "This Week": { days: 7 },
  "This Month": { days: 30 },
  "Last Month": { days: 30, offset: 30 }
};

// Priority pill (HIGH / NORMAL)
const PriorityPill = ({ value }) => {
  const map = {
    HIGH: "bg-red-100 text-red-700",
    NORMAL: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        map[value] || "bg-gray-100 text-gray-700"
      }`}
    >
      {value}
    </span>
  );
};

// SLA Status pill
const SLAStatusPill = ({ value }) => {
  const getStatusStyle = (status) => {
    const statusStr = String(status || "").toLowerCase();
    if (statusStr.includes("breached")) {
      return "bg-red-100 text-red-700";
    }
    if (statusStr.includes("within")) {
      return "bg-green-100 text-green-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(value)}`}
    >
      {value}
    </span>
  );
};

// Format date to readable string
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = parseISO(dateString);
    return format(date, "MMM d, HH:mm");
  } catch {
    return dateString;
  }
};

export default function OutboundSLA() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  // Pagination states for dropdowns
  const [warehousePage, setWarehousePage] = useState(1);
  const [clientPage, setClientPage] = useState(1);
  const [warehouses, setWarehouses] = useState([]);
  const [clients, setClients] = useState([]);
  const [warehousePagination, setWarehousePagination] = useState({ page: 1, pages: 1, total: 0 });
  const [clientPagination, setClientPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  // Filter states - default to "all"
  const [dateRange, setDateRange] = useState("All");
  const [warehouse, setWarehouse] = useState("all");
  const [client, setClient] = useState("all");
  const [showBreachesOnly, setShowBreachesOnly] = useState(false);

  // Fetch warehouses with pagination
  const fetchWarehouses = useCallback(async (page = 1) => {
    try {
      const response = await http.get("/warehouses", {
        params: { page, limit: 10 }
      });
      if (response.data.success) {
        setWarehouses(response.data.data);
        setWarehousePagination(response.data.pagination || { page: 1, pages: 1, total: response.data.data.length });
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  }, []);

  // Fetch clients with pagination
  const fetchClients = useCallback(async (page = 1) => {
    try {
      const response = await http.get("/clients", {
        params: { page, limit: 10 }
      });
      if (response.data.success) {
        setClients(response.data.data.clients);
        setClientPagination(response.data.data.pagination || { page: 1, pages: 1, total: response.data.data.clients.length });
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchWarehouses(1);
    fetchClients(1);
  }, [fetchWarehouses, fetchClients]);

  // Calculate date range based on selection
  const getDateRange = useCallback(() => {
    const today = new Date();
    let from, to;

    switch (dateRange) {
      case "All":
        from = null;
        to = null;
        break;
      case "Today":
        from = format(today, "yyyy-MM-dd");
        to = format(today, "yyyy-MM-dd");
        break;
      case "This Week":
        from = format(subDays(today, 7), "yyyy-MM-dd");
        to = format(today, "yyyy-MM-dd");
        break;
      case "This Month":
        from = format(startOfMonth(today), "yyyy-MM-dd");
        to = format(endOfMonth(today), "yyyy-MM-dd");
        break;
      case "Last Month":
        const lastMonth = subDays(startOfMonth(today), 1);
        from = format(startOfMonth(lastMonth), "yyyy-MM-dd");
        to = format(endOfMonth(lastMonth), "yyyy-MM-dd");
        break;
      default:
        from = null;
        to = null;
    }

    return { from, to };
  }, [dateRange]);

  // Fetch outbound SLA report data
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      
      // Build params object
      const params = {};
      
      // Add warehouse_id only if not "all"
      if (warehouse !== "all") {
        params.warehouse_id = warehouse;
      }
      
      // Add client_id only if not "all"
      if (client !== "all") {
        params.client_id = client;
      }
      
      // Only add date params if they exist
      if (from && to) {
        params.date_from = from;
        params.date_to = to;
      }
      
      console.log("Fetching outbound SLA with params:", params);
      
      const response = await http.get("/reports/outbound-sla", {
        params
      });

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching outbound SLA data:", error);
    } finally {
      setLoading(false);
    }
  }, [warehouse, client, dateRange, getDateRange]);

  // Apply filters
  const handleApply = () => {
    fetchReportData();
  };

  const handleReset = () => {
    setDateRange("All");
    setWarehouse("all");
    setClient("all");
    setShowBreachesOnly(false);
  };

  // Auto-fetch when filters change
  useEffect(() => {
    fetchReportData();
  }, [warehouse, client, dateRange, fetchReportData]);

  // Transform API data for table
  const tableRows = useMemo(() => {
    if (!reportData?.rows) return [];

    let rows = reportData.rows.map(row => ({
      id: row.order_no,
      orderNo: row.order_no,
      priority: row.priority || "NORMAL",
      slaDue: formatDate(row.sla_due_date),
      pickedTime: formatDate(row.picked_time),
      packedTime: formatDate(row.packed_time),
      shippedTime: formatDate(row.shipped_time),
      slaStatus: row.sla_status || "No SLA",
      cycleTime: row.cycle_time_hours ? `${parseFloat(row.cycle_time_hours).toFixed(1)}h` : "-"
    }));

    // Apply breaches filter if enabled
    if (showBreachesOnly) {
      rows = rows.filter(row => 
        row.slaStatus.toLowerCase().includes("breached")
      );
    }

    return rows;
  }, [reportData, showBreachesOnly]);

  // Calculate summary stats
  const summary = useMemo(() => {
    if (!reportData?.summary) {
      return {
        ordersShipped: 0,
        withinSLAPct: 0,
        avgCycleTime: "0h",
        slaBreaches: 0
      };
    }

    const avgCycleHours = reportData.summary.avg_cycle_time_hours || 0;
    const hours = Math.floor(avgCycleHours);
    const minutes = Math.round((avgCycleHours - hours) * 60);

    return {
      ordersShipped: reportData.summary.orders_shipped || 0,
      withinSLAPct: reportData.summary.shipped_within_sla_pct?.toFixed(1) || "0",
      avgCycleTime: minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`,
      slaBreaches: reportData.summary.sla_breaches || 0
    };
  }, [reportData]);

  const columns = [
    {
      key: "orderNo",
      title: "Order No",
      render: (row) => (
        <button className="text-blue-600 hover:underline font-medium">
          {row.orderNo}
        </button>
      ),
    },
    {
      key: "priority",
      title: "Priority",
      render: (row) => <PriorityPill value={row.priority} />,
    },
    { key: "slaDue", title: "SLA Due" },
    { key: "pickedTime", title: "Picked Time" },
    { key: "packedTime", title: "Packed Time" },
    { key: "shippedTime", title: "Shipped Time" },
    {
      key: "slaStatus",
      title: "SLA Status",
      render: (row) => <SLAStatusPill value={row.slaStatus} />,
    },
  ];

  // Get filter display labels
  const getWarehouseLabel = useCallback(() => {
    if (warehouse === "all") return "All Warehouses";
    const selected = warehouses.find(w => w.id.toString() === warehouse);
    return selected?.warehouse_name || "Select Warehouse";
  }, [warehouse, warehouses]);

  const getClientLabel = useCallback(() => {
    if (client === "all") return "All Clients";
    const selected = clients.find(c => c.id.toString() === client);
    return selected?.client_name || "Select Client";
  }, [client, clients]);

  // Loading state
  if (loading && !reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading outbound SLA data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1800px] px-4 py-5">
        <PageHeader
          title="Outbound SLA Performance"
          subtitle="Monitor on-time shipping and SLA breaches"
          breadcrumbs={[
            { label: "Reports", to: "/reports" },
            { label: "Outbound SLA" },
          ]}
          actions={
            <>
              {/* <button 
                onClick={fetchReportData}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Export Report
              </button>
              <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
                <Printer className="h-4 w-4" />
                Print
              </button> */}
            </>
          }
        />

        {/* Filters */}
        <div className="mt-3">
          <FilterBar
            filters={[
              {
                key: "dateRange",
                label: "Date Range",
                value: dateRange,
                options: ["All", "Today", "This Week", "This Month", "Last Month"],
              },
              {
                key: "warehouse",
                label: "Warehouse",
                value: warehouse,
                options: [
                  { label: "All Warehouses", value: "all" },
                  ...warehouses.map(w => ({
                    label: w.warehouse_name,
                    value: w.id.toString()
                  }))
                ],
                pagination: warehousePagination,
                onPageChange: (page) => {
                  setWarehousePage(page);
                  fetchWarehouses(page);
                },
              },
              {
                key: "client",
                label: "Client",
                value: client,
                options: [
                  { label: "All Clients", value: "all" },
                  ...clients.map(c => ({
                    label: c.client_name,
                    value: c.id.toString()
                  }))
                ],
                pagination: clientPagination,
                onPageChange: (page) => {
                  setClientPage(page);
                  fetchClients(page);
                },
              },
            ]}
            onFilterChange={(key, val) => {
              if (key === "dateRange") setDateRange(val);
              if (key === "warehouse") setWarehouse(val);
              if (key === "client") setClient(val);
            }}
            onApply={handleApply}
            onReset={handleReset}
            showActions={true}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            title="Orders Shipped"
            value={summary.ordersShipped.toLocaleString()}
            accentColor="#2563EB"
            subtext="Total shipped volume"
          />

          <StatCard
            title="Shipped Within SLA"
            value={`${summary.withinSLAPct}%`}
            accentColor="#16A34A"
            subtext={`Target: > 98%`}
          />

          <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ backgroundColor: "#7C3AED" }}
            />
            <p className="text-sm text-gray-500">Avg Cycle Time</p>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-gray-900">
                {summary.avgCycleTime}
              </p>
            </div>
            <p className="mt-1 text-sm text-gray-500">Confirm to Ship</p>
          </div>

          <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ backgroundColor: "#EF4444" }}
            />
            <p className="text-sm text-gray-500">SLA Breaches</p>

            <div className="mt-2">
              <p className="text-2xl font-semibold text-gray-900">
                {summary.slaBreaches}
              </p>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {summary.slaBreaches > 0 
                ? `${((summary.slaBreaches / summary.ordersShipped) * 100).toFixed(1)}% of orders`
                : "No breaches"}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Shipment SLA Details
            </h3>

            <button 
              onClick={() => setShowBreachesOnly(!showBreachesOnly)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors
                ${showBreachesOnly 
                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              {showBreachesOnly ? "Show All Orders" : "Show Breaches Only"}
              {showBreachesOnly && (
                <span className="ml-1 text-xs bg-red-200 px-1.5 py-0.5 rounded-full">
                  {tableRows.length}
                </span>
              )}
            </button>
          </div>

          <div className="p-2">
            {tableRows.length > 0 ? (
              <CusTable columns={columns} data={tableRows} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No order data available for the selected filters</p>
                <button 
                  onClick={handleReset}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// src/pages/reports/PickProductivity.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Download, Printer } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import StatCard from "../components/StatCard";
import CusTable from "../components/CusTable";
import { AccuracyPill, Badge } from "./components/helper";
import http from "../../api/http";

// Date range options mapping
const DATE_RANGES = {
  "All": { days: null }, // null means no date filter
  "Today": { days: 0 },
  "This Week": { days: 7 },
  "This Month": { days: 30 },
  "Last Month": { days: 30, offset: 30 }
};

export default function PickProductivity() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [clients, setClients] = useState([]);
  
  // Filter states - default to "All" for date range
  const [dateRange, setDateRange] = useState("All");
  const [warehouse, setWarehouse] = useState("all");
  const [client, setClient] = useState("all");
  const [user, setUser] = useState("All Users");

  // Pagination states for dropdowns
  const [warehousePage, setWarehousePage] = useState(1);
  const [clientPage, setClientPage] = useState(1);
  const [warehousePagination, setWarehousePagination] = useState({ page: 1, pages: 1, total: 0 });
  const [clientPagination, setClientPagination] = useState({ page: 1, pages: 1, total: 0 });

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

  // Fetch warehouses and clients on mount
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

  // Fetch report data
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
      
      // Only add date params if they exist (for "All" option)
      if (from && to) {
        params.date_from = from;
        params.date_to = to;
      }
      
      console.log("Fetching with params:", params); // For debugging
      
      const response = await http.get("/reports/pick-productivity", {
        params
      });

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
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
    setUser("All Users");
  };

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    fetchReportData();
  }, [warehouse, client, dateRange, fetchReportData]);

  // Format seconds to readable time
  const formatTime = (seconds) => {
    if (!seconds || seconds === "0" || seconds === null) return "0s";
    const secsNum = parseInt(seconds);
    if (isNaN(secsNum)) return "0s";
    
    const hrs = Math.floor(secsNum / 3600);
    const mins = Math.floor((secsNum % 3600) / 60);
    const secs = secsNum % 60;
    
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Transform API data for table
  const tableRows = useMemo(() => {
    if (!reportData?.pickers) return [];

    return reportData.pickers
      .filter(picker => {
        if (user === "All Users") return true;
        return picker.picker_name === user;
      })
      .map(picker => ({
        id: picker.assigned_to || `unassigned-${Math.random()}`,
        picker: picker.picker_name,
        tasksCompleted: picker.completed_tasks,
        linesPicked: picker.total_tasks,
        unitsPicked: parseFloat(picker.total_units_picked || 0),
        avgTime: formatTime(picker.avg_pick_time_seconds),
        exceptions: picker.exception_tasks,
        accuracy: 100 - (picker.exception_rate_pct || 0),
        totalHours: parseFloat(picker.total_hours_worked || 0).toFixed(2),
        picksPerHour: parseFloat(picker.picks_per_hour || 0).toFixed(2)
      }));
  }, [reportData, user]);

  // Get unique picker names for user filter
  const pickerOptions = useMemo(() => {
    if (!reportData?.pickers) return ["All Users"];
    return [
      "All Users",
      ...reportData.pickers
        .map(p => p.picker_name)
        .filter(name => name && name !== "Unassigned")
    ];
  }, [reportData]);

  const columns = [
    {
      key: "picker",
      title: "Picker",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
            {row.picker.charAt(0)}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {row.picker}
          </span>
        </div>
      ),
    },
    { 
      key: "tasksCompleted", 
      title: "Tasks Completed",
      render: (row) => <span className="font-medium">{row.tasksCompleted}</span>
    },
    { 
      key: "linesPicked", 
      title: "Lines Picked",
      render: (row) => <span className="font-medium">{row.linesPicked}</span>
    },
    { 
      key: "unitsPicked", 
      title: "Units Picked",
      render: (row) => <span className="font-medium">{row.unitsPicked.toFixed(0)}</span>
    },
    { 
      key: "avgTime", 
      title: "Avg Time",
      render: (row) => <span className="font-mono">{row.avgTime}</span>
    },
    { 
      key: "exceptions", 
      title: "Exceptions",
      render: (row) => (
        <Badge 
          text={row.exceptions.toString()} 
          tone={row.exceptions > 0 ? "orange" : "gray"}
        />
      )
    },
    {
      key: "accuracy",
      title: "Accuracy %",
      render: (row) => <AccuracyPill value={row.accuracy.toFixed(1)} />,
    },
  ];

  // Loading state
  if (loading && !reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1800px] px-4 py-5">
        <PageHeader
          title="Pick Productivity"
          subtitle="Monitor picker throughput, time, and exceptions"
          breadcrumbs={[
            { label: "Reports", to: "/reports" },
            { label: "Pick Productivity" },
          ]}
          actions={
            <>
              {/* <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
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
              {
                key: "user",
                label: "User",
                value: user,
                options: pickerOptions,
              },
            ]}
            onFilterChange={(key, val) => {
              if (key === "dateRange") setDateRange(val);
              if (key === "warehouse") setWarehouse(val);
              if (key === "client") setClient(val);
              if (key === "user") setUser(val);
            }}
            onApply={handleApply}
            onReset={handleReset}
            showActions={true}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            title="Picks / Hour"
            value={reportData?.summary?.picks_per_hour?.toFixed(2) || "0"}
            accentColor="#2563EB"
            subtext="Overall average"
          />

          <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ backgroundColor: "#7C3AED" }}
            />
            <p className="text-sm text-gray-500">Avg Pick Task Time</p>

            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-gray-900">
                {formatTime(reportData?.summary?.avg_pick_time_seconds)}
              </p>
            </div>

            <p className="mt-1 text-sm text-gray-500">Per pick task</p>
          </div>

          <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ backgroundColor: "#0F766E" }}
            />
            <p className="text-sm text-gray-500">Exception Rate</p>

            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-gray-900">
                {reportData?.summary?.exception_rate_pct?.toFixed(1) || "0"}%
              </p>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Target: &lt; 2.0%
            </p>
          </div>

          <StatCard
            title="Total Units Picked"
            value={reportData?.summary?.total_units_picked?.toLocaleString() || "0"}
            accentColor="#16A34A"
            subtext={dateRange === "All" ? "All time" : "This period"}
          />
        </div>

        {/* Table */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Picker Performance Details
            </h3>

            {/* <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              View Exceptions
            </button> */}
          </div>

          <div className="p-2">
            {tableRows.length > 0 ? (
              <CusTable columns={columns} data={tableRows} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data available for the selected filters
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
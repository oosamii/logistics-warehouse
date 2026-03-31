// src/pages/reports/BillingRevenue.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { RefreshCw, Download, Search } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import StatCard from "../components/StatCard";
import CusTable from "../components/CusTable";
import { Badge } from "./components/helper";
import http from "../../api/http";

// Date range options mapping
const DATE_RANGES = {
  All: { days: null },
  Today: { days: 0 },
  "This Week": { days: 7 },
  "This Month": { days: 30 },
  "Last Month": { days: 30, offset: 30 },
};

const NumPill = ({ value, tone = "green" }) => {
  const tones = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    orange: "bg-orange-100 text-orange-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        tones[tone] || tones.gray
      }`}
    >
      {value}
    </span>
  );
};

// Format currency
const formatCurrency = (value) => {
  if (!value && value !== 0) return "₹0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export default function BillingRevenue() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Pagination states for client dropdown
  const [clientPage, setClientPage] = useState(1);
  const [clients, setClients] = useState([]);
  const [clientPagination, setClientPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  // Filter states - default to "all"
  const [dateRange, setDateRange] = useState("All");
  const [client, setClient] = useState("all");
  const [chargeType, setChargeType] = useState("All Charge Types");
  const [search, setSearch] = useState("");

  // Fetch clients with pagination
  const fetchClients = useCallback(async (page = 1) => {
    try {
      const response = await http.get("/clients", {
        params: { page, limit: 10 },
      });
      if (response.data.success) {
        setClients(response.data.data.clients);
        setClientPagination(
          response.data.data.pagination || {
            page: 1,
            pages: 1,
            total: response.data.data.clients.length,
          },
        );
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  }, []);

  // Load clients on mount
  useEffect(() => {
    fetchClients(1);
  }, [fetchClients]);

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
        to = format(addDays(today, 1), "yyyy-MM-dd");
        break;

      case "This Week":
        from = format(subDays(today, 7), "yyyy-MM-dd");
        to = format(addDays(today, 1), "yyyy-MM-dd");
        break;

      case "This Month":
        from = format(startOfMonth(today), "yyyy-MM-dd");
        to = format(addDays(today, 1), "yyyy-MM-dd");
        break;

      case "Last Month": {
        const lastMonth = subDays(startOfMonth(today), 1);
        from = format(startOfMonth(lastMonth), "yyyy-MM-dd");
        to = format(addDays(endOfMonth(lastMonth), 1), "yyyy-MM-dd");
        break;
      }

      default:
        from = null;
        to = null;
    }

    return { from, to };
  }, [dateRange]);

  // Fetch billing revenue report data
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();

      // Build params object
      const params = {};

      // Add client_id only if not "all"
      if (client !== "all") {
        params.client_id = client;
      }

      // Only add date params if they exist
      if (from && to) {
        params.date_from = from;
        params.date_to = to;
      }

      console.log("Fetching billing revenue with params:", params);

      const response = await http.get("/reports/billing-revenue", {
        params,
      });

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching billing revenue data:", error);
    } finally {
      setLoading(false);
    }
  }, [client, dateRange, getDateRange]);

  // Apply filters
  const handleApply = () => {
    fetchReportData();
    console.log("Apply Filters:", { dateRange, client, chargeType, search });
  };

  const handleReset = () => {
    setDateRange("All");
    setClient("all");
    setChargeType("All Charge Types");
    setSearch("");
  };

  // Auto-fetch when client changes
  useEffect(() => {
    fetchReportData();
  }, [client, dateRange, fetchReportData]);

  // Transform API data for table
  const tableRows = useMemo(() => {
    if (!reportData?.customers) return [];

    let rows = reportData.customers.map((customer) => ({
      id: customer.client_id,
      customer: customer.client_name,
      eventsCount: customer.events_count || 0,
      blocked: parseInt(customer.blocked_events || 0),
      invoices: customer.invoices_count || 0,
      totalBilled: formatCurrency(customer.total_billed),
      outstanding: formatCurrency(customer.outstanding),
      overdue: parseFloat(customer.overdue || 0),
    }));

    // Apply charge type filter (dummy filter for now)
    if (chargeType !== "All Charge Types") {
      // TODO: Add actual charge type filtering when API supports it
      console.log("Charge type filter selected:", chargeType);
    }

    // Apply search filter
    const q = (search || "").toLowerCase().trim();
    if (q) {
      rows = rows.filter((r) =>
        [
          r.customer,
          String(r.eventsCount),
          String(r.blocked),
          String(r.invoices),
          r.totalBilled,
          r.outstanding,
          String(r.overdue),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }

    return rows;
  }, [reportData, chargeType, search]);

  // Summary stats from API
  const summary = useMemo(() => {
    if (!reportData?.summary) {
      return {
        estRevenue: 0,
        billableEvents: 0,
        blockedEvents: 0,
        invoicesRaised: 0,
        avgBillingCycle: 0,
      };
    }

    return {
      estRevenue: reportData.summary.est_revenue || 0,
      billableEvents: reportData.summary.billable_events || 0,
      blockedEvents: reportData.summary.blocked_events || 0,
      invoicesRaised: reportData.summary.invoices_raised || 0,
      avgBillingCycle: reportData.summary.avg_billing_cycle || 0,
    };
  }, [reportData]);

  const columns = [
    {
      key: "customer",
      title: "Customer",
      render: (row) => (
        <button className="text-blue-600 hover:underline font-medium">
          {row.customer}
        </button>
      ),
    },
    {
      key: "eventsCount",
      title: "Events Count",
      render: (row) => <span className="font-medium">{row.eventsCount}</span>,
    },
    {
      key: "blocked",
      title: "Blocked",
      render: (row) => {
        const n = Number(row.blocked || 0);
        if (n === 0) return <NumPill value="0" tone="green" />;
        if (n >= 50) return <NumPill value={n} tone="red" />;
        return <NumPill value={n} tone="orange" />;
      },
    },
    {
      key: "invoices",
      title: "Invoices",
      render: (row) => <span className="font-medium">{row.invoices}</span>,
    },
    {
      key: "totalBilled",
      title: "Total Billed",
      render: (row) => <span className="font-medium">{row.totalBilled}</span>,
    },
    {
      key: "outstanding",
      title: "Outstanding",
      render: (row) => <span className="font-medium">{row.outstanding}</span>,
    },
    {
      key: "overdue",
      title: "Overdue",
      render: (row) => {
        const n = Number(row.overdue || 0);
        if (n === 0) return <NumPill value="₹0" tone="green" />;
        if (n >= 20000) return <NumPill value={formatCurrency(n)} tone="red" />;
        return <NumPill value={formatCurrency(n)} tone="orange" />;
      },
    },
    // {
    //   key: "action",
    //   title: "Action",
    //   render: (row) => (
    //     <button
    //       onClick={() => console.log("View details for:", row.customer)}
    //       className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-100 transition-colors"
    //     >
    //       Details
    //     </button>
    //   ),
    // },
  ];

  // Loading state
  if (loading && !reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading billing revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1800px] px-4 py-5">
        <PageHeader
          title="Billing Cycle & Revenue"
          subtitle="Track revenue generation, billable events, and payment efficiency"
          breadcrumbs={[
            { label: "Reports", to: "/reports" },
            { label: "Billing & Revenue" },
          ]}
          actions={
            <>
              {/* <button 
                onClick={fetchReportData}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" />
                Export CSV
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
                options: [
                  "All",
                  "Today",
                  "This Week",
                  "This Month",
                  "Last Month",
                ],
              },
              {
                key: "client",
                label: "Client",
                value: client,
                options: [
                  { label: "All Clients", value: "all" },
                  ...clients.map((c) => ({
                    label: c.client_name,
                    value: c.id.toString(),
                  })),
                ],
                pagination: clientPagination,
                onPageChange: (page) => {
                  setClientPage(page);
                  fetchClients(page);
                },
              },
              // {
              //   key: "chargeType",
              //   label: "Charge Type",
              //   value: chargeType,
              //   options: [
              //     "All Charge Types",
              //     "Storage",
              //     "Handling",
              //     "Pick/Pack",
              //     "Transportation",
              //   ],
              // },
            ]}
            onFilterChange={(key, val) => {
              if (key === "dateRange") setDateRange(val);
              if (key === "client") setClient(val);
              if (key === "chargeType") setChargeType(val);
            }}
            onApply={handleApply}
            onReset={handleReset}
            showActions={true}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ backgroundColor: "#16A34A" }}
            />
            <p className="text-sm text-gray-500">Est. Revenue</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {formatCurrency(summary.estRevenue)}
            </p>
            <div className="mt-2">
              <Badge text="Current period" tone="green" />
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ backgroundColor: "#2563EB" }}
            />
            <p className="text-sm text-gray-500">Billable Events</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {summary.billableEvents.toLocaleString()}
            </p>
            <div className="mt-2">
              <Badge text="Total events" tone="blue" />
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ backgroundColor: "#EF4444" }}
            />
            <p className="text-sm text-gray-500">Blocked Events</p>
            <p className="text-2xl font-semibold text-red-600 mt-2">
              {summary.blockedEvents}
            </p>
            <div className="mt-2">
              <Badge
                text={
                  summary.blockedEvents > 0 ? "Needs Attention" : "No blocks"
                }
                tone={summary.blockedEvents > 0 ? "red" : "green"}
              />
            </div>
          </div>

          <StatCard
            title="Invoices Raised"
            value={summary.invoicesRaised.toString()}
            accentColor="#7C3AED"
            subtext="This period"
          />

          <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ backgroundColor: "#0F766E" }}
            />
            <p className="text-sm text-gray-500">Avg Billing Cycle</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {Math.abs(summary.avgBillingCycle)} Days
            </p>
            <div className="mt-2">
              <Badge
                text={summary.avgBillingCycle < 0 ? "Faster" : "Slower"}
                tone={summary.avgBillingCycle < 0 ? "green" : "orange"}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Customer Revenue Performance
            </h3>

            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Search customer..."
              />
            </div>
          </div>

          <div className="p-2">
            {tableRows.length > 0 ? (
              <CusTable columns={columns} data={tableRows} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No customer data available for the selected filters
                </p>
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

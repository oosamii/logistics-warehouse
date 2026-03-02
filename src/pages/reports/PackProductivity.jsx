// src/pages/reports/PackProductivity.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Download, RefreshCw, Search } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import StatCard from "../components/StatCard";
import CusTable from "../components/CusTable";
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

const RatingPill = ({ rating }) => {
  // Calculate rating based on performance metrics
  const getRatingDetails = (rating) => {
    if (rating >= 90) return { label: "High Performer", className: "bg-green-100 text-green-700" };
    if (rating >= 75) return { label: "Good", className: "bg-green-100 text-green-700" };
    if (rating >= 60) return { label: "Average", className: "bg-orange-100 text-orange-700" };
    return { label: "Needs Improvement", className: "bg-red-100 text-red-700" };
  };

  const details = getRatingDetails(rating);

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${details.className}`}
    >
      {details.label}
    </span>
  );
};

export default function PackProductivity() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  // Filter states - keeping only dummy filters
  const [dateRange, setDateRange] = useState("All");
  const [packer, setPacker] = useState("All Packers");
  const [zone, setZone] = useState("All Zones");
  const [search, setSearch] = useState("");

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

  // Fetch pack productivity report data
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      
      // Build params object
      const params = {};
      
      // Only add date params if they exist
      if (from && to) {
        params.date_from = from;
        params.date_to = to;
      }
      
      console.log("Fetching pack productivity with params:", params);
      
      const response = await http.get("/reports/pack-productivity", {
        params
      });

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching pack productivity data:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, getDateRange]);

  // Apply filters
  const handleApply = () => {
    fetchReportData();
    console.log("Apply Filters:", { dateRange, packer, zone, search });
  };

  const handleReset = () => {
    setDateRange("All");
    setPacker("All Packers");
    setZone("All Zones");
    setSearch("");
  };

  // Auto-fetch on mount and when dateRange changes
  useEffect(() => {
    fetchReportData();
  }, [dateRange, fetchReportData]);

  // Format seconds to readable time
  const formatTime = (seconds) => {
    if (!seconds || seconds === "0" || seconds === null) return "0s";
    const secsNum = parseInt(seconds);
    if (isNaN(secsNum)) return "0s";
    
    const mins = Math.floor(secsNum / 60);
    const secs = secsNum % 60;
    
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Calculate performance rating based on metrics
  const calculateRating = (packer) => {
    const cartonsPerHour = parseFloat(packer.cartons_per_hour || 0);
    const avgTime = parseInt(packer.avg_pack_time_seconds || 0);
    
    
    const cartonsScore = Math.min(100, (cartonsPerHour / 2) * 100); // Assuming 2 cartons/hour is excellent
    const timeScore = Math.max(0, 100 - (avgTime / 120)); // Lower time is better
    
    const overallScore = (cartonsScore + timeScore) / 2;
    
    return Math.min(100, Math.max(0, overallScore));
  };

  // Transform API data for table
  const tableData = useMemo(() => {
    if (!reportData?.packers) return [];

    return reportData.packers
      .map(packer => {
        const rating = calculateRating(packer);
        return {
          id: packer.packed_by || `packer-${Math.random()}`,
          packer: packer.packer_name,
          ordersPacked: packer.orders_packed || 0,
          cartonsCreated: packer.cartons_packed || 0,
          unitsPacked: Math.round((packer.cartons_packed || 0) * 5), // Estimate units (assuming 5 units per carton average)
          avgTime: formatTime(packer.avg_pack_time_seconds),
          reprints: reportData.summary?.label_reprints || 0, // Total reprints, not per packer
          rating: rating,
          avatar: true,
          totalHours: parseFloat(packer.total_hours_worked || 0).toFixed(2),
          cartonsPerHour: parseFloat(packer.cartons_per_hour || 0).toFixed(2)
        };
      })
      .filter(row => {
        // Apply packer filter
        if (packer !== "All Packers" && row.packer !== packer) return false;
        
        // Apply zone filter (dummy filter - would need real zone data)
        if (zone !== "All Zones") {
          // TODO: Add zone filtering logic when zone data is available
          return true;
        }
        
        return true;
      });
  }, [reportData, packer, zone]);

  // Apply search filter
  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    if (!q) return tableData;

    return tableData.filter((r) =>
      [
        r.packer,
        String(r.ordersPacked),
        String(r.cartonsCreated),
        String(r.unitsPacked),
        r.avgTime,
        String(r.reprints),
        String(r.cartonsPerHour)
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [tableData, search]);

  // Get unique packer names for filter dropdown
  const packerOptions = useMemo(() => {
    if (!reportData?.packers) return ["All Packers"];
    return [
      "All Packers",
      ...reportData.packers
        .map(p => p.packer_name)
        .filter(name => name && name !== "Unassigned")
    ];
  }, [reportData]);

  // Summary stats from API
  const summary = useMemo(() => {
    if (!reportData?.summary) {
      return {
        cartonsPerHour: 0,
        avgPackTime: "0s",
        totalOrders: 0,
        totalCartons: 0,
        labelReprints: 0
      };
    }

    return {
      cartonsPerHour: reportData.summary.cartons_per_hour?.toFixed(1) || "0",
      avgPackTime: formatTime(reportData.summary.avg_pack_time_seconds),
      totalOrders: reportData.summary.total_orders_packed || 0,
      totalCartons: reportData.packers?.reduce((sum, p) => sum + (p.cartons_packed || 0), 0) || 0,
      labelReprints: reportData.summary.label_reprints || 0
    };
  }, [reportData]);

  const columns = [
    {
      key: "packer",
      title: "Packer",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.avatar ? (
            <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
              {row.packer.charAt(0)}
            </div>
          ) : null}
          <span className="text-sm font-medium text-gray-900">
            {row.packer}
          </span>
        </div>
      ),
    },
    { 
      key: "ordersPacked", 
      title: "Orders Packed",
      render: (row) => <span className="font-medium">{row.ordersPacked}</span>
    },
    { 
      key: "cartonsCreated", 
      title: "Cartons Packed",
      render: (row) => <span className="font-medium">{row.cartonsCreated}</span>
    },
    { 
      key: "unitsPacked", 
      title: "Est. Units",
      render: (row) => <span className="font-medium">{row.unitsPacked}</span>
    },
    { 
      key: "avgTime", 
      title: "Avg Pack Time",
      render: (row) => <span className="font-mono">{row.avgTime}</span>
    },
    { 
      key: "cartonsPerHour", 
      title: "Cartons/Hour",
      render: (row) => <span className="font-medium">{row.cartonsPerHour}</span>
    },
    {
      key: "rating",
      title: "Rating",
      render: (row) => <RatingPill rating={row.rating} />,
    },
    // {
    //   key: "action",
    //   title: "Action",
    //   render: (row) => (
    //     <button 
    //       onClick={() => console.log("View details for:", row.packer)}
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
          <p className="mt-4 text-gray-600">Loading pack productivity data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1800px] px-4 py-5">
        <PageHeader
          title="Pack Productivity Report"
          subtitle="Analyze packing speed, carton output, and operational efficiency"
          breadcrumbs={[
            { label: "Reports", to: "/reports" },
            { label: "Pack Productivity" },
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

        {/* Filters - Only dummy filters now */}
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
                key: "packer",
                label: "Packer",
                value: packer,
                options: packerOptions,
              },
              {
                key: "zone",
                label: "Zone",
                value: zone,
                options: ["All Zones", "Zone A", "Zone B", "Zone C"],
              },
            ]}
            onFilterChange={(key, val) => {
              if (key === "dateRange") setDateRange(val);
              if (key === "packer") setPacker(val);
              if (key === "zone") setZone(val);
            }}
            onApply={handleApply}
            onReset={handleReset}
            showActions={true}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ backgroundColor: "#2563EB" }}
            />
            <p className="text-sm text-gray-500">Cartons / Hour</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {summary.cartonsPerHour}
            </p>
            <div className="mt-2">
              <Badge text="Overall average" tone="blue" />
            </div>
          </div>

          <StatCard
            title="Avg Pack Time / Order"
            value={summary.avgPackTime}
            accentColor="#7C3AED"
            subtext="Per order"
          />

          <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ backgroundColor: "#16A34A" }}
            />
            <p className="text-sm text-gray-500">Total Orders Packed</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {summary.totalOrders.toLocaleString()}
            </p>
            <div className="mt-2">
              <Badge text={`${summary.totalCartons} cartons`} tone="green" />
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ backgroundColor: "#0F766E" }}
            />
            <p className="text-sm text-gray-500">Label Reprints</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {summary.labelReprints}
            </p>
            <div className="mt-2">
              <Badge 
                text={`Rate: ${((summary.labelReprints / (summary.totalOrders || 1)) * 100).toFixed(1)}%`} 
                tone={summary.labelReprints > 5 ? "red" : "green"}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Packer Performance Details
            </h3>

            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Search packer..."
              />
            </div>
          </div>

          <div className="p-2">
            {filtered.length > 0 ? (
              <CusTable columns={columns} data={filtered} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No packer data available for the selected filters</p>
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
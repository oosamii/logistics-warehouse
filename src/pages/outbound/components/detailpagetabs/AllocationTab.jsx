// tabs/AllocationTab.jsx
import React, { useMemo, useEffect, useState } from "react";
import {
  Play,
  ChevronDown,
  ChevronRight,
  MapPin,
  Package,
  Clock,
  Hash,
} from "lucide-react";
import CusTable from "../../../components/CusTable";
import { Pill } from "../helpers";
import { pillToneForAllocationStatus } from "../helpers";
import http from "@/api/http";
import { useParams } from "react-router-dom";

const AllocationTab = () => {
  const { id } = useParams();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    fetchAllocations();
  }, [id]);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const res = await http.get(`/stock-allocations/order/${id}`);
      setAllocations(res.data || []);
    } catch (error) {
      console.error("Error fetching allocations:", error);
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle expand/collapse for a row
  const toggleRow = (skuId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(skuId)) {
      newExpanded.delete(skuId);
    } else {
      newExpanded.add(skuId);
    }
    setExpandedRows(newExpanded);
  };

  // Process API data to match your table format
  const rows = useMemo(() => {
    if (!allocations || allocations.length === 0) return [];

    // Group allocations by SKU
    const groupedBySku = {};

    allocations.forEach((allocation) => {
      const skuId = allocation.sku_id;
      const orderLine = allocation.orderLine;
      const sku = orderLine?.sku;

      if (!groupedBySku[skuId]) {
        groupedBySku[skuId] = {
          id: skuId,
          sku: sku?.sku_code || `SKU-${skuId}`,
          name: sku?.sku_name || "Product",
          requested: parseFloat(orderLine?.ordered_qty || 0),
          allocated: 0,
          rule: allocation.allocation_rule || "FIFO",
          status: "Full",
          allocations: [],
        };
      }

      groupedBySku[skuId].allocations.push(allocation);
      groupedBySku[skuId].allocated += parseFloat(
        allocation.allocated_qty || 0,
      );
    });

    // Convert to array and calculate status
    return Object.values(groupedBySku).map((item) => {
      const short = item.requested - item.allocated;

      let status = "None";
      if (item.allocated === 0) status = "None";
      else if (item.allocated < item.requested) status = "Partial";
      else if (item.allocated === item.requested) status = "Full";

      return {
        ...item,
        requested: item.requested.toFixed(2),
        allocated: item.allocated.toFixed(2),
        short: short.toFixed(2),
        status,
        expanded: expandedRows.has(item.id),
      };
    });
  }, [allocations, expandedRows]);

  // Calculate stats
  const stats = useMemo(() => {
    const full = rows.filter((item) => item.status === "Full").length;
    const partial = rows.filter((item) => item.status === "Partial").length;
    const unallocated = rows.filter((item) => item.status === "None").length;

    return { full, partial, unallocated };
  }, [rows]);

  const columns = useMemo(
    () => [
      {
        key: "sku",
        title: "SKU",
        render: (r) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleRow(r.id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {expandedRows.has(r.id) ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>
            <div>
              <div className="text-sm font-semibold text-gray-900">{r.sku}</div>
              <div className="text-xs text-gray-500">{r.name}</div>
            </div>
          </div>
        ),
      },
      {
        key: "requested",
        title: "Requested",
        render: (r) => <span className="font-medium">{r.requested}</span>,
      },
      {
        key: "allocated",
        title: "Allocated",
        render: (r) => (
          <span className="font-medium text-green-600">{r.allocated}</span>
        ),
      },
      {
        key: "short",
        title: "Short",
        render: (r) => (
          <span
            className={
              parseFloat(r.short) > 0
                ? "text-red-600 font-semibold"
                : "text-gray-600"
            }
          >
            {r.short}
          </span>
        ),
      },
      {
        key: "rule",
        title: "Rule",
        render: (r) => <span className="text-sm">{r.rule}</span>,
      },
      {
        key: "status",
        title: "Status",
        render: (r) => (
          <Pill text={r.status} tone={pillToneForAllocationStatus(r.status)} />
        ),
      },
      {
        key: "actions",
        title: "Actions",
        render: (r) => (
          <button
            onClick={() => toggleRow(r.id)}
            className="px-3 py-1.5 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          >
            View Bins
          </button>
        ),
      },
    ],
    [expandedRows],
  );

  // Render detailed view for expanded rows
  const renderExpandedDetails = (row) => {
    if (
      !expandedRows.has(row.id) ||
      !row.allocations ||
      row.allocations.length === 0
    ) {
      return null;
    }

    return (
      <div className="bg-gray-50 border-t">
        <div className="px-4 py-3">
          <div className="text-sm font-medium text-gray-900 mb-3">
            Allocation Details for {row.sku} - {row.name}
          </div>

          <div className="space-y-3">
            {row.allocations.map((allocation) => {
              const location = allocation.inventory?.location;
              const sku = allocation.orderLine?.sku;

              return (
                <div
                  key={allocation.id}
                  className="bg-white border rounded-lg p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Allocation Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Allocation No
                        </span>
                      </div>
                      <div className="font-medium text-sm">
                        {allocation.allocation_no}
                      </div>
                      <div className="text-xs text-gray-600">
                        <Pill
                          text={allocation.status}
                          tone={
                            allocation.status === "CONSUMED" ? "green" : "blue"
                          }
                        />
                      </div>
                    </div>

                    {/* Location Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-500">Location</span>
                      </div>
                      <div className="font-medium text-sm">
                        {location?.location_code || "Unknown"}
                        {location?.zone && (
                          <span className="ml-2 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            Zone {location.zone}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        {location?.aisle && `Aisle ${location.aisle}`}
                        {location?.rack && ` • Rack ${location.rack}`}
                        {location?.level && ` • Level ${location.level}`}
                      </div>
                    </div>

                    {/* Batch & Quantity */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Batch & Quantity
                        </span>
                      </div>
                      <div className="font-medium text-sm">
                        {allocation.batch_no || "No Batch"}
                      </div>
                      <div className="text-sm text-gray-900">
                        {parseFloat(allocation.allocated_qty).toFixed(2)} units
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-500">Timeline</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="text-gray-500">Allocated: </span>
                          <span className="font-medium">
                            {allocation.allocated_at
                              ? new Date(
                                  allocation.allocated_at,
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        {allocation.consumed_at && (
                          <div className="text-xs">
                            <span className="text-gray-500">Consumed: </span>
                            <span className="font-medium text-green-600">
                              {new Date(
                                allocation.consumed_at,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <div className="text-gray-500">Loading allocations...</div>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              No allocations found for this order
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 border rounded-md text-sm bg-white inline-flex items-center gap-2 hover:bg-gray-50">
                <Play size={16} />
                Run Allocation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">
                Full Lines{" "}
                <span className="ml-1 font-semibold text-gray-900">
                  {stats.full}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-600">
                Partial Lines{" "}
                <span className="ml-1 font-semibold text-orange-600">
                  {stats.partial}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span className="text-sm text-gray-600">
                Unallocated{" "}
                <span className="ml-1 font-semibold text-gray-900">
                  {stats.unallocated}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* <button className="px-4 py-2 border rounded-md text-sm bg-white inline-flex items-center gap-2 hover:bg-gray-50">
              <Play size={16} />
              Run Allocation
            </button>
            <button className="px-4 py-2 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700">
              Release to Picking
            </button> */}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <div className="text-sm font-semibold text-gray-900">
            Allocation Results
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {rows.length} SKUs • {allocations.length} total allocations
          </div>
        </div>

        {/* Using CusTable component */}
        <CusTable columns={columns} data={rows} />

        {/* Render expanded details for each row */}
        {rows.map((row) => renderExpandedDetails(row))}
      </div>
    </div>
  );
};

export default AllocationTab;

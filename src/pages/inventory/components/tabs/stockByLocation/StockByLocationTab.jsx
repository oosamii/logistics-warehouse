// StockByLocationTab.js
import React, { useMemo } from "react";
import FilterBar from "@/pages/components/FilterBar";
import CusTable from "@/pages/components/CusTable";
import { useToast } from "@/pages/components/toast/ToastProvider";
import SummaryCards from "../../SummaryCards";
import StatusPill from "../../StatusPill";
import { useStockByLocation } from "./useStockByLocation";
import Pagination from "../../../../components/Pagination";
import { useNavigate } from "react-router-dom";

export default function StockByLocationTab() {
  const toast = useToast();
  const navigate = useNavigate();
  const {
    loading,
    f,
    setF,
    filters,
    resetFilters,
    warehouses,
    zones,
    totals,
    tableData,
    refresh,
    pagination,
    page,
    setPage,
  } = useStockByLocation(toast);

  const columns = useMemo(
    () => [
      {
        key: "zone",
        title: "Zone",
        render: (r) => (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-700">{r.zone}</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900">
                Zone {r.zone}
              </div>
              <div className="text-xs text-gray-500">
                {r.sku_count} SKU{r.sku_count !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "total_on_hand",
        title: "On-hand",
        render: (r) => <span className="font-medium">{r.total_on_hand}</span>,
      },
      {
        key: "total_available",
        title: "Available",
        render: (r) => (
          <span className="font-medium text-green-600">
            {r.total_available}
          </span>
        ),
      },
      {
        key: "total_hold",
        title: "Hold",
        render: (r) => (
          <span className="font-medium text-orange-600">{r.total_hold}</span>
        ),
      },
      {
        key: "total_allocated",
        title: "Allocated",
        render: (r) => (
          <span className="font-medium text-blue-600">{r.total_allocated}</span>
        ),
      },
      {
        key: "total_damaged",
        title: "Damaged",
        render: (r) => (
          <span className="font-medium text-red-600">{r.total_damaged}</span>
        ),
      },
      {
        key: "sku_count",
        title: "SKUs",
        render: (r) => <span className="font-medium">{r.sku_count}</span>,
      },
      // {
      //   key: "actions",
      //   title: "Actions",
      //   render: (r) => (
      //     <div className="flex gap-2">
      //       <button
      //         className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
      //       >
      //         View Contents
      //       </button>
      //     </div>
      //   ),
      // },
    ],
    [navigate],
  );

  return (
    <div className="space-y-4">
      <SummaryCards
        cards={[
          {
            label: "Total Zones",
            value: totals.zoneCount || tableData.length,
          },
          {
            label: "Total SKUs",
            value: totals.skuCount,
          },
          {
            label: "On Hand",
            value: totals.onHand,
          },
          {
            label: "Available",
            value: totals.available,
            valueClass: "text-green-600",
          },
          {
            label: "Hold",
            value: totals.hold,
            valueClass: "text-orange-600",
          },
          {
            label: "Allocated",
            value: totals.allocated,
            valueClass: "text-blue-600",
          },
          {
            label: "Damaged",
            value: totals.damaged,
            valueClass: "text-red-600",
          },
        ]}
      />

      <FilterBar
        filters={filters}
        showActions
        onFilterChange={(k, v) => setF((s) => ({ ...s, [k]: v }))}
        onApply={refresh}
        onReset={resetFilters}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <div className="text-gray-500">Loading zone data...</div>
          </div>
        </div>
      ) : tableData.length === 0 ? (
        <div className="flex justify-center items-center h-64 flex-col">
          <div className="text-gray-500 mb-2 text-lg">No zone data found</div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-500">
            Showing {tableData.length} zone{tableData.length !== 1 ? "s" : ""}
            {f.warehouse !== "All" &&
              ` in warehouse ${
                warehouses.find((w) => w.value === f.warehouse)?.label ||
                f.warehouse
              }`}
            {f.zone !== "All" && ` filtered by Zone ${f.zone}`}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <CusTable columns={columns} data={tableData} />
            <Pagination
              pagination={{
                ...(pagination || {}),
                page: page || pagination?.page || 1,
              }}
              onPageChange={(p) => {
                if (p < 1 || p > (pagination?.pages || 1)) return;
                setPage(p);
              }}
            />
          </div>

          <div className="text-xs text-gray-400 text-center">
            Aggregated by Zone. Click "View Details" to see SKU-level breakdown
            for each zone.
          </div>
        </>
      )}
    </div>
  );
}

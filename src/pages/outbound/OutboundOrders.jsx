import React, { useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import Pagination from "../components/Pagination";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/toast/ToastProvider";
import { useSalesOrders } from "./components/useSalesOrders";
import { getUserRole } from "../utils/authStorage";
import { useAccess } from "../utils/useAccess";
import { getOrderActionLabel } from "../inbound/components/helper";

const OutboundOrders = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedRows, setSelectedRows] = useState([]);

  const roleCode = getUserRole();
  const isAdmin = roleCode === "ADMIN";
  const access = useAccess("CARRIERS");
  const canCreate = isAdmin || access.canCreate;
  const canUpdate = isAdmin || access.canUpdate;
  const canDelete = isAdmin || access.canDelete;
  const showActionsColumn = canUpdate || canDelete;

  const {
    loading,
    f,
    setF,
    filters,
    data,
    stats: apiStats,
    pagination,
    refresh,
    handlePageChange,
  } = useSalesOrders(toast);

  // Calculate stats from API data
  const calculatedStats = useMemo(() => {
    // Initialize counters
    const statusCounts = {
      DRAFT: 0,
      CONFIRMED: 0,
      ALLOCATED: 0,
      PICKING: 0,
      PICKED: 0,
      PACKING: 0,
      PACKED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    let totalOrders = 0;
    let pendingAllocation = 0;
    let pickingPending = 0;
    let packedReady = 0;
    let shippedToday = 0;
    let slaBreachRisk = 0;

    // Process each order
    data.forEach((order) => {
      totalOrders++;
      const status = order.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Count pending allocation (CONFIRMED status)
      if (status === "CONFIRMED") {
        pendingAllocation++;
      }

      // Count picking pending (ALLOCATED status)
      if (status === "ALLOCATED") {
        pickingPending++;
      }

      // Count packed ready (PACKED status)
      if (status === "PACKED") {
        packedReady++;
      }

      // Count shipped today (check if shipped today)
      if (status === "SHIPPED" && order.shipped_at) {
        const shippedDate = new Date(order.shipped_at);
        const today = new Date();
        if (shippedDate.toDateString() === today.toDateString()) {
          shippedToday++;
        }
      }

      // Check SLA breach risk (orders that are overdue or due soon)
      if (order.sla_due_date) {
        const dueDate = new Date(order.sla_due_date);
        const now = new Date();
        const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

        // If due within 24 hours and not completed
        if (
          hoursUntilDue <= 24 &&
          !["SHIPPED", "DELIVERED", "CANCELLED"].includes(status)
        ) {
          slaBreachRisk++;
        }
      }
    });

    // Also add stats from API stats endpoint if available
    if (apiStats && apiStats.length > 0) {
      apiStats.forEach((stat) => {
        if (stat.status === "PICKED") {
          // You could update counts based on API stats
        }
      });
    }

    return [
      { title: "Total Orders", value: totalOrders.toString() },
      { title: "Pending Allocation", value: pendingAllocation.toString() },
      { title: "Picking Pending", value: pickingPending.toString() },
      { title: "Packed Ready", value: packedReady.toString() },
      { title: "Shipped Today", value: shippedToday.toString() },
      { title: "SLA Breach Risk", value: slaBreachRisk.toString() },
    ];
  }, [data, apiStats]);

  const handleFilterChange = (key, value) => {
    setF((prev) => ({ ...prev, [key]: value, page: 1 })); // Reset to page 1 on filter change
  };

  const handleReset = () => {
    setF({
      warehouse_id: "All",
      client_id: "All",
      status: "All",
      page: 1,
      limit: 10,
    });
  };

  const Pill = ({ text, tone = "gray" }) => {
    const map = {
      gray: "bg-gray-100 text-gray-700",
      blue: "bg-blue-50 text-blue-700",
      green: "bg-green-50 text-green-700",
      orange: "bg-orange-50 text-orange-700",
      red: "bg-red-50 text-red-700",
      yellow: "bg-yellow-50 text-yellow-700",
      purple: "bg-purple-50 text-purple-700",
    };
    return (
      <span
        className={`text-xs px-2 py-1 rounded-full font-medium ${map[tone] || map.gray}`}
      >
        {text}
      </span>
    );
  };

  const getStatusTone = (status) => {
    switch (status) {
      case "DRAFT":
        return "gray";
      case "CONFIRMED":
        return "blue";
      case "ALLOCATED":
        return "green";
      case "PICKING":
        return "orange";
      case "PICKED":
        return "yellow";
      case "PACKING":
        return "purple";
      case "PACKED":
        return "purple";
      case "SHIPPED":
        return "green";
      case "DELIVERED":
        return "green";
      case "CANCELLED":
        return "red";
      default:
        return "gray";
    }
  };

  const getAllocationTone = (status) => {
    switch (status) {
      case "FULL":
        return "green";
      case "PARTIAL":
        return "orange";
      case "NONE":
        return "gray";
      default:
        return "gray";
    }
  };

  const getPriorityTone = (priority) => {
    switch (priority) {
      case "HIGH":
        return "red";
      case "MEDIUM":
        return "orange";
      case "NORMAL":
        return "blue";
      default:
        return "gray";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const actionBystatus = (row) => {
    if (row?.status === "DRAFT") {
      navigate(`/outbound/saleOrderCreate/${row?.id}`);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "select",
        title: (
          <input
            type="checkbox"
            onChange={(e) => {
              if (e.target.checked) setSelectedRows(data.map((x) => x.id));
              else setSelectedRows([]);
            }}
          />
        ),
        render: (row) => (
          <input
            type="checkbox"
            checked={selectedRows.includes(row.id)}
            onChange={(e) => {
              if (e.target.checked) setSelectedRows((p) => [...p, row.id]);
              else setSelectedRows((p) => p.filter((id) => id !== row.id));
            }}
          />
        ),
      },
      {
        key: "order_no",
        title: "Order No",
        render: (row) => (
          <div>
            <button
              className="text-blue-600 hover:underline font-medium"
              onClick={() => navigate(`/orderDetails/${row.id}`)}
            >
              {row.order_no}
            </button>
            <div className="text-xs text-gray-400">
              Ref: {row.reference_no || "—"}
            </div>
          </div>
        ),
      },
      {
        key: "client",
        title: "Client",
        render: (row) => row.client?.client_name || "—",
      },
      {
        key: "customer",
        title: "Customer",
        render: (row) => (
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {row.customer_name}
            </div>
            <div className="text-xs text-gray-500">{row.ship_to_city}</div>
          </div>
        ),
      },
      {
        key: "total_lines",
        title: "Lines",
        render: (row) => row.total_lines || 0,
      },
      {
        key: "total_ordered_units",
        title: "Units",
        render: (row) => parseFloat(row.total_ordered_units || 0).toFixed(0),
      },
      {
        key: "priority",
        title: "Priority",
        render: (row) => (
          <Pill text={row.priority} tone={getPriorityTone(row.priority)} />
        ),
      },
      {
        key: "sla_due_date",
        title: "SLA Due",
        render: (row) => {
          const dueDate = new Date(row.sla_due_date);
          const now = new Date();
          const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

          let displayText = formatDate(row.sla_due_date);
          let isOverdue = false;

          if (
            hoursUntilDue <= 0 &&
            !["SHIPPED", "DELIVERED", "CANCELLED"].includes(row.status)
          ) {
            displayText = `Overdue ${Math.abs(Math.round(hoursUntilDue))}h`;
            isOverdue = true;
          } else if (hoursUntilDue <= 24) {
            displayText = `${Math.round(hoursUntilDue)}h left`;
          }

          return (
            <span className={isOverdue ? "text-red-500 font-medium" : ""}>
              {displayText}
            </span>
          );
        },
      },
      {
        key: "status",
        title: "Status",
        render: (row) => (
          <Pill text={row.status} tone={getStatusTone(row.status)} />
        ),
      },
      {
        key: "allocation_status",
        title: "Allocation",
        render: (row) => (
          <Pill
            text={row.allocation_status}
            tone={getAllocationTone(row.allocation_status)}
          />
        ),
      },
      {
        key: "carrier",
        title: "Carrier",
        render: (row) => row.carrier || "—",
      },
      {
        key: "actions",
        title: "Actions",
        render: (row) => {
          // let actionLabel = "View";
          // if (row.status === "DRAFT") actionLabel = "Edit";
          // if (row.status === "CONFIRMED") actionLabel = "Allocate";
          // if (row.status === "ALLOCATED") actionLabel = "Pick";
          // if (row.status === "PICKED") actionLabel = "Pack";
          // if (row.status === "PACKED") actionLabel = "Ship";
          const actionLabel = getOrderActionLabel(row.status, canUpdate);

          return (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => actionBystatus(row)}
                className="px-3 py-1.5 text-xs rounded-md border bg-white"
              >
                {actionLabel}
              </button>
              <button
                onClick={() => navigate(`/orderDetails/${row.id}`)}
                className="px-2 py-1.5 rounded-md border bg-white"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          );
        },
      },
    ],
    [data, selectedRows],
  );

  return (
    <div className="max-w-full">
      <PageHeader
        title="Outbound Orders"
        subtitle="Create and manage outbound orders"
        actions={
          <>
            <button className="px-4 py-2 border rounded-md text-sm bg-white">
              Export
            </button>
            <button className="px-4 py-2 border rounded-md text-sm bg-white">
              Bulk Allocate
            </button>
            {canCreate && (
              <button
                onClick={() => navigate("/outbound/saleOrderCreate/new")}
                className="px-4 py-2 rounded-md text-sm bg-blue-600 text-white"
              >
                + Create Sales Order
              </button>
            )}
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {calculatedStats.map((s) => (
          <StatCard key={s.title} title={s.title} value={s.value} />
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FilterBar
          filters={filters}
          showActions
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          onApply={refresh}
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <div className="text-gray-500">Loading orders...</div>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex justify-center items-center h-64 flex-col">
          <div className="text-gray-500 mb-2 text-lg">No orders found</div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>
      ) : (
        <>
          {/* Order Count */}
          <div className="text-sm text-gray-500 mb-2">
            Showing {data.length} of {pagination.total} orders • Page{" "}
            {pagination.page} of {pagination.pages}
          </div>

          {/* Table */}
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <CusTable columns={columns} data={data} />
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-4">
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OutboundOrders;

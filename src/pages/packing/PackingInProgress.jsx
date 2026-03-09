// packing/PackingInProgress.jsx
import React, { useState, useEffect } from "react";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import http from "../../api/http";
import { Loader } from "lucide-react";

const ProgressBar = ({ current, total }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-700">
        {current} / {total}
      </span>
    </div>
  );
};

const PackingInProgress = ({ onOrderSelect }) => {
  const [filters, setFilters] = useState({
    date: "Today",
    warehouse: "",
    client: "",
    search: "",
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  });

  // Fetch orders from API
  const fetchOrders = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await http.get("/sales-orders/", {
        params: {
          status: "PACKING",
          page: page,
          limit: pagination.limit,
          ...(filters.search && { search: filters.search }),
          ...(filters.warehouse &&
            filters.warehouse !== "All" && { warehouse_id: filters.warehouse }),
          ...(filters.client &&
            filters.client !== "All" && { client_id: filters.client }),
        },
      });

      if (response.data) {
        setOrders(response.data.orders || []);
        setPagination({
          total: response.data.total || 0,
          page: response.data.page || 1,
          pages: response.data.pages || 1,
          limit: pagination.limit,
        });
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when filters change
  useEffect(() => {
    fetchOrders(1);
  }, [filters.search, filters.warehouse, filters.client]);

  // Transform API data to match what's ACTUALLY available
  const transformOrderData = (orders) => {
    return orders.map((order) => {
      // Calculate packed units from lines
      const totalUnits = parseFloat(order.total_ordered_units) || 0;
      const packedUnits = parseFloat(order.total_packed_units) || 0;

      // Format started time from packing_started_at
      const formatStartedTime = () => {
        if (!order.packing_started_at) return "-";

        const startedDate = new Date(order.packing_started_at);
        const now = new Date();
        const isToday = startedDate.toDateString() === now.toDateString();

        if (isToday) {
          return `Today ${startedDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
        } else {
          return startedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }
      };

      // Format ship to location
      const shipTo =
        `${order.ship_to_city || ""}, ${order.ship_to_state || ""}`.replace(
          /^, |, $/g,
          "",
        ) || "-";

      return {
        id: order.id,
        orderNo: order.order_no,
        client: order.client?.client_name || `Client #${order.client_id}`,
        warehouse:
          order.warehouse?.warehouse_code || `WH-${order.warehouse_id}`,
        shipTo: shipTo,
        customerName: order.customer_name,
        priority: order.priority || "NORMAL",
        startedTime: formatStartedTime(),
        totalUnits: totalUnits,
        packedUnits: packedUnits,
        status: order.status || "PACKING",
        referenceNo: order.reference_no,
        carrier: order.carrier,
        slaDueDate: order.sla_due_date,
        originalOrder: order,
      };
    });
  };

  // Filter options based on actual API data
  const getWarehouseOptions = () => {
    const uniqueWarehouses = [
      ...new Set(
        orders.map(
          (o) => o.warehouse?.warehouse_code || `WH-${o.warehouse_id}`,
        ),
      ),
    ];
    return ["All", ...uniqueWarehouses];
  };

  const getClientOptions = () => {
    const uniqueClients = [
      ...new Set(
        orders.map((o) => o.client?.client_name || `Client #${o.client_id}`),
      ),
    ];
    return ["All", ...uniqueClients];
  };

  const filterConfig = [
    {
      key: "date",
      type: "select",
      label: "Date",
      value: filters.date,
      options: ["Today", "Yesterday", "Last 7 Days", "This Month"],
      className: "w-[140px]",
    },
    {
      key: "warehouse",
      type: "select",
      label: "Warehouse",
      value: filters.warehouse,
      options: getWarehouseOptions(),
      className: "w-[140px]",
    },
    {
      key: "client",
      type: "select",
      label: "Client",
      value: filters.client,
      options: getClientOptions(),
      className: "w-[140px]",
    },
    {
      key: "search",
      type: "search",
      label: "Search",
      value: filters.search,
      placeholder: "Order No / Customer / Reference",
      className: "w-[240px]",
    },
  ];

  const columns = [
    {
      key: "orderNo",
      title: "Order No",
      render: (r) => (
        <button
          onClick={() => onOrderSelect?.(r.id)}
          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-left"
        >
          {r.orderNo}
        </button>
      ),
    },
    {
      key: "client",
      title: "Client",
      render: (r) => r.client || "-",
    },
    {
      key: "shipTo",
      title: "Ship To",
      render: (r) => r.shipTo || "-",
    },
    {
      key: "customerName",
      title: "Customer",
      render: (r) => r.customerName || "-",
    },
    {
      key: "startedTime",
      title: "Started Time",
      render: (r) => r.startedTime || "-",
    },
    {
      key: "packedUnits",
      title: "Packed Units",
      render: (r) => (
        <ProgressBar current={r.packedUnits} total={r.totalUnits} />
      ),
    },
    {
      key: "priority",
      title: "Priority",
      render: (r) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            r.priority === "HIGH"
              ? "bg-orange-100 text-orange-700"
              : r.priority === "NORMAL"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {r.priority}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (r) => {
        const statusMap = {
          PACKING: { text: "Packing", color: "bg-blue-100 text-blue-700" },
          PAUSED: { text: "Paused", color: "bg-yellow-100 text-yellow-700" },
          WAITING: { text: "Waiting", color: "bg-orange-100 text-orange-700" },
        };

        const status = statusMap[r.status] || {
          text: r.status,
          color: "bg-gray-100 text-gray-700",
        };

        return (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}
          >
            {status.text}
          </span>
        );
      },
    },
    {
      key: "carrier",
      title: "Carrier",
      render: (r) => r.carrier || "-",
    },
    {
      key: "actions",
      title: "Actions",
      render: (r) => (
        <button
          onClick={() => onOrderSelect?.(r.id)}
          className="text-blue-600 text-sm font-medium hover:text-blue-800"
        >
          Resume Packing
        </button>
      ),
    },
  ];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchOrders(1);
  };

  const handleResetFilters = () => {
    setFilters({
      date: "Today",
      warehouse: "",
      client: "",
      search: "",
    });
    setTimeout(() => fetchOrders(1), 0);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchOrders(newPage);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchOrders(1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const transformedData = transformOrderData(orders);

  return (
    <div className="space-y-6">
      <FilterBar
        filters={filterConfig}
        showActions
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <div className="rounded-lg border border-gray-200 bg-white">
        <CusTable columns={columns} data={transformedData} />

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} orders
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackingInProgress;

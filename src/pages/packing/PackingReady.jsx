// packing/PackingReady.jsx
import React, { useState, useEffect } from "react";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import http from "../../api/http";
import { Loader } from "lucide-react";
import { useToast } from "../components/toast/ToastProvider";

const PackingReady = ({ onOrderSelect }) => {
  const toast = useToast();
  const [filters, setFilters] = useState({
    date: "Today",
    warehouse: "",
    client: "",
    carrier: "All",
    priority: "All",
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

  const startPacking = async (id) => {
    try {
      const res = await http.post(`/packing/${id}/start`);
      toast.success(res?.data?.message);
      fetchOrders(1);
    } catch (e) {
      console.log(e?.response);
      toast.error(e?.response?.data?.message);
    }
  };

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await http.get("/sales-orders/", {
        params: {
          status: "PICKED",
          page: page,
          limit: pagination.limit,
          ...(filters.search && { search: filters.search }),
          ...(filters.priority !== "All" && {
            priority: filters.priority.toUpperCase(),
          }),
          ...(filters.client &&
            filters.client !== "All" && { client_id: filters.client }),
          ...(filters.warehouse &&
            filters.warehouse !== "All" && { warehouse_id: filters.warehouse }),
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

  useEffect(() => {
    fetchOrders(1);
  }, [filters.priority, filters.search]);

  const transformOrderData = (orders) => {
    return orders.map((order) => {
      const getSlaDueText = () => {
        if (!order.sla_due_date) return "No SLA";

        const dueDate = new Date(order.sla_due_date);
        const now = new Date();
        const diffHours = Math.floor((dueDate - now) / (1000 * 60 * 60));

        if (diffHours < 0) return `Overdue (${Math.abs(diffHours)}h)`;
        if (diffHours < 24)
          return `Today ${dueDate.getHours()}:${String(dueDate.getMinutes()).padStart(2, "0")}`;
        if (diffHours < 48)
          return `Tomorrow ${dueDate.getHours()}:${String(dueDate.getMinutes()).padStart(2, "0")}`;
        return dueDate.toLocaleDateString();
      };

      return {
        id: order.id,
        orderNo: order.order_no,
        client: order.client?.client_name || order.client_id,
        shipTo: `${order.ship_to_city}, ${order.ship_to_state}`,
        lines: order.total_lines || 0,
        unitsPicked: order.total_picked_units || 0,
        priority: order.priority || "NORMAL",
        status: order.status || "PICKED",
        slaDue: getSlaDueText(),
        originalOrder: order,
      };
    });
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
      options: ["All", "WH001", "WH002", "WH003"],
      className: "w-[140px]",
    },
    {
      key: "client",
      type: "select",
      label: "Client",
      value: filters.client,
      options: ["All", "1", "2", "3"],
      className: "w-[140px]",
    },
    {
      key: "carrier",
      type: "select",
      label: "Carrier",
      value: filters.carrier,
      options: ["All", "FedEx", "DHL", "UPS", "BlueDart"],
      className: "w-[120px]",
    },
    {
      key: "priority",
      type: "select",
      label: "Priority",
      value: filters.priority,
      options: ["All", "HIGH", "NORMAL", "LOW"],
      className: "w-[120px]",
    },
    {
      key: "search",
      type: "search",
      label: "Search",
      value: filters.search,
      placeholder: "Order No / Reference / Customer",
      className: "w-[240px]",
    },
  ];

  const columns = [
    {
      key: "orderNo",
      title: "Order No",
      render: (r) => (
        <button
          onClick={() => onOrderSelect?.(r.orderNo)}
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
      title: "Ship-to",
      render: (r) => r.shipTo || "-",
    },
    {
      key: "lines",
      title: "Lines",
      render: (r) => r.lines || 0,
    },
    {
      key: "unitsPicked",
      title: "Units Picked",
      render: (r) => r.unitsPicked || 0,
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
      render: (r) => (
        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-700">
          {r.status}
        </span>
      ),
    },
    {
      key: "slaDue",
      title: "SLA Due",
      render: (r) => (
        <span
          className={`font-medium ${
            r.slaDue.includes("Overdue")
              ? "text-red-600"
              : r.slaDue.includes("Today")
                ? "text-orange-600"
                : "text-gray-600"
          }`}
        >
          {r.slaDue}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (r) => (
        <>
          {/* <button
            onClick={() => onOrderSelect?.(r.orderNo)}
            className="text-blue-600 text-sm font-medium hover:text-blue-800"
          >
            Pack Now
          </button> */}
          <button
            className="text-blue-600 text-sm font-medium hover:text-blue-800"
            onClick={() => startPacking(r?.id)}
          >
            Start Packing
          </button>
        </>
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
      carrier: "All",
      priority: "All",
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

export default PackingReady;

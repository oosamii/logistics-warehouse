// packing/PackingCompleted.jsx
import React, { useState, useEffect } from "react";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import { Truck, Loader } from "lucide-react";
import http from "../../api/http";

const PackingCompleted = ({ onOrderSelect }) => {
  const [filters, setFilters] = useState({
    date: "Today",
    warehouse: "",
    client: "",
    carrier: "All",
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
          status: "PACKED",
          page: page,
          limit: pagination.limit,
          ...(filters.search && { search: filters.search }),
          ...(filters.warehouse &&
            filters.warehouse !== "All" && { warehouse_id: filters.warehouse }),
          ...(filters.client &&
            filters.client !== "All" && { client_id: filters.client }),
          ...(filters.carrier &&
            filters.carrier !== "All" && { carrier: filters.carrier }),
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
  }, [filters.search, filters.warehouse, filters.client, filters.carrier]);

  // Transform API data to match table structure
  const transformOrderData = (orders) => {
    return orders.map((order) => {
      // Calculate cartons count (this would ideally come from a cartons API)
      // For now, we'll estimate based on packed units or use a placeholder
      const cartonsCount =
        order.cartons_count ||
        Math.ceil(parseFloat(order.total_packed_units || 0) / 10) ||
        1;

      // Calculate total weight from line items if available
      const totalWeight =
        order.lines?.reduce((sum, line) => {
          const lineWeight =
            parseFloat(line.sku?.weight || 0) *
            parseFloat(line.packed_qty || 0);
          return sum + lineWeight;
        }, 0) || 0;

      // Format packing completed time
      const formatCompletedTime = () => {
        if (!order.packing_completed_at) return "-";

        const completedDate = new Date(order.packing_completed_at);
        const now = new Date();
        const isToday = completedDate.toDateString() === now.toDateString();

        if (isToday) {
          return `Today ${completedDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
        } else {
          return completedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }
      };

      return {
        id: order.id,
        orderNo: order.order_no,
        client: order.client?.client_name || `Client #${order.client_id}`,
        warehouse:
          order.warehouse?.warehouse_code || `WH-${order.warehouse_id}`,
        cartons: cartonsCount,
        totalWeight: totalWeight > 0 ? `${totalWeight.toFixed(1)} kg` : "-",
        carrier: order.carrier || "Not Assigned",
        status: order.status || "PACKED",
        completedAt: formatCompletedTime(),
        packedUnits: parseFloat(order.total_packed_units) || 0,
        totalUnits: parseFloat(order.total_ordered_units) || 0,
        customerName: order.customer_name,
        shipToCity: order.ship_to_city,
        referenceNo: order.reference_no,
        trackingNumber: order.tracking_number,
        originalOrder: order,
      };
    });
  };

  // Get unique filter options from data
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

  const getCarrierOptions = () => {
    const uniqueCarriers = [
      ...new Set(
        orders.map((o) => o.carrier || "Not Assigned").filter(Boolean),
      ),
    ];
    return ["All", ...uniqueCarriers];
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
      key: "carrier",
      type: "select",
      label: "Carrier",
      value: filters.carrier,
      options: getCarrierOptions(),
      className: "w-[120px]",
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
      key: "cartons",
      title: "Cartons",
      render: (r) => r.cartons || "-",
    },
    {
      key: "totalWeight",
      title: "Total Weight",
      render: (r) => r.totalWeight || "-",
    },
    {
      key: "carrier",
      title: "Carrier",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-gray-500" />
          <span>{r.carrier}</span>
        </div>
      ),
    },
    {
      key: "completedAt",
      title: "Completed At",
      render: (r) => (
        <span className="text-sm text-gray-600">{r.completedAt}</span>
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
      key: "actions",
      title: "Actions",
      render: (r) => (
        <button
          onClick={() => onOrderSelect?.(r.id)}
          className="text-blue-600 text-sm font-medium hover:text-blue-800"
        >
          Open Shipping
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
      carrier: "All",
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
        <span className="ml-2 text-gray-600">Loading packed orders...</span>
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

        {/* Pagination */}
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

        {/* Show message when no data */}
        {transformedData.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No packed orders found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackingCompleted;

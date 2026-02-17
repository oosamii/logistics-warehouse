// hooks/useSalesOrders.js
import { useEffect, useMemo, useState } from "react";
import http from "@/api/http";

export function useSalesOrders(toast) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState([]);
  const [dropdownData, setDropdownData] = useState({
    warehouses: [],
    clients: [],
  });

  const [f, setF] = useState({
    warehouse_id: "All",
    client_id: "All",
    status: "All",
    page: 1,
    limit: 10,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });

  // Fetch dropdown data on mount
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    if (dropdownData.warehouses.length > 0) {
      fetchSalesOrders();
      fetchStats();
    }
  }, [f.warehouse_id, f.client_id, f.status, f.page, f.limit, dropdownData]);

  const fetchDropdownData = async () => {
    try {
      // Fetch warehouses
      const warehousesRes = await http.get("/warehouses");
      const warehouses = warehousesRes.data?.success
        ? warehousesRes.data.data || []
        : [];
      // Fetch clients (you might need to adjust this endpoint)
      const clientsRes = await http.get("/clients");
      const clients = clientsRes.data?.success
        ? clientsRes?.data?.data?.clients || []
        : [];

      // Transform data for dropdowns
      const warehousesOptions = [
        { value: "All", label: "All Warehouses" },
        ...warehouses.map((w) => ({
          value: String(w.id),
          label: `${w.warehouse_code} - ${w.warehouse_name}`,
        })),
      ];
      const clientsOptions = [
        { value: "All", label: "All Clients" },
        ...clients.map((c) => ({
          value: String(c.id),
          label: `${c.client_code} - ${c.client_name}`,
        })),
      ];

      setDropdownData({
        warehouses: warehousesOptions,
        clients: clientsOptions,
      });

      // Auto-select first warehouse if available
      if (warehousesOptions.length > 1) {
        setF((prev) => ({
          ...prev,
          warehouse_id: warehousesOptions[1].value,
        }));
      }
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      setDropdownData({
        warehouses: [{ value: "All", label: "All Warehouses" }],
        clients: [{ value: "All", label: "All Clients" }],
      });
    }
  };

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      // Only add if not "All"
      if (f.warehouse_id !== "All") {
        params.append("warehouse_id", f.warehouse_id);
      }

      if (f.client_id !== "All") {
        params.append("client_id", f.client_id);
      }

      if (f.status !== "All") {
        params.append("status", f.status);
      }

      params.append("page", f.page);
      params.append("limit", f.limit);

      const url = `/sales-orders/?${params.toString()}`;

      const res = await http.get(url);

      if (res.data) {
        const orders = res.data.orders || [];
        setData(orders);

        // Update pagination from API response
        setPagination({
          total: res.data.total || 0,
          page: res.data.page || f.page,
          limit: res.data.pages ? res.data.limit : f.limit,
          pages: res.data.pages || 1,
        });
      } else {
        setData([]);
        setPagination({
          total: 0,
          page: 1,
          limit: f.limit,
          pages: 1,
        });
      }
    } catch (e) {
      console.error("Sales orders error:", e);
      setData([]);
      toast?.error?.(
        e.response?.data?.message || "Failed to load sales orders",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();

      if (f.warehouse_id !== "All") {
        params.append("warehouse_id", f.warehouse_id);
      }

      if (f.client_id !== "All") {
        params.append("client_id", f.client_id);
      }

      const url = `/sales-orders/stats?${params.toString()}`;
      const res = await http.get(url);

      if (res.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.error("Stats error:", e);
      setStats([]);
    }
  };

  const handlePageChange = (newPage) => {
    setF((prev) => ({ ...prev, page: newPage }));
  };

  const filters = useMemo(
    () => [
      {
        key: "warehouse_id",
        type: "select",
        label: "Warehouse",
        value: f.warehouse_id,
        options: dropdownData.warehouses,
        className: "w-[200px]",
      },
      {
        key: "client_id",
        type: "select",
        label: "Client",
        value: f.client_id,
        options: dropdownData.clients,
        className: "w-[200px]",
      },
      {
        key: "status",
        type: "select",
        label: "Status",
        value: f.status,
        options: [
          { value: "All", label: "All Statuses" },
          { value: "DRAFT", label: "Draft" },
          { value: "CONFIRMED", label: "Confirmed" },
          { value: "ALLOCATED", label: "Allocated" },
          { value: "PICKING", label: "Picking" },
          { value: "PICKED", label: "Picked" },
          { value: "PACKING", label: "Packing" },
          { value: "PACKED", label: "Packed" },
          { value: "SHIPPED", label: "Shipped" },
          { value: "DELIVERED", label: "Delivered" },
          { value: "CANCELLED", label: "Cancelled" },
        ],
        className: "w-[180px]",
      },
    ],
    [f, dropdownData],
  );

  return {
    loading,
    f,
    setF,
    filters,
    data,
    stats,
    pagination,
    refresh: fetchSalesOrders,
    handlePageChange,
  };
}

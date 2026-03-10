// useStockBySku.js
import { useEffect, useMemo, useState } from "react";
import http from "@/api/http";
import { toNum } from "../../inventoryFormatters";

const STATUS_MAP = {
  Healthy: "HEALTHY",
  "Low Stock": "LOW_STOCK",
  "Expiry Risk": "EXPIRY_RISK",
  "QC Hold": "HOLD",
  "Out of Stock": "OUT_OF_STOCK",
  Damaged: "DAMAGED",
};

const REVERSE_STATUS_MAP = {
  HEALTHY: "Healthy",
  LOW_STOCK: "Low Stock",
  EXPIRY_RISK: "Expiry Risk",
  HOLD: "QC Hold",
  DAMAGED: "Damaged",
  OUT_OF_STOCK: "Out of Stock",
};

export function useStockBySku(toast) {
  const [loading, setLoading] = useState(true);
  const [skuData, setSkuData] = useState([]); // This will hold the aggregated SKU data
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 20,
  });
  const [summary, setSummary] = useState({
    total_on_hand: 0,
    total_available: 0,
    total_hold: 0,
    total_allocated: 0,
    total_damaged: 0,
    total_skus: 0,
  });

  const [f, setF] = useState({
    warehouse: "All",
    client: "All",
    skuSearch: "",
    stockStatus: "All",
  });

  const [warehouses, setWarehouses] = useState([
    { value: "All", label: "All Warehouses" },
  ]);
  const [clients, setClients] = useState(["All"]);
  const [statuses, setStatuses] = useState(["All"]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [f.warehouse, f.client, f.stockStatus, f.skuSearch]);

  useEffect(() => {
    fetchSkuData();
  }, [f.warehouse, f.client, f.stockStatus, f.skuSearch, page]);

  const fetchInitialData = async () => {
    try {
      await Promise.all([fetchWarehouses(), fetchClients()]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await http.get("/warehouses");
      if (res.data?.success) {
        const list = res.data.data || [];
        const options = [
          { value: "All", label: "All Warehouses" },
          ...list.map((w) => {
            return {
              value: String(w.id),
              label: `${w.warehouse_code} - ${w.warehouse_name}`,
            };
          }),
        ];
        setWarehouses(options);
      }
    } catch (e) {
      console.error(e);
      toast?.error?.("Failed to load warehouses");
    }
  };

  const fetchClients = async () => {
    try {
      const res = await http.get("/clients");
      if (res.data?.success) {
        const data = res.data.data || {};
        const clientsList = data.clients || data || [];
        const clientOptions = [
          "All",
          ...clientsList.map((c) => c.client_name || String(c)),
        ];
        setClients(clientOptions);
      }
    } catch (e) {
      console.error(e);
      toast?.error?.("Failed to load clients");
    }
  };

  const fetchStatusOptions = (skuItems) => {
    const uniqueStatuses = new Set(["All"]);
    skuItems.forEach((item) => {
      if (item.status) {
        const displayStatus = REVERSE_STATUS_MAP[item.status] || item.status;
        uniqueStatuses.add(displayStatus);
      }
    });
    setStatuses(Array.from(uniqueStatuses));
  };

  const fetchSkuData = async () => {
    try {
      setLoading(true);

      // Build query parameters for the group-by-sku endpoint
      const params = new URLSearchParams();

      if (f.warehouse !== "All") {
        params.append("warehouse_id", f.warehouse);
      }
      if (f.client !== "All") {
        params.append("client_id", f.client);
      }
      if (f.stockStatus !== "All") {
        const statusValue =
          STATUS_MAP[f.stockStatus] || f.stockStatus.toUpperCase();
        params.append("status", statusValue);
      }
      if (f.skuSearch) {
        params.append("search", f.skuSearch);
      }

      // Pagination
      params.append("page", String(page));
      params.append("limit", String(pagination.limit));

      // Use the group-by-sku endpoint
      const url = `/inventory/group-by-sku${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await http.get(url);

      if (res.data?.success) {
        const skuItems = res.data.data || [];

        // Set the SKU data
        setSkuData(skuItems);

        // Calculate summary from the data
        const calculatedSummary = calculateSummary(skuItems);
        setSummary(calculatedSummary);

        // Update status options based on data
        fetchStatusOptions(skuItems);

        // Update pagination
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        } else {
          // Calculate client-side pagination
          setPagination((prev) => ({
            ...prev,
            page: page,
            total: skuItems.length,
            pages: Math.ceil(skuItems.length / prev.limit),
          }));
        }
      } else {
        throw new Error("API did not return success");
      }
    } catch (e) {
      console.error("Error fetching SKU data:", e);
      toast?.error?.(e.response?.data?.message || "Failed to load SKU data");
      setSkuData([]);
      setSummary({
        total_on_hand: 0,
        total_available: 0,
        total_hold: 0,
        total_allocated: 0,
        total_damaged: 0,
        total_skus: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (skuItems) => {
    let total_on_hand = 0;
    let total_available = 0;
    let total_hold = 0;
    let total_allocated = 0;
    let total_damaged = 0;

    skuItems.forEach((item) => {
      total_on_hand += toNum(item.total_on_hand);
      total_available += toNum(item.total_available);
      total_hold += toNum(item.total_hold);
      total_allocated += toNum(item.total_allocated);
      total_damaged += toNum(item.total_damaged);
    });

    return {
      total_on_hand,
      total_available,
      total_hold,
      total_allocated,
      total_damaged,
      total_skus: skuItems.length,
    };
  };

  // Apply filters to the SKU data
  const filteredSkuData = useMemo(() => {
    let filtered = [...skuData];

    if (f.warehouse !== "All") {
      // Note: You might need to add warehouse_id to the group-by-sku response
      // For now, we'll skip this filter if warehouse_id is not in the response
      filtered = filtered.filter((item) =>
        item.warehouse_id ? String(item.warehouse_id) === f.warehouse : true,
      );
    }

    if (f.client !== "All") {
      // Note: You might need to add client_id to the group-by-sku response
      filtered = filtered.filter((item) =>
        item.client_id ? String(item.client_id) === f.client : true,
      );
    }

    if (f.stockStatus !== "All") {
      const statusValue =
        STATUS_MAP[f.stockStatus] || f.stockStatus.toUpperCase();
      filtered = filtered.filter(
        (item) =>
          item.status === statusValue ||
          REVERSE_STATUS_MAP[item.status] === f.stockStatus,
      );
    }

    if (f.skuSearch) {
      const searchLower = f.skuSearch.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.sku?.sku_code?.toLowerCase().includes(searchLower) ||
          item.sku?.sku_name?.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [skuData, f]);

  // Transform data for table with pagination
  const tableData = useMemo(() => {
    // Apply pagination to filtered data
    const start = (page - 1) * pagination.limit;
    const end = start + pagination.limit;
    const paginatedData = filteredSkuData.slice(start, end);

    return paginatedData.reverse().map((item) => {
      const displayStatus = REVERSE_STATUS_MAP[item.status] || item.status;

      return {
        id: item.sku_id,
        sku: item.sku?.sku_code || "-",
        name: item.sku?.sku_name || "-",
        category: item.sku?.category || "-",
        uom: item.sku?.uom || "-",
        onHand: toNum(item.total_on_hand).toLocaleString(),
        available: toNum(item.total_available).toLocaleString(),
        hold: toNum(item.total_hold).toLocaleString(),
        allocated: toNum(item.total_allocated).toLocaleString(),
        damaged: toNum(item.total_damaged).toLocaleString(),
        locations: "Multiple Locations",
        batch: item.nearest_expiry
          ? new Date(item.nearest_expiry).toLocaleDateString()
          : "No Expiry",
        risk: displayStatus,
        img: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          item.sku?.sku_code || "SKU",
        )}&background=random&color=fff`,
        raw: item,
      };
    });
  }, [filteredSkuData, page, pagination.limit]);

  const filters = useMemo(
    () => [
      {
        key: "warehouse",
        type: "select",
        label: "Warehouse",
        value: f.warehouse,
        options: warehouses.map((w) => ({
          value: w.value,
          label: w.label,
        })),
        className: "w-[240px]",
      },
      {
        key: "client",
        type: "select",
        label: "Client",
        value: f.client,
        options: clients.map((client) => ({
          value: client === "All" ? "All" : "1",
          label: client,
        })),
        className: "w-[180px]",
      },
      {
        key: "stockStatus",
        type: "select",
        label: "Stock Status",
        value: f.stockStatus,
        options: statuses.map((status) => ({
          value: status,
          label: status === "All" ? "All Statuses" : status,
        })),
        className: "w-[160px]",
      },
      {
        key: "skuSearch",
        type: "search",
        label: "SKU Search",
        value: f.skuSearch,
        placeholder: "Search SKU Code or Name...",
        className: "w-[260px]",
      },
    ],
    [clients, f, warehouses, statuses],
  );

  const resetFilters = () =>
    setF({
      warehouse: "All",
      client: "All",
      skuSearch: "",
      stockStatus: "All",
    });

  return {
    loading,
    f,
    setF,
    filters,
    resetFilters,
    warehouses,
    skuData,
    summary,
    tableData,
    refresh: fetchSkuData,
    pagination: {
      ...pagination,
      total: filteredSkuData.length,
      pages: Math.ceil(filteredSkuData.length / pagination.limit),
    },
    page,
    setPage,
  };
}

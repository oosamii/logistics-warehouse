import React, { useState, useEffect } from "react";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import http from "../../api/http";
import DispatchModal from "./DispatchModal";

const ShipmentsInTransit = ({
  initialData = [],
  onFilterChange,
  onReset,
  onApply,
  onOpenShipment,
}) => {
  const [filters, setFilters] = useState({
    date: "This Week",
    warehouse: "All",
    client: "All",
    carrier: "All",
    status: "All",
    search: "",
  });

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  });
  
  // Dispatch modal state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [dispatchLoading, setDispatchLoading] = useState(false);

  const filterConfig = [
    {
      key: "date",
      label: "Date",
      value: filters.date,
      options: ["Today", "Yesterday", "This Week", "This Month", "All"],
    },
    {
      key: "warehouse",
      label: "Warehouse",
      value: filters.warehouse,
      options: ["All", "WH-NYC-01", "WH-LA-02", "WH-CHI-03"],
    },
    {
      key: "client",
      label: "Client",
      value: filters.client,
      options: ["All", "Acme Corp", "Global Inc", "Tech Solutions"],
    },
    {
      key: "carrier",
      label: "Carrier",
      value: filters.carrier,
      options: ["All", "FedEx", "DHL", "UPS", "Own Fleet"],
    },
    {
      key: "status",
      label: "Status",
      value: filters.status,
      options: ["All", "CREATED", "DISPATCHED", "DELAYED", "IN_TRANSIT"],
    },
    {
      key: "search",
      type: "search",
      label: "Search",
      placeholder: "Order No / Shipment ID / AV",
      value: filters.search,
      className: "min-w-[300px]",
    },
  ];

  const columns = [
    { 
      key: "shipment_no", 
      title: "Shipment ID",
      render: (row) => <span className="font-medium">{row.shipment_no}</span>
    },
    { 
      key: "carrier", 
      title: "Carrier",
      render: (row) => row.Carrier?.carrier_name || "-"
    },
    { 
      key: "awb_no", 
      title: "AWB / Tracking" 
    },
    { 
      key: "orders", 
      title: "Orders",
      render: (row) => row.SalesOrder?.order_no || "-"
    },
    { 
      key: "total_cartons", 
      title: "Cartons" 
    },
    { 
      key: "dispatchTime", 
      title: "Dispatch Time",
      render: (row) => row.dispatched_at ? new Date(row.dispatched_at).toLocaleString() : "-"
    },
    { 
      key: "lastScan", 
      title: "Last Scan",
      render: (row) => row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"
    },
    {
      key: "status",
      title: "Status",
      render: (row) => {
        const statusColors = {
          "CREATED": "bg-gray-100 text-gray-700",
          "DISPATCHED": "bg-amber-100 text-amber-700",
          "IN_TRANSIT": "bg-blue-100 text-blue-700",
          "DELAYED": "bg-red-100 text-red-700",
          "DELIVERED": "bg-green-100 text-green-700",
        };
        return (
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColors[row.status] || "bg-gray-100 text-gray-700"}`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => onOpenShipment?.(row.id)}
            className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            <span>🔍</span> View
          </button>
          
          {/* Show Dispatch button only for CREATED status */}
          {row.status === "CREATED" && (
            <button
              onClick={() => handleOpenDispatchModal(row)}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
            >
              <span>🚚</span> Dispatch
            </button>
          )}
        </div>
      ),
    },
  ];

  // Handle opening dispatch modal
  const handleOpenDispatchModal = (shipment) => {
    setSelectedShipment(shipment);
    setShowDispatchModal(true);
  };

  // Handle dispatch confirmation
  const handleDispatch = async (dispatchData) => {
    setDispatchLoading(true);
    try {
      const response = await http.post(`/shipping/${selectedShipment.id}/dispatch`, dispatchData);
      
      if (response.data.success) {
        // Refresh the data
        fetchShipments();
        setShowDispatchModal(false);
        setSelectedShipment(null);
        // Show success message (you can add a toast notification here)
        console.log("Shipment dispatched successfully");
      }
    } catch (error) {
      console.error("Error dispatching shipment:", error);
      // Show error message
    } finally {
      setDispatchLoading(false);
    }
  };

  // Fetch shipments data
  const fetchShipments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (filters.status !== "All") params.append("status", filters.status);
      if (filters.carrier !== "All") params.append("carrier", filters.carrier);
      if (filters.warehouse !== "All") params.append("warehouse", filters.warehouse);
      if (filters.client !== "All") params.append("client", filters.client);
      if (filters.search) params.append("search", filters.search);
      
      if (filters.date !== "All") {
        params.append("date_range", filters.date.toLowerCase().replace(" ", "_"));
      }

      const response = await http.get(`/shipping/?${params.toString()}`);
      
      if (response.data.success) {
        setData(response.data.data.shipments);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching shipments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when filters/pagination changes
  useEffect(() => {
    fetchShipments();
  }, [filters, pagination.page]);

  const handleLocalFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
    onFilterChange?.(key, value);
  };

  const handleReset = () => {
    const defaultFilters = {
      date: "This Week",
      warehouse: "All",
      client: "All",
      carrier: "All",
      status: "All",
      search: "",
    };
    setFilters(defaultFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    onReset?.();
  };

  const handleApply = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    onApply?.(filters);
    fetchShipments();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-4">
      <FilterBar
        filters={filterConfig}
        onFilterChange={handleLocalFilterChange}
        onReset={handleReset}
        onApply={handleApply}
      />
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          <CusTable columns={columns} data={data} />
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4 px-4">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && selectedShipment && (
        <DispatchModal
          shipment={selectedShipment}
          onClose={() => {
            setShowDispatchModal(false);
            setSelectedShipment(null);
          }}
          onDispatch={handleDispatch}
          loading={dispatchLoading}
        />
      )}
    </div>
  );
};

export default ShipmentsInTransit;
// shipping/ReadyToShip.jsx
import React, { useState, useEffect } from "react";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import { Loader, X } from "lucide-react";
import http from "../../api/http";

// Create Shipment Modal Component
const CreateShipmentModal = ({ order, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    carrier_id: "",
    awb_no: "",
    shipping_method: "STANDARD",
    estimated_delivery_date: "",
    shipping_cost: "",
    notes: ""
  });
  
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch carriers on mount
  useEffect(() => {
    const fetchCarriers = async () => {
      setLoading(true);
      try {
        const response = await http.get('/carriers/');
        if (response.data?.success) {
          setCarriers(response.data.data.carriers || []);
        }
      } catch (err) {
        console.error("Error fetching carriers:", err);
        setError("Failed to load carriers");
      } finally {
        setLoading(false);
      }
    };
    fetchCarriers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Extract numeric ID from order number (e.g., "SO-00014" -> 14)
      const numericId = order.orderNo.toString().replace(/\D/g, '');
      
      const response = await http.post(`/shipping/${numericId}/create`, formData);
      
      if (response.data?.success) {
        onSuccess?.(response.data.data);
        onClose();
      }
    } catch (err) {
      console.error("Error creating shipment:", err);
      setError(err.response?.data?.message || "Failed to create shipment");
    } finally {
      setSubmitting(false);
    }
  };

  const shippingMethods = [
    { value: "STANDARD", label: "Standard" },
    { value: "EXPRESS", label: "Express" },
    { value: "SAME_DAY", label: "Same Day" },
    { value: "ECONOMY", label: "Economy" },
  ];

  // Set tomorrow as min date for estimated delivery
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Shipment for {order?.orderNo}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Order Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Customer:</span>
                <span className="ml-2 text-gray-900">{order?.customerName}</span>
              </div>
              <div>
                <span className="text-gray-500">Ship To:</span>
                <span className="ml-2 text-gray-900">{order?.shipTo}</span>
              </div>
              <div>
                <span className="text-gray-500">Cartons:</span>
                <span className="ml-2 text-gray-900">{order?.cartons}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Weight:</span>
                <span className="ml-2 text-gray-900">{order?.totalWeight}</span>
              </div>
            </div>
          </div>

          {/* Carrier Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carrier <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader size={16} className="animate-spin" />
                Loading carriers...
              </div>
            ) : (
              <select
                required
                value={formData.carrier_id}
                onChange={(e) => setFormData({...formData, carrier_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Carrier</option>
                {carriers.map(carrier => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.carrier_name} - {carrier.carrier_code}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* AWB Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AWB Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.awb_no}
              onChange={(e) => setFormData({...formData, awb_no: e.target.value})}
              placeholder="Enter AWB number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Shipping Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Method <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.shipping_method}
              onChange={(e) => setFormData({...formData, shipping_method: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {shippingMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Estimated Delivery Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Delivery Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              min={minDate}
              value={formData.estimated_delivery_date}
              onChange={(e) => setFormData({...formData, estimated_delivery_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Shipping Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Cost <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.shipping_cost}
              onChange={(e) => setFormData({...formData, shipping_cost: e.target.value})}
              placeholder="Enter shipping cost"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
              placeholder="Enter any special instructions or notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Shipment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReadyToShip = ({ onOpenShipment, onFilterChange, onReset, onApply }) => {
  const [filters, setFilters] = useState({
    date: "Today",
    warehouse: "",
    client: "",
    carrier: "All",
    status: "All",
    search: "",
  });
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch orders from API - only orders with status PACKED and no shipments
  const fetchOrders = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      // First, fetch all PACKED orders
      const response = await http.get('/sales-orders/', {
        params: {
          status: 'PACKED',
          page: page,
          limit: pagination.limit,
          ...(filters.search && { search: filters.search }),
          ...(filters.warehouse && filters.warehouse !== 'All' && { warehouse_id: filters.warehouse }),
          ...(filters.client && filters.client !== 'All' && { client_id: filters.client }),
          ...(filters.carrier && filters.carrier !== 'All' && { carrier: filters.carrier })
        }
      });

      if (response.data) {
        const packedOrders = response.data.orders || [];
        
        // Filter out orders that already have shipments
        // We need to check each order if it has a shipment
        // Since the API doesn't provide this info directly, we'll need to check the shipments endpoint
        // For now, we'll assume orders with total_shipped_units > 0 have shipments
        // You may need to adjust this based on your actual API
        
        const ordersWithoutShipments = packedOrders.filter(order => {
          // If total_shipped_units is 0, no shipment has been created
          return parseFloat(order.total_shipped_units || 0) === 0;
        });

        setOrders(ordersWithoutShipments);
        
        // Update pagination based on filtered results
        // Note: This is approximate since we're filtering client-side
        // Ideally, the API should support filtering by shipment status
        setPagination({
          total: response.data.total || 0,
          page: response.data.page || 1,
          pages: response.data.pages || 1,
          limit: pagination.limit,
          filteredTotal: ordersWithoutShipments.length
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
    return orders.map(order => {
      // Calculate total weight from line items
      const totalWeight = order.lines?.reduce((sum, line) => {
        const lineWeight = parseFloat(line.sku?.weight || 0) * parseFloat(line.packed_qty || 0);
        return sum + lineWeight;
      }, 0) || 0;

      // Calculate cartons count (estimated)
      const cartonsCount = order.cartons_count || Math.ceil(parseFloat(order.total_packed_units || 0) / 10) || 1;

      // Format SLA due date
      const formatSlaDue = () => {
        if (!order.sla_due_date) return "No SLA";
        
        const dueDate = new Date(order.sla_due_date);
        const now = new Date();
        const diffHours = Math.floor((dueDate - now) / (1000 * 60 * 60));
        
        if (diffHours < 0) return `Overdue (${Math.abs(diffHours)}h)`;
        if (diffHours < 24) return `Today ${dueDate.getHours()}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
        if (diffHours < 48) return `Tomorrow ${dueDate.getHours()}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
        return dueDate.toLocaleDateString();
      };

      // Format ship to location
      const shipTo = `${order.ship_to_city || ''}, ${order.ship_to_state || ''}`.replace(/^, |, $/g, '') || 'Address not available';

      return {
        id: order.id,
        orderNo: order.order_no,
        client: order.client?.client_name || `Client #${order.client_id}`,
        shipTo: shipTo,
        cartons: cartonsCount,
        totalWeight: totalWeight > 0 ? `${totalWeight.toFixed(1)} kg` : "-",
        carrier: order.carrier || "Not Assigned",
        slaDue: formatSlaDue(),
        status: order.status || "PACKED",
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        referenceNo: order.reference_no,
        packedUnits: parseFloat(order.total_packed_units) || 0,
        shippedUnits: parseFloat(order.total_shipped_units) || 0,
        warehouse: order.warehouse?.warehouse_name,
        hasShipment: parseFloat(order.total_shipped_units || 0) > 0,
        originalOrder: order
      };
    });
  };

  // Handle opening shipment modal
  const handleOpenShipmentModal = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  // Handle successful shipment creation
  const handleShipmentSuccess = (shipmentData) => {
    // Refresh the orders list to remove the order that just got a shipment
    fetchOrders(pagination.page);
    console.log("Shipment created successfully:", shipmentData);
  };

  // Get unique filter options from data
  const getWarehouseOptions = () => {
    const uniqueWarehouses = [...new Set(orders.map(o => o.warehouse?.warehouse_code || `WH-${o.warehouse_id}`))];
    return ['All', ...uniqueWarehouses];
  };

  const getClientOptions = () => {
    const uniqueClients = [...new Set(orders.map(o => o.client?.client_name || `Client #${o.client_id}`))];
    return ['All', ...uniqueClients];
  };

  const getCarrierOptions = () => {
    const uniqueCarriers = [...new Set(orders.map(o => o.carrier || 'Not Assigned').filter(Boolean))];
    return ['All', ...uniqueCarriers];
  };

  const filterConfig = [
    {
      key: "date",
      type: "select",
      label: "Date",
      value: filters.date,
      options: ["Today", "Yesterday", "This Week", "This Month"],
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
      key: "status",
      type: "select",
      label: "Status",
      value: filters.status,
      options: ["All", "PACKED", "READY"],
      className: "w-[120px]",
    },
    {
      key: "search",
      type: "search",
      label: "Search",
      placeholder: "Order No / Customer / Reference",
      value: filters.search,
      className: "w-[240px]",
    },
  ];

  const columns = [
    { 
      key: "orderNo", 
      title: "Order No",
      render: (row) => (
        <button
          onClick={() => onOpenShipment?.(row.orderNo)}
          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-left"
        >
          {row.orderNo}
        </button>
      ),
    },
    { 
      key: "client", 
      title: "Client",
      render: (row) => row.client || "-"
    },
    { 
      key: "shipTo", 
      title: "Ship-to",
      render: (row) => row.shipTo || "-"
    },
    { 
      key: "cartons", 
      title: "Cartons",
      render: (row) => row.cartons || "-"
    },
    { 
      key: "totalWeight", 
      title: "Total Weight",
      render: (row) => row.totalWeight || "-"
    },
    { 
      key: "carrier", 
      title: "Carrier",
      render: (row) => row.carrier || "-"
    },
    { 
      key: "slaDue", 
      title: "SLA Due",
      render: (row) => (
        <span
          className={`font-medium ${
            row.slaDue.includes("Overdue")
              ? "text-red-600"
              : row.slaDue.includes("Today")
                ? "text-orange-600"
                : "text-gray-600"
          }`}
        >
          {row.slaDue}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-700">
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <button
          onClick={() => handleOpenShipmentModal(row)}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-xs text-white hover:bg-blue-700"
          disabled={row.hasShipment}
        >
          {row.hasShipment ? 'Shipped' : 'Create Shipment'}
        </button>
      ),
    },
  ];

  const handleLocalFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    onFilterChange?.(key, value);
  };

  const handleReset = () => {
    const defaultFilters = {
      date: "Today",
      warehouse: "",
      client: "",
      carrier: "All",
      status: "All",
      search: "",
    };
    setFilters(defaultFilters);
    onReset?.();
    setTimeout(() => fetchOrders(1), 0);
  };

  const handleApply = () => {
    onApply?.(filters);
    fetchOrders(1);
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
        onFilterChange={handleLocalFilterChange}
        onReset={handleReset}
        onApply={handleApply}
      />
      
      <div className="rounded-lg border border-gray-200 bg-white">
        <CusTable columns={columns} data={transformedData} />
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
              {pagination.filteredTotal !== undefined && (
                <span className="text-gray-500 ml-2">
                  ({pagination.filteredTotal} ready to ship)
                </span>
              )}
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
            <p className="text-gray-500">No orders ready to ship</p>
          </div>
        )}
      </div>

      {/* Create Shipment Modal */}
      {showModal && selectedOrder && (
        <CreateShipmentModal
          order={selectedOrder}
          onClose={() => {
            setShowModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={handleShipmentSuccess}
        />
      )}
    </div>
  );
};

export default ReadyToShip;
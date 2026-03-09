// Dashboard.jsx (updated to pass warehouseId to DashboardQueue)
import { useState, useEffect } from "react";
import { Download, Boxes, Upload } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import SectionHeader from "../components/SectionHeader";
import DashboardQueue from "./DashboardQueue";
import http from "../../api/http";
import { useNavigate } from "react-router-dom";
import { useAccess } from "../utils/useAccess";
 
const Dashboard = () => {
  const navigate = useNavigate();
  const dashboardAccess = useAccess("DASHBOARD");
  const inboundAccess = useAccess("INBOUND");
  const inventoryAccess = useAccess("INVENTORY");
  const outboundAccess = useAccess("OUTBOUND");
 
  // Redirect if no read access to dashboard
  useEffect(() => {
    if (!dashboardAccess.loading && !dashboardAccess.canRead) {
      navigate("/unauthorized");
    }
  }, [dashboardAccess.loading, dashboardAccess.canRead, navigate]);
  const [inboundStats, setInboundStats] = useState({
    confirmed: "0",
    inReceiving: "0",
    putawayPending: "0",
    closed: "0",
    grnPosted: "0",
  });
 
  const [inventoryStats, setInventoryStats] = useState({
    onHandSkus: "0",
    availableQty: "0",
    blockedHold: "0",
    lowStockAlerts: "0",
  });
 
  const [outboundStats, setOutboundStats] = useState({
    ordersPending: "0",
    pickingPending: "0",
    packedReady: "0",
    shippedToday: "0",
  });
 
  const [loading, setLoading] = useState({
    inbound: true,
    inventory: true,
    outbound: true,
  });
 
  const [error, setError] = useState({
    inbound: null,
    inventory: null,
    outbound: null,
  });
 
  const [selectedWarehouse, setSelectedWarehouse] = useState("1"); // Default warehouse ID
 
  // Fetch data based on permissions when warehouse changes
  useEffect(() => {
    if (inboundAccess.canRead) {
      fetchInboundStats();
    }
    if (inventoryAccess.canRead) {
      fetchInventoryStats();
    }
    if (outboundAccess.canRead) {
      fetchOutboundStats();
    }
  }, [
    selectedWarehouse,
    inboundAccess.canRead,
    inventoryAccess.canRead,
    outboundAccess.canRead,
  ]);
 
  const fetchInboundStats = async () => {
    setLoading((prev) => ({ ...prev, inbound: true }));
    setError((prev) => ({ ...prev, inbound: null }));
 
    try {
      const response = await http.get(
        `/asns/stats?warehouse_id=${selectedWarehouse}`,
      );
 
      if (response.data.success) {
        const data = response.data.data;
        setInboundStats({
          confirmed: data.CONFIRMED?.toString() || "0",
          inReceiving: data.IN_RECEIVING?.toString() || "0",
          putawayPending: data.PUTAWAY_PENDING?.toString() || "0",
          closed: data.CLOSED?.toString() || "0",
          grnPosted: data.GRN_POSTED?.toString() || "0",
        });
      }
    } catch (err) {
      console.error("Error fetching inbound stats:", err);
      setError((prev) => ({
        ...prev,
        inbound: "Failed to load inbound statistics",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, inbound: false }));
    }
  };
 
  const fetchInventoryStats = async () => {
    setLoading((prev) => ({ ...prev, inventory: true }));
    setError((prev) => ({ ...prev, inventory: null }));
 
    try {
      const response = await http.get(
        `/inventory/summary?warehouse_id=${selectedWarehouse}`,
      );
 
      if (response.data.success) {
        const data = response.data.data;
        setInventoryStats({
          // Fix: Use totals.total_on_hand instead of metrics.unique_skus
          onHandSkus: data.totals?.total_on_hand
            ? parseInt(data.totals.total_on_hand).toLocaleString()
            : "0",
          availableQty: data.totals?.total_available
            ? parseInt(data.totals.total_available).toLocaleString()
            : "0",
          blockedHold: data.totals?.total_hold
            ? parseInt(data.totals.total_hold).toLocaleString()
            : "0",
          lowStockAlerts: data.alerts?.low_stock?.toString() || "0",
        });
      }
    } catch (err) {
      console.error("Error fetching inventory stats:", err);
      setError((prev) => ({
        ...prev,
        inventory: "Failed to load inventory statistics",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, inventory: false }));
    }
  };
 
  const fetchOutboundStats = async () => {
    setLoading((prev) => ({ ...prev, outbound: true }));
    setError((prev) => ({ ...prev, outbound: null }));
 
    try {
      const response = await http.get(
        `/sales-orders/outbound-summary?warehouse_id=${selectedWarehouse}`,
      );
 
      if (response.data.success) {
        const data = response.data.data;
        setOutboundStats({
          ordersPending: data.orders_pending?.toString() || "0",
          pickingPending: data.picking_pending?.toString() || "0",
          packedReady: data.packed_ready?.toString() || "0",
          shippedToday: data.shipped_today?.toString() || "0",
        });
      }
    } catch (err) {
      console.error("Error fetching outbound stats:", err);
      setError((prev) => ({
        ...prev,
        outbound: "Failed to load outbound statistics",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, outbound: false }));
    }
  };
 
  // Calculate ASN Completed (CLOSED + GRN_POSTED)
  const asnCompleted =
    parseInt(inboundStats.closed) + parseInt(inboundStats.grnPosted);
 
  // Show loading while checking permissions
  if (dashboardAccess.loading) {
    return (
      <div className="max-w-full">
        <div className="p-6 text-center text-gray-600">Loading...</div>
      </div>
    );
  }
 
  return (
    <div className="max-w-full">
      <PageHeader
        title="WMS Dashboard"
        subtitle="Inbound, putaway, picking, packing, dispatch and billing overview"
        actions={
          <>
            <button
              onClick={() => navigate("/billing?tab=readyToInvoice")}
              className="px-4 py-2 border rounded-md text-sm bg-white"
            >
              Generate Invoice
            </button>
            {/* <button className="px-4 py-2 border rounded-md text-sm bg-white">
              Receive GRN
            </button> */}
            {/* <button
              onClick={() => navigate("/picking")}
              className="px-4 py-2 border rounded-md text-sm bg-white"
            >
              Start Picking Wave
            </button> */}
            <button 
                          onClick={() => navigate("/outbound/saleOrderCreate/new")}

            className="px-4 py-2 rounded-md text-sm bg-primary text-white">
              Create SO
            </button>
            <button
              onClick={() => navigate("/inbound/createASN/new")}
              className="px-4 py-2 rounded-md text-sm bg-primary text-white"
            >
              Create ASN
            </button>
          </>
        }
      />
 
      {/* <FilterBar filters={dashboardFilters} /> */}
 
      {/* INBOUND SECTION - Only show if user has read access */}
      {inboundAccess.canRead && (
        <>
          <SectionHeader
            title="Inbound Operations"
            icon={<Download size={16} className="text-blue-600" />}
          />
 
          {loading.inbound && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="ASN Pending"
                value="Loading..."
                accentColor="#3B82F6"
              />
              <StatCard
                title="Receiving Today"
                value="Loading..."
                accentColor="#3B82F6"
              />
              <StatCard
                title="Putaway Pending"
                value="Loading..."
                accentColor="#3B82F6"
              />
              <StatCard
                title="ASN Completed"
                value="Loading..."
                accentColor="#3B82F6"
              />
            </div>
          )}
 
          {error.inbound && !loading.inbound && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-4 text-center text-red-500 py-4">
                {error.inbound}
              </div>
            </div>
          )}
 
          {!loading.inbound && !error.inbound && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="ASN Pending"
                value={inboundStats.confirmed}
                accentColor="#3B82F6"
              />
              <StatCard
                title="Receiving Today"
                value={inboundStats.inReceiving}
                accentColor="#3B82F6"
              />
              <StatCard
                title="Putaway Pending"
                value={inboundStats.putawayPending}
                accentColor="#3B82F6"
              />
              <StatCard
                title="ASN Completed"
                value={asnCompleted.toString()}
                accentColor="#3B82F6"
              />
            </div>
          )}
        </>
      )}
 
      {/* INVENTORY SECTION - Only show if user has read access */}
      {inventoryAccess.canRead && (
        <>
          <SectionHeader
            title="Inventory Status"
            icon={<Boxes size={16} className="text-orange-500" />}
          />
 
          {/* Show loading state for inventory */}
          {loading.inventory && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="On-hand SKUs"
                value="Loading..."
                accentColor="#F59E0B"
              />
              <StatCard
                title="Available Qty"
                value="Loading..."
                accentColor="#F59E0B"
              />
              <StatCard
                title="Blocked / Hold"
                value="Loading..."
                accentColor="#F59E0B"
              />
              <StatCard
                title="Low Stock Alerts"
                value="Loading..."
                accentColor="#F59E0B"
              />
            </div>
          )}
 
          {/* Show error state for inventory */}
          {error.inventory && !loading.inventory && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-4 text-center text-red-500 py-4">
                {error.inventory}
              </div>
            </div>
          )}
 
          {/* Show actual inventory data */}
          {!loading.inventory && !error.inventory && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="On-hand SKUs"
                value={inventoryStats.onHandSkus}
                accentColor="#F59E0B"
              />
              <StatCard
                title="Available Qty"
                value={inventoryStats.availableQty}
                accentColor="#F59E0B"
              />
              <StatCard
                title="Blocked / Hold"
                value={inventoryStats.blockedHold}
                accentColor="#F59E0B"
              />
              <StatCard
                title="Low Stock Alerts"
                value={inventoryStats.lowStockAlerts}
                accentColor="#F59E0B"
              />
            </div>
          )}
        </>
      )}
 
      {/* OUTBOUND SECTION - Only show if user has read access */}
      {outboundAccess.canRead && (
        <>
          <SectionHeader
            title="Outbound Operations"
            icon={<Upload size={16} className="text-green-600" />}
          />
 
          {/* Show loading state for outbound */}
          {loading.outbound && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Orders Pending"
                value="Loading..."
                accentColor="#10B981"
              />
              <StatCard
                title="Picking Pending"
                value="Loading..."
                accentColor="#10B981"
              />
              <StatCard
                title="Packed Ready"
                value="Loading..."
                accentColor="#10B981"
              />
              <StatCard
                title="Shipped Today"
                value="Loading..."
                accentColor="#10B981"
              />
            </div>
          )}
 
          {/* Show error state for outbound */}
          {error.outbound && !loading.outbound && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-4 text-center text-red-500 py-4">
                {error.outbound}
              </div>
            </div>
          )}
 
          {/* Show actual outbound data */}
          {!loading.outbound && !error.outbound && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Orders Pending"
                value={outboundStats.ordersPending}
                accentColor="#10B981"
              />
              <StatCard
                title="Picking Pending"
                value={outboundStats.pickingPending}
                accentColor="#10B981"
              />
              <StatCard
                title="Packed Ready"
                value={outboundStats.packedReady}
                accentColor="#10B981"
              />
              <StatCard
                title="Shipped Today"
                value={outboundStats.shippedToday}
                accentColor="#10B981"
              />
            </div>
          )}
        </>
      )}
 
      <DashboardQueue warehouseId={selectedWarehouse} />
      {/* <DashboardWidgets /> */}
    </div>
  );
};
 
export default Dashboard;
 
 
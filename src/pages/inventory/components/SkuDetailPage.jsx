// SkuDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import http from "../../../api/http";
import { useToast } from "../../components/toast/ToastProvider";
import StatusPill from "./StatusPill";
import { ArrowLeft } from "lucide-react";
import CusTable from "../../components/CusTable";
import MoveStockModal from "./modals/MoveStockModal";
import AdjustStockModal from "./modals/AdjustStockModal";

export default function SkuDetailPage() {
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const pageType = queryParams.get("page");

  const isPutawayView = pageType === "putaway";

  const { skuId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [skuDetails, setSkuDetails] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [summary, setSummary] = useState(null);

  const [showHoldModal, setShowHoldModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);

  const [holdQty, setHoldQty] = useState(1);
  const [holdReason, setHoldReason] = useState("QUALITY_CHECK");
  const [holdNotes, setHoldNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movePrefill, setMovePrefill] = useState(null);

  const [openAdjust, setOpenAdjust] = useState(false);
  const [openMove, setOpenMove] = useState(false);

  useEffect(() => {
    if (skuId) {
      fetchAllData();
    }
  }, [skuId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchSkuDetails(), fetchInventoryData()]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load SKU details");
    } finally {
      setLoading(false);
    }
  };

  const fetchSkuDetails = async () => {
    try {
      const res = await http.get(`/skus/${skuId}`);
      if (res.data?.success) {
        setSkuDetails(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching SKU details:", error);
      toast.error("Failed to load SKU details");
    }
  };

  const fetchInventoryData = async () => {
    try {
      const res = await http.get(`/inventory/sku/${skuId}`);
      if (res.data?.success) {
        setInventoryData(res.data.data.inventory || []);
        setSummary(res.data.data.summary);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load inventory data");
    }
  };

  const handleBack = () => {
    navigate("/inventory"); // Navigate back to inventory page
  };

  const handleCreateHold = async () => {
    if (!selectedInventory) return;
    if (holdQty > selectedInventory.available_qty) {
      toast.error("Hold quantity cannot exceed available quantity");
      return;
    }

    try {
      setActionLoading(true);

      await http.post("/inventory-holds", {
        inventory_id: selectedInventory.id,
        qty: holdQty,
        hold_reason: holdReason,
        hold_notes: holdNotes,
      });

      toast.success("Inventory placed on hold");
      setShowHoldModal(false);
      fetchInventoryData();
    } catch {
      toast.error("Failed to create hold");
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateHold = (row) => {
    setSelectedInventory(row);
    setHoldQty(1);
    setHoldReason("QUALITY_CHECK");
    setHoldNotes("");
    setShowHoldModal(true); // ✅ correct
  };

  // Define columns for the inventory locations table
  const inventoryColumns = [
    {
      key: "location",
      title: "Location Details",
      render: (item) => (
        <div>
          <div className="font-medium text-gray-900">
            {item.location?.location_code || "N/A"}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Zone: {item.location?.zone || "N/A"} • Aisle:{" "}
            {item.location?.aisle || "N/A"} • Rack:{" "}
            {item.location?.rack || "N/A"} • Level:{" "}
            {item.location?.level || "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "batch_no",
      title: "Batch",
      render: (item) => (
        <span className="font-medium">{item.batch_no || "-"}</span>
      ),
    },
    {
      key: "on_hand_qty",
      title: "On Hand",
      render: (item) => <span className="font-medium">{item.on_hand_qty}</span>,
    },
    {
      key: "available_qty",
      title: "Available",
      render: (item) => (
        <span className="font-medium text-green-600">{item.available_qty}</span>
      ),
    },
    {
      key: "hold_qty",
      title: "Hold",
      render: (item) => (
        <span className="font-medium text-orange-600">{item.hold_qty}</span>
      ),
    },
    {
      key: "allocated_qty",
      title: "Allocated",
      render: (item) => (
        <span className="font-medium text-blue-600">{item.allocated_qty}</span>
      ),
    },
    {
      key: "damaged_qty",
      title: "Damaged",
      render: (item) => (
        <span className="font-medium text-red-600">{item.damaged_qty}</span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (item) => <StatusPill text={item.status} />,
    },
    {
      key: "warehouse",
      title: "Warehouse",
      render: (item) => (
        <div>
          <div className="font-medium">{item.warehouse?.warehouse_name}</div>
          <div className="text-xs text-gray-500">
            {item.warehouse?.warehouse_code}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={() => openCreateHold(r)}
            className="rounded bg-yellow-500 px-3 py-1 text-sm text-white"
          >
            Hold
          </button>

          <button
            onClick={() => {
              setMovePrefill(r);
              setShowMoveModal(true);
            }}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
          >
            Move Stock
          </button>
          <button
            onClick={() => {
              setSelectedInventory(r); // inventory object
              setOpenAdjust(true);
            }}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white"
          >
            Adjust Stock
          </button>
        </div>
      ),
    },
  ];

  const tableData = inventoryData.map((item) => ({
    ...item,
    id: item.id,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-500">Loading SKU details...</div>
        </div>
      </div>
    );
  }

  if (!skuDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">SKU not found</div>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* SKU Details - Full width on mobile, left on desktop */}
            <div className="order-2 sm:order-1 flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {skuDetails.sku_code}
                <span className="text-gray-600 ml-2 font-normal truncate">
                  - {skuDetails.sku_name}
                </span>
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 truncate">
                SKU ID: {skuId} • Category: {skuDetails.category} • UOM:{" "}
                {skuDetails.uom}
              </p>
            </div>

            {/* Back Button - Top right on mobile, right on desktop */}
            <div className="order-1 sm:order-2 self-end sm:self-auto">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 whitespace-nowrap"
              >
                <ArrowLeft size={20} />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  SKU Code
                </label>
                <p className="font-medium">{skuDetails.sku_code}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  SKU Name
                </label>
                <p className="font-medium">{skuDetails.sku_name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Description
                </label>
                <p className="font-medium">
                  {skuDetails.description || "No description provided"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Client
                </label>
                <div>
                  <p className="font-medium">
                    {skuDetails.client?.client_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {skuDetails.client?.client_code}
                  </p>
                  <p className="text-sm text-gray-500">
                    {skuDetails.client?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Specifications */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Specifications
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Category
                </label>
                <p className="font-medium">{skuDetails.category}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Unit of Measure
                </label>
                <p className="font-medium">{skuDetails.uom}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Unit Price
                </label>
                <p className="font-medium text-lg">
                  ₹{parseFloat(skuDetails.unit_price).toLocaleString()}
                  <span className="text-sm text-gray-500 ml-2">
                    {skuDetails.currency}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Pick Rule
                </label>
                <p className="font-medium">{skuDetails.pick_rule}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Putaway Zone
                </label>
                <p className="font-medium">
                  {skuDetails.putaway_zone || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Physical Properties */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Physical Properties
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Dimensions
                </label>
                <p className="font-medium">
                  {skuDetails.dimensions_length} × {skuDetails.dimensions_width}{" "}
                  × {skuDetails.dimensions_height} cm
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Weight
                </label>
                <p className="font-medium">{skuDetails.weight} kg</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Tracking Requirements
                </label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Serial Tracking:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${skuDetails.requires_serial_tracking ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {skuDetails.requires_serial_tracking
                        ? "Required"
                        : "Not Required"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Batch Tracking:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${skuDetails.requires_batch_tracking ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {skuDetails.requires_batch_tracking
                        ? "Required"
                        : "Not Required"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Expiry Tracking:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${skuDetails.requires_expiry_tracking ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {skuDetails.requires_expiry_tracking
                        ? "Required"
                        : "Not Required"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Properties
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${skuDetails.fragile ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {skuDetails.fragile ? "Fragile" : "Non-Fragile"}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${skuDetails.hazardous ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {skuDetails.hazardous ? "Hazardous" : "Non-Hazardous"}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${skuDetails.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {skuDetails.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {!isPutawayView && summary && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500">Total On Hand</div>
                <div className="text-2xl font-bold mt-1">
                  {summary.total_on_hand.toLocaleString()}
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500">Available</div>
                <div className="text-2xl font-bold mt-1 text-green-600">
                  {summary.total_available.toLocaleString()}
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500">On Hold</div>
                <div className="text-2xl font-bold mt-1 text-orange-600">
                  {summary.total_hold.toLocaleString()}
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500">Allocated</div>
                <div className="text-2xl font-bold mt-1 text-blue-600">
                  {summary.total_allocated.toLocaleString()}
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500">Damaged</div>
                <div className="text-2xl font-bold mt-1 text-red-600">
                  {summary.total_damaged.toLocaleString()}
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500">Locations</div>
                <div className="text-2xl font-bold mt-1">
                  {summary.locations}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Inventory Locations
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Showing {tableData.length} location
                      {tableData.length !== 1 ? "s" : ""} for this SKU
                    </p>
                  </div>
                </div>
              </div>

              {tableData.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-gray-400 mb-2">
                    No inventory found for this SKU
                  </div>
                  <button
                    onClick={fetchAllData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Refresh Data
                  </button>
                </div>
              ) : (
                <CusTable columns={inventoryColumns} data={tableData} />
              )}
            </div>
          </>
        )}

        {/* Last Updated Info */}
        <div className="text-xs text-gray-400 text-center pt-4">
          Data last updated:{" "}
          {skuDetails.updated_at
            ? new Date(skuDetails.updated_at).toLocaleString()
            : "N/A"}
        </div>
      </div>

      {showHoldModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-[420px] rounded-lg bg-white p-4 space-y-3">
            <h2 className="text-lg font-semibold">Create Inventory Hold</h2>

            <select
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="QUALITY_CHECK">Quality Check</option>
              <option value="DAMAGED">Damaged</option>
              <option value="EXPIRY_RISK">Expiry Risk</option>
              <option value="RECALL">Recall</option>
              <option value="CUSTOMER_DISPUTE">Customer Dispute</option>
              <option value="OTHER">Other</option>
            </select>

            <input
              type="number"
              min={1}
              max={selectedInventory?.available_qty}
              value={holdQty}
              onChange={(e) => setHoldQty(+e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Quantity"
            />

            <textarea
              value={holdNotes}
              onChange={(e) => setHoldNotes(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Hold notes"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowHoldModal(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHold}
                disabled={actionLoading}
                className="px-3 py-1 bg-yellow-600 text-white rounded"
              >
                Create Hold
              </button>
            </div>
          </div>
        </div>
      )}
      <MoveStockModal
        open={showMoveModal}
        onClose={() => {
          setShowMoveModal(false);
          setMovePrefill(null);
        }}
        initialData={movePrefill}
        onSuccess={fetchInventoryData}
      />

      <AdjustStockModal
        open={openAdjust}
        onClose={() => {
          setOpenAdjust(false);
          setSelectedInventory(null);
        }}
        initialData={selectedInventory}
        onSuccess={fetchInventoryData}
      />
    </div>
  );
}

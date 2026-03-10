import React, { useMemo, useState, useEffect } from "react";
import { ArrowLeft, FileText, MapPin } from "lucide-react";
import http from "../../api/http";

import ShipmentOverview from "./ShipmentOverview";
import ShipmentOrders from "./ShipmentOrders";
import ShipmentCartons from "./ShipmentCartons";
import ShipmentDocuments from "./ShipmentDocuments";
import ShipmentExceptions from "./ShipmentExceptions";
import ShipmentAudit from "./ShipmentAudit";

// Optional placeholders (tabs shown in Figma sidebar)
const Placeholder = ({ title }) => (
  <div className="rounded-xl border border-gray-200 p-6">
    <div className="text-lg font-semibold text-gray-900">{title}</div>
    <div className="mt-2 text-sm text-gray-500">
      UI only. API integration pending.
    </div>
  </div>
);

const ShipmentDetail = ({ shipmentId, onBack }) => {
  const [activeSection, setActiveSection] = useState("overview");
  const [shipmentData, setShipmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch shipment details
  useEffect(() => {
    const fetchShipmentDetails = async () => {
      if (!shipmentId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await http.get(`/shipping/${shipmentId}`);
        if (response.data.success) {
          setShipmentData(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching shipment details:", err);
        setError("Failed to load shipment details");
      } finally {
        setLoading(false);
      }
    };

    fetchShipmentDetails();
  }, [shipmentId]);

  const shipmentDetails = useMemo(() => {
    if (!shipmentData) return null;

    // Format status for display
    const formatStatus = (status) => {
      return status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ");
    };

    // Format date for display
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return {
      id: shipmentData.shipment_no,
      rawId: shipmentData.id,
      status: formatStatus(shipmentData.status),
      rawStatus: shipmentData.status,
      warehouse: shipmentData.warehouse?.warehouse_name || "N/A",
      client: shipmentData.SalesOrder?.customer_name || "N/A",
      carrier: shipmentData.Carrier?.carrier_name || "N/A",
      carrierDetails: shipmentData.Carrier,
      service: shipmentData.shipping_method || "Standard",
      awb: shipmentData.awb_no || "N/A",
      dispatchTime:
        formatDate(shipmentData.dispatched_at) ||
        formatDate(shipmentData.createdAt),
      orders: 1, // Each shipment is linked to one sales order
      cartons: shipmentData.total_cartons || 0,
      exceptionsCount: 0, // You'll need to implement exceptions tracking
      shipToName: shipmentData.ship_to_name,
      shipToAddress: `${shipmentData.ship_to_address}, ${shipmentData.ship_to_city}, ${shipmentData.ship_to_state} - ${shipmentData.ship_to_pincode}`,
      shipToPhone: shipmentData.ship_to_phone,
      estimatedDelivery: formatDate(shipmentData.estimated_delivery_date),
      notes: shipmentData.notes,
      salesOrder: shipmentData.SalesOrder,
      cartonsData: shipmentData.SalesOrder?.cartons || [],
      totalWeight: shipmentData.total_weight,
      shippingCost: shipmentData.shipping_cost,
      createdAt: formatDate(shipmentData.createdAt),
      updatedAt: formatDate(shipmentData.updatedAt),
    };
  }, [shipmentData]);

  const sections = [
    { id: "overview", label: "Overview", component: ShipmentOverview },
    { id: "orders", label: "Orders", component: ShipmentOrders },
    { id: "cartons", label: "Cartons", component: ShipmentCartons },
    { id: "documents", label: "Documents", component: ShipmentDocuments },
    { id: "exceptions", label: "Exceptions", component: ShipmentExceptions },
    { id: "audit", label: "Audit", component: ShipmentAudit },
  ];

  const ActiveComponent = sections.find(
    (s) => s.id === activeSection,
  )?.component;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !shipmentDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <div className="text-gray-600">{error || "Shipment not found"}</div>
          <button
            onClick={onBack}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-500">
          <span
            onClick={onBack}
            className="hover:underline cursor-pointer hover:text-blue-600"
          >
            Shipping
          </span>
          <span className="mx-2">›</span> Shipment Detail
        </div>

        {/* Page Title + Actions */}
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Shipment Detail</h1>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {/* <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
              <FileText size={16} />
              Manifest
            </button> */}

            {/* <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <MapPin size={16} />
              Add Tracking Update
            </button> */}
          </div>
        </div>

        {/* Shipment Header Card */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-gray-900">
                  {shipmentDetails.id}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    shipmentDetails.rawStatus === "DISPATCHED"
                      ? "bg-amber-100 text-amber-700"
                      : shipmentDetails.rawStatus === "CREATED"
                        ? "bg-gray-100 text-gray-700"
                        : shipmentDetails.rawStatus === "IN_TRANSIT"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                  }`}
                >
                  {shipmentDetails.status}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <InfoBlock
                  label="Warehouse / Client"
                  value={`${shipmentDetails.warehouse} / ${shipmentDetails.client}`}
                />
                <InfoBlock
                  label="Carrier / Service"
                  value={`${shipmentDetails.carrier} / ${shipmentDetails.service}`}
                />
                <InfoBlock label="AWB / Tracking" value={shipmentDetails.awb} />
                <InfoBlock
                  label="Dispatch Time"
                  value={shipmentDetails.dispatchTime}
                />
              </div>

              <div className="mt-5">
                <div className="text-sm text-gray-500">Content</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {shipmentDetails.orders} Order / {shipmentDetails.cartons}{" "}
                  Cartons
                </div>
              </div>

              {shipmentDetails.notes && (
                <div className="mt-3">
                  <div className="text-sm text-gray-500">Notes</div>
                  <div className="mt-1 text-gray-900">
                    {shipmentDetails.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {/* <button className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100">
                Open Orders
              </button>
              <button className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100">
                Open Billing
              </button> */}
            </div>
          </div>
        </div>

        {/* Body: Left Sidebar + Right Content */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="space-y-1">
              {sections.map((s) => (
                <SidebarItem
                  key={s.id}
                  label={s.label}
                  active={activeSection === s.id}
                  badge={
                    s.id === "exceptions"
                      ? shipmentDetails.exceptionsCount
                      : null
                  }
                  onClick={() => setActiveSection(s.id)}
                />
              ))}
            </div>
          </aside>

          {/* Content */}
          <main>
            {ActiveComponent && (
              <ActiveComponent shipmentDetails={shipmentDetails} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetail;

const InfoBlock = ({ label, value }) => (
  <div>
    <div className="text-sm text-gray-500">{label}</div>
    <div className="mt-1 font-semibold text-gray-900">{value}</div>
  </div>
);

const SidebarItem = ({ label, active, badge, onClick }) => (
  <button
    onClick={onClick}
    className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
      active ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"
    }`}
  >
    <span className="flex items-center gap-2">
      {label}
      {typeof badge === "number" && badge > 0 && (
        <span
          className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold ${
            active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          {badge}
        </span>
      )}
    </span>

    <span
      className={`transition ${active ? "text-white" : "text-gray-300 group-hover:text-gray-400"}`}
    >
      ›
    </span>
  </button>
);

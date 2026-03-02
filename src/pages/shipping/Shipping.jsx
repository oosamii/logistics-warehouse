import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import ReadyToShip from "./ReadyToShip";
import ShipmentsInTransit from "./ShipmentsInTransit";
import Delivered from "./Delivered";
import Exceptions from "./Exceptions";
import ShipmentDetail from "./ShipmentDetail";
import { Download } from "lucide-react";

const Shipping = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Tabs configuration
  const tabs = useMemo(
    () => [
      { id: "readyToShip", label: "Ready to Ship", component: ReadyToShip },
      {
        id: "inTransit",
        label: "Shipments In Transit",
        component: ShipmentsInTransit,
      },
      { id: "delivered", label: "Delivered", component: Delivered },
      { id: "exceptions", label: "Exceptions", component: Exceptions },
    ],
    [],
  );

  // read tab from URL
  const urlTab = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return (sp.get("tab") || "").trim();
  }, [location.search]);

  const [activeTab, setActiveTab] = useState("readyToShip");
  const [selectedShipment, setSelectedShipment] = useState(null);

  // Sync activeTab from URL (and fix invalid/missing tab in URL)
  useEffect(() => {
    const allowed = tabs.map((t) => t.id);
    const fallback = tabs[0]?.id || "readyToShip";

    const next = allowed.includes(urlTab) ? urlTab : fallback;

    // update state
    setActiveTab(next);

    // if url missing/invalid, normalize it (replace avoids history spam)
    if (!allowed.includes(urlTab) || !urlTab) {
      navigate(`/shipping?tab=${next}`, { replace: true });
    }
  }, [tabs, urlTab, navigate]);

  // Handle opening shipment detail
  const handleOpenShipment = (shipmentId) => setSelectedShipment(shipmentId);

  // Handle going back from shipment detail
  const handleBackFromDetail = () => setSelectedShipment(null);

  // Header actions based on active tab
  const getHeaderActions = () => {
    const baseActions = (
      <button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        <Download size={16} />
        Export
      </button>
    );

    if (activeTab === "readyToShip" || activeTab === "exceptions") {
      return <div className="flex gap-3">{baseActions}</div>;
    }
    return baseActions;
  };

  // Data for each tab (your existing arrays)
  const readyToShipData = [
    /* ... keep your data ... */
  ];
  const inTransitData = [
    /* ... keep your data ... */
  ];
  const deliveredData = [
    /* ... keep your data ... */
  ];
  const exceptionsData = [
    /* ... keep your data ... */
  ];

  // Get active component
  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  // Get data for active tab
  const getActiveData = () => {
    switch (activeTab) {
      case "readyToShip":
        return readyToShipData;
      case "inTransit":
        return inTransitData;
      case "delivered":
        return deliveredData;
      case "exceptions":
        return exceptionsData;
      default:
        return [];
    }
  };

  // Filter handlers
  const handleFilterChange = (key, value) =>
    console.log(`Filter changed: ${key} = ${value}`);
  const handleReset = () => console.log("Filters reset");
  const handleApply = (filters) => console.log("Filters applied:", filters);

  // If a shipment is selected, show the detail page
  if (selectedShipment) {
    return (
      <ShipmentDetail
        shipmentId={selectedShipment}
        onBack={handleBackFromDetail}
      />
    );
  }

  const onTabClick = (tabId) => {
    setActiveTab(tabId);
    navigate(`/shipping?tab=${tabId}`);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Shipping"
        subtitle="Dispatch packed orders and manage carrier shipments"
        actions={getHeaderActions()}
      />

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabClick(tab.id)}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Tab Content */}
      {ActiveComponent && (
        <ActiveComponent
          data={getActiveData()}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          onApply={handleApply}
          onOpenShipment={handleOpenShipment}
        />
      )}
    </div>
  );
};

export default Shipping;

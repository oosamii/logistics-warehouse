// import React, { useState } from "react";
// import PageHeader from "../components/PageHeader";
// import ReadyToShip from "./ReadyToShip";
// import ShipmentsInTransit from "./ShipmentsInTransit";
// import Delivered from "./Delivered";
// import Exceptions from "./Exceptions";
// import ShipmentDetail from "./ShipmentDetail";
// import { Download, Plus } from "lucide-react";

// const Shipping = () => {
//   const [activeTab, setActiveTab] = useState("readyToShip");
//   const [selectedShipment, setSelectedShipment] = useState(null);

//   // Tabs configuration
//   const tabs = [
//     { id: "readyToShip", label: "Ready to Ship", component: ReadyToShip },
//     {
//       id: "inTransit",
//       label: "Shipments In Transit",
//       component: ShipmentsInTransit,
//     },
//     { id: "delivered", label: "Delivered", component: Delivered },
//     { id: "exceptions", label: "Exceptions", component: Exceptions },
//   ];

//   // Handle opening shipment detail
//   const handleOpenShipment = (shipmentId) => {
//     setSelectedShipment(shipmentId);
//   };

//   // Handle going back from shipment detail
//   const handleBackFromDetail = () => {
//     setSelectedShipment(null);
//   };

//   // Header actions based on active tab
//   const getHeaderActions = () => {
//     const baseActions = (
//       <button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
//         <Download size={16} />
//         Export
//       </button>
//     );

//     if (activeTab === "readyToShip") {
//       return (
//         <div className="flex gap-3">
//           <button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
//             <Download size={16} />
//             Export
//           </button>
//           {/* <button className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
//             <Plus size={16} />
//             Create Shipment
//           </button> */}
//         </div>
//       );
//     }

//     if (activeTab === "exceptions") {
//       return (
//         <div className="flex gap-3">
//           <button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
//             <Download size={16} />
//             Export
//           </button>
//           {/* <button className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
//             <Plus size={16} />
//             Create Exception
//           </button> */}
//         </div>
//       );
//     }

//     return baseActions;
//   };

//   // Data for each tab
//   const readyToShipData = [
//     {
//       id: 1,
//       orderNo: "ORD-2024-8810",
//       client: "Acme Corp",
//       shipTo: "New York, NY",
//       cartons: 3,
//       totalWeight: "15.2 kg",
//       carrier: "FedEx",
//       slaDue: "Today 14:00",
//       status: "Packed",
//     },
//     {
//       id: 2,
//       orderNo: "ORD-2024-8805",
//       client: "Acme Corp",
//       shipTo: "Chicago, IL",
//       cartons: 1,
//       totalWeight: "2.5 kg",
//       carrier: "DHL",
//       slaDue: "Tomorrow 10:00",
//       status: "Packed",
//     },
//     {
//       id: 3,
//       orderNo: "ORD-2024-8799",
//       client: "Acme Corp",
//       shipTo: "Austin, TX",
//       cartons: 5,
//       totalWeight: "45.0 kg",
//       carrier: "UPS",
//       slaDue: "Today 16:00",
//       status: "Packed",
//     },
//     {
//       id: 4,
//       orderNo: "ORD-2024-8790",
//       client: "Acme Corp",
//       shipTo: "Miami, FL",
//       cartons: 2,
//       totalWeight: "8.8 kg",
//       carrier: "FedEx",
//       slaDue: "Tomorrow 12:00",
//       status: "Packed",
//     },
//     {
//       id: 5,
//       orderNo: "ORD-2024-8788",
//       client: "Acme Corp",
//       shipTo: "Seattle, WA",
//       cartons: 4,
//       totalWeight: "22.1 kg",
//       carrier: "DHL",
//       slaDue: "In 2 Days",
//       status: "Packed",
//     },
//   ];

//   const inTransitData = [
//     {
//       id: 1,
//       shipmentId: "SHP-2024-0012",
//       carrier: "FedEx",
//       tracking: "780231224512",
//       orders: 5,
//       cartons: 12,
//       dispatchTime: "Today 09:30",
//       lastScan: "Arrived at Hub (14:15)",
//       status: "In Transit",
//     },
//     {
//       id: 2,
//       shipmentId: "SHP-2024-0011",
//       carrier: "DHL Express",
//       tracking: "JD0146000089",
//       orders: 2,
//       cartons: 4,
//       dispatchTime: "Yesterday 16:45",
//       lastScan: "Out for Delivery (10:00)",
//       status: "In Transit",
//     },
//     {
//       id: 3,
//       shipmentId: "SHP-2024-0010",
//       carrier: "UPS Ground",
//       tracking: "12999999999999",
//       orders: 1,
//       cartons: 8,
//       dispatchTime: "Yesterday 14:00",
//       lastScan: "In Transit (08:30)",
//       status: "Dispatched",
//     },
//     {
//       id: 4,
//       shipmentId: "SHP-2024-0009",
//       carrier: "Own Fleet",
//       tracking: "TRK-00551",
//       orders: 12,
//       cartons: 45,
//       dispatchTime: "2 Days Ago",
//       lastScan: "Driver En Route",
//       status: "In Transit",
//     },
//     {
//       id: 5,
//       shipmentId: "SHP-2024-0008",
//       carrier: "FedEx",
//       tracking: "780211115500",
//       orders: 3,
//       cartons: 6,
//       dispatchTime: "3 Days Ago",
//       lastScan: "Customs Clearance",
//       status: "Delayed",
//     },
//   ];

//   const deliveredData = [
//     {
//       id: 1,
//       shipmentId: "SHP-2024-9002",
//       carrier: "FedEx",
//       deliveredTime: "Today 11:30 AM",
//       podStatus: "Available",
//       ordersCount: 4,
//       status: "Delivered",
//     },
//     {
//       id: 2,
//       shipmentId: "SHP-2024-8955",
//       carrier: "DHL",
//       deliveredTime: "Yesterday 16:45 PM",
//       podStatus: "Pending",
//       ordersCount: 1,
//       status: "Delivered",
//     },
//     {
//       id: 3,
//       shipmentId: "SHP-2024-8940",
//       carrier: "UPS",
//       deliveredTime: "Yesterday 10:15 AM",
//       podStatus: "Available",
//       ordersCount: 12,
//       status: "Delivered",
//     },
//     {
//       id: 4,
//       shipmentId: "SHP-2024-8912",
//       carrier: "FedEx",
//       deliveredTime: "Oct 24, 14:00 PM",
//       podStatus: "Available",
//       ordersCount: 2,
//       status: "Delivered",
//     },
//     {
//       id: 5,
//       shipmentId: "SHP-2024-8890",
//       carrier: "DHL",
//       deliveredTime: "Oct 24, 09:30 AM",
//       podStatus: "Available",
//       ordersCount: 5,
//       status: "Delivered",
//     },
//   ];

//   const exceptionsData = [
//     {
//       id: 1,
//       exceptionId: "EU-2024-001",
//       shipmentId: "SHP-2024-9901",
//       type: "Delay",
//       age: "2 Days",
//       status: "Open",
//     },
//     {
//       id: 2,
//       exceptionId: "EU-2024-002",
//       shipmentId: "SHP-2024-9855",
//       type: "Damage",
//       age: "1 Day",
//       status: "Open",
//     },
//     {
//       id: 3,
//       exceptionId: "EU-2024-003",
//       shipmentId: "SHP-2024-9800",
//       type: "RTO",
//       age: "5 Days",
//       status: "Resolved",
//     },
//     {
//       id: 4,
//       exceptionId: "EU-2024-004",
//       shipmentId: "SHP-2024-9750",
//       type: "Delay",
//       age: "6 Hours",
//       status: "Open",
//     },
//   ];

//   // Get active component
//   const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

//   // Get data for active tab
//   const getActiveData = () => {
//     switch (activeTab) {
//       case "readyToShip":
//         return readyToShipData;
//       case "inTransit":
//         return inTransitData;
//       case "delivered":
//         return deliveredData;
//       case "exceptions":
//         return exceptionsData;
//       default:
//         return [];
//     }
//   };

//   // Filter handlers
//   const handleFilterChange = (key, value) => {
//     console.log(`Filter changed: ${key} = ${value}`);
//   };

//   const handleReset = () => {
//     console.log("Filters reset");
//   };

//   const handleApply = (filters) => {
//     console.log("Filters applied:", filters);
//   };

//   // If a shipment is selected, show the detail page
//   if (selectedShipment) {
//     return (
//       <ShipmentDetail
//         shipmentId={selectedShipment}
//         onBack={handleBackFromDetail}
//       />
//     );
//   }

//   return (
//     <div className="p-6">
//       <PageHeader
//         title="Shipping"
//         subtitle="Dispatch packed orders and manage carrier shipments"
//         // breadcrumbs={[
//         //   { label: "Home", href: "/" },
//         //   { label: "Operations", href: "/operations" },
//         //   { label: "Shipping" },
//         // ]}
//         actions={getHeaderActions()}
//       />

//       {/* Tabs */}
//       <div className="mb-6 border-b border-gray-200">
//         <nav className="-mb-px flex space-x-8">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
//                 activeTab === tab.id
//                   ? "border-blue-600 text-blue-700"
//                   : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//               }`}
//             >
//               {tab.label}
//             </button>
//           ))}
//         </nav>
//       </div>

//       {/* Active Tab Content */}
//       {ActiveComponent && (
//         <ActiveComponent
//           data={getActiveData()}
//           onFilterChange={handleFilterChange}
//           onReset={handleReset}
//           onApply={handleApply}
//           onOpenShipment={handleOpenShipment} // Pass the handler to child components
//         />
//       )}
//     </div>
//   );
// };

// export default Shipping;

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

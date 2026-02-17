// packing/Packing.jsx
import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import { Download, Plus } from "lucide-react";
import PackingReady from "./PackingReady";
import PackingInProgress from "./PackingInProgress";
import PackingCompleted from "./PackingCompleted";
import PackOrderDetail from "./PackOrderDetail";
import StartPackingModal from "./StartPackingModal";

const Packing = () => {
  const [activeTab, setActiveTab] = useState("ready");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showStartPackingModal, setShowStartPackingModal] = useState(false);

  // Action buttons EXACTLY as shown in Figma (first screenshot)
  const actions = (
    <>
      <button className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
        <Download size={16} />
        Export
      </button>
      {/* <button
        onClick={() => setShowStartPackingModal(true)}
        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        <Plus size={16} />
        Start Packing
      </button> */}
    </>
  );

  const handleOrderSelect = (orderId) => {
    setSelectedOrderId(orderId);
    setActiveTab("detail");
  };

  const handleBackFromDetail = () => {
    setSelectedOrderId(null);
    setActiveTab("ready");
  };

  const handleStartPackingFromModal = (packingData) => {
    console.log("Starting packing:", packingData);
    // Navigate to pack order detail for this order
    setSelectedOrderId(packingData.order.orderNo);
    setActiveTab("detail");
    setShowStartPackingModal(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "ready":
        return <PackingReady onOrderSelect={handleOrderSelect} />;
      case "progress":
        return <PackingInProgress onOrderSelect={handleOrderSelect} />;
      case "completed":
        return <PackingCompleted onOrderSelect={handleOrderSelect} />;
      case "detail":
        // Detail view renders its own COMPLETELY DIFFERENT layout
        return (
          <PackOrderDetail
            orderId={selectedOrderId}
            onBack={handleBackFromDetail}
          />
        );
      default:
        return <PackingReady onOrderSelect={handleOrderSelect} />;
    }
  };

  // If we're in detail view, show COMPLETELY DIFFERENT page (no tabs, different header)
  if (activeTab === "detail") {
    return (
      <PackOrderDetail
        orderId={selectedOrderId}
        onBack={handleBackFromDetail}
      />
    );
  }

  // Regular Packing View (with tabs) - EXACTLY like first Figma screenshot
  return (
    <>
      <div className="min-h-screen  p-6">
        <div className="mx-auto 2xl:max-w-[1900px]">
          {/* HEADER - EXACTLY like Figma */}
          <PageHeader
            title="Packing"
            subtitle="Pack picked orders, generate cartons, print labels"
            actions={actions}
          />

          {/* TABS - EXACTLY like Figma (3 tabs only) */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex items-center gap-10">
              <button
                onClick={() => setActiveTab("ready")}
                className={`px-2 pb-3 text-sm font-medium ${
                  activeTab === "ready"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                }`}
              >
                Orders Ready to Pack
              </button>
              <button
                onClick={() => setActiveTab("progress")}
                className={`px-2 pb-3 text-sm font-medium ${
                  activeTab === "progress"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                }`}
              >
                Packing In Progress
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`px-2 pb-3 text-sm font-medium ${
                  activeTab === "completed"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                }`}
              >
                Packed (Ready to Ship)
              </button>
            </div>
          </div>

          {/* Content for each tab */}
          {renderContent()}
        </div>
      </div>

      {/* Start Packing Modal */}
      {showStartPackingModal && (
        <StartPackingModal
          onClose={() => setShowStartPackingModal(false)}
          onStartPacking={handleStartPackingFromModal}
        />
      )}
    </>
  );
};

export default Packing;

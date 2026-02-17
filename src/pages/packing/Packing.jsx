import React from "react";
import PageHeader from "../components/PageHeader";
import { Download } from "lucide-react";
import PackingReady from "./PackingReady";
import PackingInProgress from "./PackingInProgress";
import PackingCompleted from "./PackingCompleted";
import StartPackingModal from "./StartPackingModal";
import { useNavigate, useSearchParams } from "react-router-dom";

const Packing = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showStartPackingModal, setShowStartPackingModal] =
    React.useState(false);

  // Get tab from URL
  const activeTab = searchParams.get("tab") || "ready";

  const actions = (
    <button className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
      <Download size={16} />
      Export
    </button>
  );

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const handleOrderSelect = (orderId) => {
    navigate(`/packing/orderId/${orderId}`);
  };

  const handleStartPackingFromModal = (packingData) => {
    navigate(`/packing/orderId/${packingData.order.id}`);
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
      default:
        return <PackingReady onOrderSelect={handleOrderSelect} />;
    }
  };

  return (
    <>
      <div className="min-h-screen p-6">
        <div className="mx-auto 2xl:max-w-[1900px]">
          <PageHeader
            title="Packing"
            subtitle="Pack picked orders, generate cartons, print labels"
            actions={actions}
          />

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex items-center gap-10">
              <button
                onClick={() => handleTabChange("ready")}
                className={`px-2 pb-3 text-sm font-medium ${
                  activeTab === "ready"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                }`}
              >
                Orders Ready to Pack
              </button>

              <button
                onClick={() => handleTabChange("progress")}
                className={`px-2 pb-3 text-sm font-medium ${
                  activeTab === "progress"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                }`}
              >
                Packing In Progress
              </button>

              <button
                onClick={() => handleTabChange("completed")}
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

          {renderContent()}
        </div>
      </div>

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

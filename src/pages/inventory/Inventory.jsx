// inventory/Inventory.jsx
import React, { useState } from "react";
import {
  Download,
  RefreshCcw,
  MoveRight,
  SlidersHorizontal,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import InventoryHolds from "./components/tabs/inventoryholds/InventoryHoldsTab";
import StockBySkuTab from "./components/tabs/stockBySku/StockBySkuTab";
import TransactionsTab from "./components/tabs/transactions/TransactionsTab";
import StockByLocationTab from "./components/tabs/stockByLocation/StockByLocationTab";
import MoveStockModal from "./components/modals/MoveStockModal";
import AdjustStockModal from "./components/modals/AdjustStockModal";

const Inventory = () => {
  const [activeTab, setActiveTab] = useState("sku");
  const [openAdjust, setOpenAdjust] = useState(false);
  const [openMove, setOpenMove] = useState(false);

  const TabBtn = ({ id, children }) => {
    const active = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={[
          "px-2 pb-3 text-sm font-medium",
          active ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500",
        ].join(" ")}
      >
        {children}
      </button>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "sku":
        return <StockBySkuTab />;

      case "location":
        return <StockByLocationTab />;

      case "holds":
        return <InventoryHolds />;

      case "transactions":
        return <TransactionsTab />;

      default:
        return <StockBySkuTab />;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto 2xl:max-w-[1900px]">
        <PageHeader
          title="Inventory"
          subtitle="View stock by SKU, location, batch and holds"
          actions={
            <>
              {/* <button className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
                <Download size={16} />
                Export
              </button> */}
              {/* <button className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
                <RefreshCcw size={16} />
                Cycle Count
              </button> */}
              {/* <button
                onClick={() => setOpenMove(true)}
                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
              >
                <MoveRight size={16} />
                Move Stock
              </button>
              <button
                onClick={() => setOpenAdjust(true)}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
              >
                <SlidersHorizontal size={16} />
                Adjust Stock
              </button> */}
            </>
          }
        />

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex items-center gap-10">
            <TabBtn id="sku">Stock by SKU</TabBtn>
            <TabBtn id="location">Stock by Location</TabBtn>
            <TabBtn id="holds">Holds / Quarantine</TabBtn>
            <TabBtn id="transactions">Transactions</TabBtn>
          </div>
        </div>

        {renderContent()}
      </div>

      <MoveStockModal open={openMove} onClose={() => setOpenMove(false)} />
      <AdjustStockModal
        open={openAdjust}
        onClose={() => setOpenAdjust(false)}
      />
    </div>
  );
};

export default Inventory;

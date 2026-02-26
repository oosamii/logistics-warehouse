import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import BillableEvents from "./BillableEvents";
import ReadyToInvoice from "./ReadyToInvoice";
import Invoiced from "./Invoiced";
import PaymentsAging from "./PaymentsAging";
import RateCards from "./RateCards";
import RunBillingModal from "./RunBillingModal";
import InvoiceDetail from "./InvoiceDetail";
import { Download, Plus, Play } from "lucide-react";
import CreateManualChargeModal from "./components/CreateManualChargeModal";

const Billing = () => {
  const [activeTab, setActiveTab] = useState("billableEvents");
  const [showRunBillingModal, setShowRunBillingModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [showManualChargeModal, setShowManualChargeModal] = useState(false);

  const tabs = [
    {
      id: "billableEvents",
      label: "Billable Events",
      component: BillableEvents,
    },
    {
      id: "readyToInvoice",
      label: "Ready to Invoice",
      component: ReadyToInvoice,
    },
    { id: "invoiced", label: "Invoiced", component: Invoiced },
    {
      id: "paymentsAging",
      label: "Payments / Aging",
      component: PaymentsAging,
    },
    { id: "rateCards", label: "Rate Cards", component: RateCards },
  ];

  const handleOpenInvoice = (invoiceNo) => {
    setSelectedInvoice(invoiceNo);
  };

  const handleBackFromDetail = () => {
    setSelectedInvoice(null);
  };

  const getHeaderActions = () => {
    const baseActions = (
      <div className="flex gap-3">
        <button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download size={16} />
          Export
        </button>
        <button
          onClick={() => setShowManualChargeModal(true)}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Create Manual Charge
        </button>
        <CreateManualChargeModal
          isOpen={showManualChargeModal}
          onClose={() => setShowManualChargeModal(false)}
          onSuccess={() => {
            // optional: refresh current tab list
            // e.g. trigger a re-fetch in BillableEvents via a state key
            console.log("Manual charge created");
          }}
        />
        <button
          onClick={() => setShowRunBillingModal(true)}
          className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Play size={16} />
          Run Billing
        </button>
      </div>
    );

    return baseActions;
  };

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  if (selectedInvoice) {
    return (
      <InvoiceDetail
        invoiceNo={selectedInvoice}
        onBack={handleBackFromDetail}
      />
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="WMS Billing"
        subtitle="Convert warehouse activities into invoices"
        actions={getHeaderActions()}
      />

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
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
      {ActiveComponent && <ActiveComponent onOpenInvoice={handleOpenInvoice} />}

      {/* Run Billing Modal */}
      <RunBillingModal
        isOpen={showRunBillingModal}
        onClose={() => setShowRunBillingModal(false)}
        onRunBilling={(data) => {
          console.log("Running billing with:", data);
          setShowRunBillingModal(false);
        }}
      />
    </div>
  );
};

export default Billing;

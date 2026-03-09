// src/pages/reports/InventoryAccuracy.jsx
import React, { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";

import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import StatCard from "../components/StatCard";
import CusTable from "../components/CusTable";
import { VarianceCell, Badge } from "./components/helper";

export default function InventoryAccuracy() {
  const [dateRange, setDateRange] = useState("This Month (Oct 2023)");
  const [warehouse, setWarehouse] = useState("All Warehouses");
  const [client, setClient] = useState("All Clients");
  const [zone, setZone] = useState("All Zones");

  const filtersObj = useMemo(
    () => ({ dateRange, warehouse, client, zone }),
    [dateRange, warehouse, client, zone],
  );

  const handleApply = () => console.log("Apply Filters:", filtersObj);

  const handleReset = () => {
    setDateRange("This Month (Oct 2023)");
    setWarehouse("All Warehouses");
    setClient("All Clients");
    setZone("All Zones");
  };

  const rows = [
    {
      id: "SKU-99012",
      sku: "SKU-99012",
      skuDesc: "Wireless Mouse",
      systemQty: 150,
      countedQty: 148,
      variance: -2,
      zoneBin: "Zone A / A-01-02",
      countDate: "Oct 24, 2023",
      approvedBy: "S. Johnson",
      status: "Adjusted",
    },
    {
      id: "SKU-88210",
      sku: "SKU-88210",
      skuDesc: "USB-C Cable 2m",
      systemQty: 500,
      countedQty: 501,
      variance: 1,
      zoneBin: "Zone A / A-04-11",
      countDate: "Oct 23, 2023",
      approvedBy: "M. Lee",
      status: "Adjusted",
    },
    {
      id: "SKU-77341",
      sku: "SKU-77341",
      skuDesc: "Monitor Stand",
      systemQty: 45,
      countedQty: 40,
      variance: -5,
      zoneBin: "Zone B / B-02-01",
      countDate: "Oct 22, 2023",
      approvedBy: "-",
      status: "Pending Approval",
    },
    {
      id: "SKU-10293",
      sku: "SKU-10293",
      skuDesc: "Gaming Headset",
      systemQty: 120,
      countedQty: 120,
      variance: 0,
      zoneBin: "Zone A / A-05-05",
      countDate: "Oct 21, 2023",
      approvedBy: "System",
      status: "Verified",
    },
    {
      id: "SKU-55412",
      sku: "SKU-55412",
      skuDesc: 'Laptop Sleeve 13"',
      systemQty: 75,
      countedQty: 72,
      variance: -3,
      zoneBin: "Zone C / C-12-04",
      countDate: "Oct 20, 2023",
      approvedBy: "-",
      status: "Pending Approval",
    },
    {
      id: "SKU-33211",
      sku: "SKU-33211",
      skuDesc: "Power Bank 10k",
      systemQty: 200,
      countedQty: 200,
      variance: 0,
      zoneBin: "Zone A / A-03-09",
      countDate: "Oct 19, 2023",
      approvedBy: "System",
      status: "Verified",
    },
  ];

  const columns = [
    {
      key: "sku",
      title: "SKU",
      render: (row) => (
        <div>
          <button className="text-blue-600 hover:underline">{row.sku}</button>
          <div className="text-xs text-gray-500">{row.skuDesc}</div>
        </div>
      ),
    },
    { key: "systemQty", title: "System Qty" },
    { key: "countedQty", title: "Counted Qty" },
    {
      key: "variance",
      title: "Variance",
      render: (row) => <VarianceCell v={row.variance} />,
    },
    { key: "zoneBin", title: "Zone / Bin" },
    { key: "countDate", title: "Count Date" },
    { key: "approvedBy", title: "Approved By" },
    {
      key: "status",
      title: "Status",
      render: (row) => {
        if (row.status === "Adjusted")
          return <Badge text="Adjusted" tone="green" />;
        if (row.status === "Verified")
          return <Badge text="Verified" tone="green" />;
        if (row.status === "Pending Approval")
          return <Badge text="Pending Approval" tone="orange" />;
        return <Badge text={row.status} tone="gray" />;
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-5">
        <PageHeader
          title="Inventory Accuracy"
          subtitle="Monitor cycle count variance and approvals"
          breadcrumbs={[
            { label: "Reports", to: "/reports" },
            { label: "Inventory Accuracy" },
          ]}
          actions={
            <>
              {/* <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                <Download className="h-4 w-4" />
                Export Report
              </button> */}
              <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                <Printer className="h-4 w-4" />
                Print
              </button>
            </>
          }
        />

        {/* Filters */}
        <div className="mt-3">
          <FilterBar
            filters={[
              {
                key: "dateRange",
                label: "Date Range",
                value: dateRange,
                options: [
                  "Today",
                  "This Week",
                  "This Month (Oct 2023)",
                  "Last Month",
                ],
              },
              {
                key: "warehouse",
                label: "Warehouse",
                value: warehouse,
                options: [
                  "All Warehouses",
                  "WH-NYC-01",
                  "WH-LA-02",
                  "WH-CHI-03",
                ],
              },
              {
                key: "client",
                label: "Client",
                value: client,
                options: ["All Clients", "Acme Corp", "Globex", "Initech"],
              },
              {
                key: "zone",
                label: "Zone",
                value: zone,
                options: ["All Zones", "Zone A", "Zone B", "Zone C"],
              },
            ]}
            onFilterChange={(key, val) => {
              if (key === "dateRange") setDateRange(val);
              if (key === "warehouse") setWarehouse(val);
              if (key === "client") setClient(val);
              if (key === "zone") setZone(val);
            }}
            onApply={handleApply}
            onReset={handleReset}
            showActions={true}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            title="Cycle Counts Done"
            value="128"
            accentColor="#2563EB"
            subtext="Target: 120/mo"
          />
          <StatCard
            title="Variance % (Overall)"
            value="0.05%"
            accentColor="#7C3AED"
            subtext="Target: < 0.1%"
          />

          <div className="bg-white border rounded-lg p-4 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{ backgroundColor: "#EF4444" }}
            />
            <p className="text-sm text-gray-500">Top Variance SKUs</p>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-2xl font-semibold text-gray-900">3</p>
              <Badge text="Attention" tone="red" />
            </div>
            <p className="mt-1 text-sm text-gray-500">Requiring recount</p>
          </div>

          <StatCard
            title="Net Adjustment Value"
            value="$450.00"
            accentColor="#0F766E"
            subtext="Written off this period"
          />
        </div>

        {/* Table */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Cycle Count Variance Details
            </h3>

            <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              View Pending Approvals
            </button>
          </div>

          <div className="p-2">
            <CusTable columns={columns} data={rows} />
          </div>
        </div>
      </div>
    </div>
  );
}

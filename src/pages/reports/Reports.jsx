// src/pages/reports/Reports.jsx
import React, { useMemo, useState } from "react";
import PageHeader from "../../pages/components/PageHeader";
import FilterBar from "../../pages/components/FilterBar";
import {
  CalendarDays,
  Download,
  Clock,
  Hourglass,
  Target,
  Boxes,
  Activity,
  Package,
  Truck,
  IndianRupee,
} from "lucide-react";

import ReportCard from "./components/ReportCard";
import { ChipSelect } from "./components/helper";

export default function Reports() {
  // UI-only filters (no APIs yet)
  const [dateRange, setDateRange] = useState("This Month");
  const [warehouse, setWarehouse] = useState("WH-NYC-01");
  const [client, setClient] = useState("Acme Corp");
  const [zone, setZone] = useState("All Zones");
  const [user, setUser] = useState("All Users");

  const filters = useMemo(
    () => ({ dateRange, warehouse, client, zone, user }),
    [dateRange, warehouse, client, zone, user],
  );

  const handleApply = () => {
    console.log("Apply filters:", filters);
  };

  const handleReset = () => {
    setDateRange("This Month");
    setWarehouse("WH-NYC-01");
    setClient("Acme Corp");
    setZone("All Zones");
    setUser("All Users");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-7xl sm:px-4 py-5">
        <PageHeader
          title="Reports"
          subtitle="Inbound to dispatch performance, inventory accuracy, space utilization and billing"
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
              >
                <CalendarDays className="h-4 w-4" />
                Schedule Report
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          }
        />

        {/* Filters */}
        <div className="mt-4">
          <FilterBar
            filters={[
              {
                key: "dateRange",
                label: "Date Range",
                value: dateRange,
                options: ["Today", "This Week", "This Month", "Last Month"],
              },
              {
                key: "warehouse",
                label: "Warehouse",
                value: warehouse,
                options: ["WH-NYC-01", "WH-LA-02", "WH-CHI-03"],
              },
              {
                key: "client",
                label: "Client",
                value: client,
                options: ["Acme Corp", "Globex", "Initech"],
              },
              {
                key: "zone",
                label: "Zone",
                value: zone,
                options: ["All Zones", "Zone A", "Zone B", "Zone C"],
              },
              {
                key: "user",
                label: "User",
                value: user,
                options: ["All Users", "Supervisor", "Inbound Exec", "Picker"],
              },
            ]}
            onFilterChange={(key, val) => {
              if (key === "dateRange") setDateRange(val);
              if (key === "warehouse") setWarehouse(val);
              if (key === "client") setClient(val);
              if (key === "zone") setZone(val);
              if (key === "user") setUser(val);
            }}
            onApply={handleApply}
            onReset={handleReset}
          />
        </div>

        {/* Cards */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ReportCard
            title="Inbound TAT"
            Icon={Clock}
            leftLabel="ASNs Received"
            leftValue="156"
            rightLabel="Avg TAT"
            rightValue="4.2h"
            rightSub="↑ 0.5h"
            rightSubTone="danger"
            route="/reports/inboundTAT"
          />

          <ReportCard
            title="Putaway Aging"
            Icon={Hourglass}
            leftLabel="Pending Tasks"
            leftValue="45"
            rightLabel="Aging > 24h"
            rightValue="2"
            rightSubTone="danger"
            route="/putawayAging"
          />

          {/* <ReportCard
            title="Inventory Accuracy"
            Icon={Target}
            leftLabel="Cycle Counts"
            leftValue="128"
            rightLabel="Variance"
            rightValue="0.05%"
            rightSub="↓ 0.02%"
            rightSubTone="success"
            route="/inventoryAccuracy"
          /> */}

          <ReportCard
            title="Space Utilization"
            Icon={Boxes}
            leftLabel="Avg Utilized"
            leftValue="85%"
            rightLabel="Overfilled"
            rightValue=""
            rightSub="High"
            rightSubTone="danger"
            route="/spaceUtilization"
          />

          <ReportCard
            title="Pick Productivity"
            Icon={Activity}
            leftLabel="Picks / Hour"
            leftValue="142"
            rightLabel="Avg Time"
            rightValue="3m 45s"
            rightSub="↓ 12s"
            rightSubTone="success"
            route="/pickProductivity"
          />

          <ReportCard
            title="Pack Productivity"
            Icon={Package}
            leftLabel="Cartons / Hour"
            leftValue="58"
            rightLabel="Avg Pack Time"
            rightValue="6m 10s"
            rightSub="Stable"
            rightSubTone="neutral"
            route="/packProductivity"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ReportCard
            title="Outbound SLA"
            Icon={Truck}
            leftLabel="Orders Shipped"
            leftValue="1,240"
            rightLabel="Within SLA"
            rightValue=""
            rightSub="98.5%"
            rightSubTone="success"
            route="/outboundSLA"
          />

          <ReportCard
            title="Billing Revenue"
            Icon={IndianRupee}
            leftLabel="Billable Events"
            leftValue="5,600"
            rightLabel="Est. Revenue"
            rightValue="₹4.5L"
            rightSub="↑ ₹25K"
            rightSubTone="success"
            route="/billingRevenue"
          />
        </div>
      </div>
    </div>
  );
}

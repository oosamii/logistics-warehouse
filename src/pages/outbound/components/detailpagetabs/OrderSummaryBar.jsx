// components/OrderSummaryBar.jsx
import React from "react";
import { Pill } from "../helpers";

const OrderSummaryBar = ({ order }) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xl font-semibold text-gray-900">
              {order.orderNo}
            </div>
            <Pill text={order.status} tone={order.statusTone || "gray"} />
            <Pill
              text={order.allocationBadge}
              tone={order.allocationTone || "gray"}
            />
            <Pill
              text={order.priorityBadge}
              tone={order.priorityTone || "gray"}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <div className="text-[11px] font-medium text-gray-500">
                CLIENT
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {order.client}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-gray-500">
                SHIP TO
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {order.shipTo}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-gray-500">
                SLA DUE
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {order.slaDue}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-gray-500">
                LINES / UNITS
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {order.lines} / {order.units}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {/* <button className="px-3 py-1.5 text-xs rounded-md bg-blue-50 text-blue-700">
            Open Picking
          </button>
          <button className="px-3 py-1.5 text-xs rounded-md bg-blue-50 text-blue-700">
            Open Packing
          </button>
          <button className="px-3 py-1.5 text-xs rounded-md bg-blue-50 text-blue-700">
            Open Billing
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryBar;

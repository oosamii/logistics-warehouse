// tabs/LinesTab.jsx
import React, { useMemo } from "react";
import { Layers } from "lucide-react";
import CusTable from "../../../components/CusTable";
import { pillToneForLineStatus, Pill } from "../helpers";

const LinesTab = ({ lines = [] }) => {
  const formattedRows = useMemo(() => {
    return lines.map((line) => {
      const allocatedQty = parseFloat(line.allocated_qty || 0);
      const orderedQty = parseFloat(line.ordered_qty || 0);
      const pickedQty = parseFloat(line.picked_qty || 0);
      const packedQty = parseFloat(line.packed_qty || 0);
      const shippedQty = parseFloat(line.shipped_qty || 0);

      let status = "Pending";
      if (allocatedQty === 0) status = "No Stock";
      else if (allocatedQty < orderedQty) status = "Partial";
      else if (allocatedQty === orderedQty) status = "Fully Allocated";

      return {
        id: line.id,
        sku: line.sku?.sku_code || "—",
        name: line.sku?.sku_name || "—",
        requested: orderedQty.toFixed(2),
        allocated: allocatedQty.toFixed(2),
        picked: pickedQty.toFixed(2),
        packed: packedQty.toFixed(2),
        shipped: shippedQty.toFixed(2),
        rule: line.allocation_rule || "FIFO",
        status: status,
        skuData: line.sku,
        lineData: line,
      };
    });
  }, [lines]);

  const columns = useMemo(
    () => [
      {
        key: "sku",
        title: "SKU",
        render: (r) => (
          <div>
            <div className="text-sm font-semibold text-gray-900">{r.sku}</div>
            <div className="text-xs text-gray-500">{r.name}</div>
          </div>
        ),
      },
      { key: "requested", title: "Requested" },
      { key: "allocated", title: "Allocated" },
      { key: "picked", title: "Picked" },
      { key: "packed", title: "Packed" },
      { key: "shipped", title: "Shipped" },
      { key: "rule", title: "Rule" },
      {
        key: "status",
        title: "Status",
        render: (r) => (
          <Pill text={r.status} tone={pillToneForLineStatus(r.status)} />
        ),
      },
      // {
      //   key: "actions",
      //   title: "Actions",
      //   render: () => (
      //     <button className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-gray-100 text-gray-700">
      //       <Layers size={16} />
      //     </button>
      //   ),
      // },
    ],
    [],
  );

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <div className="text-gray-500">No line items found</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <CusTable columns={columns} data={formattedRows} />
    </div>
  );
};

export default LinesTab;

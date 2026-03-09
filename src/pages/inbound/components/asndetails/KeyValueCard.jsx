import React from "react";
import { Pencil } from "lucide-react";

const KeyValueCard = ({ title, items = [], onEdit }) => {
  return (
    <div className="h-full rounded-lg border border-gray-200 bg-white p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        {/* {onEdit && (
          <button className="text-gray-400 hover:text-gray-700">✎</button>
        )} */}
      </div>

      <div className="space-y-3 flex-1">
        {items.map((it, idx) => (
          <div key={idx} className="flex justify-between gap-6">
            <div className="text-sm text-gray-500">{it.label}</div>
            <div className="text-sm font-medium text-gray-900 text-right truncate max-w-[60%]">
              {it.value || "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyValueCard;

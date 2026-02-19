// packing/components/ItemsToPack.jsx
import React from "react";

const ItemsToPack = ({ items, selectedItemId, onSelectItem }) => {
  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b px-5 py-4 font-semibold">Items To Pack</div>

      {/* 👇 Add this wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="px-2 py-3 text-left">SKU</th>
              <th className="px-2 py-3 text-left">Ordered</th>
              <th className="px-2 py-3 text-left">Picked</th>
              <th className="px-2 py-3 text-left">Packed</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {items.map((line) => {
              const isSelected = selectedItemId === line.id;

              return (
                <tr
                  key={line.id}
                  onClick={() => onSelectItem(line)}
                  className={`cursor-pointer transition 
                    ${
                      isSelected
                        ? "bg-gray-100 border-l-4 border-black"
                        : "hover:bg-gray-50"
                    }`}
                >
                  <td className="px-2 py-4">
                    <div className="font-semibold">{line.sku?.sku_code}</div>
                    <div className="text-xs text-gray-500">
                      {line.sku?.sku_name}
                    </div>
                  </td>
                  <td className="px-2 py-4">{line.ordered_qty}</td>
                  <td className="px-2 py-4">{line.picked_qty}</td>
                  <td className="px-2 py-4">{line.packed_qty}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemsToPack;

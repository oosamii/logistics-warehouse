// packing/components/CurrentCarton.jsx
import React, { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import http from "../../../api/http";

const CurrentCarton = ({
  orderId,
  cartons,
  refreshCartons,
  refreshItems,
  selectedItem,
}) => {
  const [selectedCartonId, setSelectedCartonId] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  /* -------- SELECTED CARTON OBJECT -------- */
  const selectedCarton = useMemo(() => {
    return cartons.find((c) => c.id === Number(selectedCartonId)) || null;
  }, [selectedCartonId, cartons]);

  const remainingQty = useMemo(() => {
    if (!selectedItem) return 0;

    const packedInCartons = cartons.reduce((total, carton) => {
      const found = carton.items?.find(
        (i) => i.sales_order_line_id === selectedItem.id,
      );
      return total + (found?.qty || 0);
    }, 0);

    return Math.max(selectedItem.picked_qty - packedInCartons, 0);
  }, [cartons, selectedItem]);

  const isClosed = selectedCarton?.status === "CLOSED";
  const isEmpty = !selectedCarton?.items?.length;

  /* -------- ADD ITEM -------- */
  const handleAddItem = async () => {
    if (!selectedItem || !selectedCarton) return;
    if (isClosed) return;
    if (qty <= 0 || qty > remainingQty) return;

    try {
      setLoading(true);

      await http.post(
        `/packing/${orderId}/cartons/${selectedCarton.id}/items/`,
        {
          sales_order_line_id: selectedItem.id,
          sku_id: selectedItem.sku?.id,
          qty: Number(qty),
          batch_no: "",
          serial_no: "",
        },
      );

      await refreshCartons();
      setQty(1);
    } catch (error) {
      console.error("Add item failed", error);
    } finally {
      setLoading(false);
    }
  };

  /* -------- DELETE ITEM -------- */
  const handleDelete = async (itemId) => {
    if (!selectedCarton || isClosed) return;

    try {
      await http.delete(
        `/packing/${orderId}/cartons/${selectedCarton.id}/items/${itemId}`,
      );

      refreshCartons();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  /* -------- CLOSE CARTON -------- */
  const handleClose = async () => {
    if (!selectedCarton) return;
    if (isClosed) return;
    if (isEmpty) return;

    try {
      await http.put(`/packing/${orderId}/cartons/${selectedCarton.id}/close`, {
        gross_weight: 2.5,
        net_weight: 2.0,
      });

      refreshCartons();
    } catch (error) {
      console.error("Close failed", error);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      {/* -------- Carton Selector -------- */}
      <div>
        <div className="font-semibold mb-2">Select Carton</div>
        <select
          value={selectedCartonId}
          onChange={(e) => setSelectedCartonId(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        >
          <option value="">Choose Carton</option>
          {cartons.map((carton) => (
            <option key={carton.id} value={carton.id}>
              {carton.carton_no} ({carton.status})
            </option>
          ))}
        </select>
      </div>

      {/* -------- Carton Info -------- */}
      {selectedCarton && (
        <>
          <div className="text-sm text-gray-600">
            Status:{" "}
            <span
              className={
                isClosed ? "text-red-500 font-medium" : "text-green-600"
              }
            >
              {selectedCarton.status}
            </span>
          </div>

          {/* -------- Items In Carton -------- */}
          <div className="space-y-2">
            {isEmpty && (
              <div className="text-sm text-gray-500">No items added yet.</div>
            )}

            {selectedCarton.items?.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center border rounded px-3 py-2"
              >
                <span className="text-sm">
                  {item.sku?.sku_code} × {item.qty}
                </span>

                {!isClosed && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:opacity-70"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* -------- Add Item Section -------- */}
          <div className="border-t pt-4 space-y-3">
            {selectedItem && !isClosed ? (
              <>
                <div className="text-sm">
                  Adding:{" "}
                  <span className="font-semibold">
                    {selectedItem.sku?.sku_code}
                  </span>
                </div>

                <div className="text-xs text-gray-500">
                  Remaining: {remainingQty}
                </div>

                <input
                  type="number"
                  min="1"
                  max={remainingQty}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="border px-3 py-2 rounded w-full"
                />

                <button
                  onClick={handleAddItem}
                  disabled={
                    loading ||
                    !selectedCarton ||
                    !selectedItem ||
                    isClosed ||
                    remainingQty <= 0
                  }
                  className="bg-blue-600 disabled:bg-gray-400 text-white w-full py-2 rounded-md flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  {loading ? "Adding..." : "Add to Carton"}
                </button>
              </>
            ) : (
              <div className="text-sm text-gray-500">
                Select an item and open carton to add
              </div>
            )}

            {/* -------- Close Carton -------- */}
            <button
              onClick={handleClose}
              disabled={!selectedCarton || isClosed || isEmpty}
              className="w-full border py-2 rounded-md disabled:opacity-50"
            >
              Close Carton
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrentCarton;

// packing/components/CurrentCarton.jsx
import React, { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import http from "../../../api/http";
import { useToast } from "../../components/toast/ToastProvider";

const CurrentCarton = ({
  orderId,
  cartons,
  refreshCartons,
  refreshItems,
  selectedItem,
}) => {
  const [selectedCartonId, setSelectedCartonId] = useState("");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);

  const [closing, setClosing] = useState(false);

  const toast = useToast();

  const selectedCarton = useMemo(() => {
    return cartons.find((c) => c.id === Number(selectedCartonId)) || null;
  }, [selectedCartonId, cartons]);

  const remainingQty = useMemo(() => {
    if (!selectedItem) return 0;

    const picked = Number(selectedItem.picked_qty || 0);
    const packed = Number(selectedItem.packed_qty || 0);

    return Math.max(picked - packed, 0);
  }, [selectedItem]);

  const isClosed = selectedCarton?.status === "CLOSED";
  const isEmpty = !selectedCarton?.items?.length;

  const handleAddItem = async () => {
    if (!selectedItem || !selectedCarton) return;
    if (isClosed) return;

    const numericQty = Number(qty);

    if (!numericQty || numericQty <= 0) {
      toast.error("Quantity must be greater than 0.");
      return;
    }

    if (numericQty > remainingQty) {
      toast.error(`Only ${remainingQty} unit(s) remaining to pack.`);
      return;
    }

    try {
      setLoading(true);

      const res = await http.post(
        `/packing/${orderId}/cartons/${selectedCarton.id}/items/`,
        {
          sales_order_line_id: selectedItem.id,
          sku_id: selectedItem.sku?.id,
          qty: numericQty,
          batch_no: "",
          serial_no: "",
        },
      );

      if (res?.data?.success) {
        toast.success(res?.data?.message);
      }

      await refreshItems();
      await refreshCartons();
      setQty("");
    } catch (error) {
      console.log(error?.response);
      toast.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!selectedCarton || isClosed) return;

    try {
      const res = await http.delete(
        `/packing/${orderId}/cartons/${selectedCarton.id}/items/${itemId}`,
      );

      if (res?.data?.success) {
        toast.success(res?.data?.message);
      }

      await refreshCartons();
      await refreshItems();
    } catch (error) {
      console.log(error?.response);
      toast.error(error?.response?.data?.message);
    }
  };

  const handleClose = async () => {
    if (!selectedCarton) return;
    if (isClosed) return;
    if (isEmpty) return;

    try {
      setClosing(true);

      const res = await http.put(
        `/packing/${orderId}/cartons/${selectedCarton.id}/close`,
        {
          gross_weight: 2.5,
          net_weight: 2.0,
        },
      );

      if (res?.data?.success) {
        toast.success(res?.data?.message);
      }

      await refreshCartons();
      await refreshItems();
    } catch (error) {
      console.log(error?.response);
      toast.error(error?.response?.data?.message);
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
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
                  max={remainingQty}
                  value={qty}
                  placeholder="Quatity"
                  onChange={(e) => setQty(e.target.value)}
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

            <button
              onClick={handleClose}
              disabled={closing || isClosed || isEmpty}
              className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50 w-full"
            >
              {closing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Closing...
                </span>
              ) : (
                "Close Carton"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrentCarton;

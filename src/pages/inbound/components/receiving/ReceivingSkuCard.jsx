// src/pages/inbound/components/receiving/ReceivingSkuCard.jsx
import React, { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

const ReceivingSkuCard = ({
  skuTitle,
  partialText,

  pallets = [],
  selectedPalletId,
  setSelectedPalletId,

  onCreatePallet,
  allowPalletCreate = true,
  palletType,
  setPalletType,
  palletLocation,
  setPalletLocation,

  batchNo,
  setBatchNo,
  serialNo,
  setSerialNo,
  expiryDate,
  setExpiryDate,
  goodQty,
  setGoodQty,
  damagedQty,
  setDamagedQty,

  onReceive,
  loading,

  receipts = [],
  onDeleteReceipt,
  onCancel,
  receiptsLoading = false,
}) => {
  const [showCreate, setShowCreate] = useState(false);

  const palletOptions = useMemo(() => pallets || [], [pallets]);

  const handleCreate = async () => {
    console.log("Create pallet clicked", {
      onCreatePallet,
      palletType,
      palletLocation,
    });

    if (typeof onCreatePallet !== "function") {
      console.error("onCreatePallet is NOT a function. Check parent props.");
      return;
    }
    await onCreatePallet();
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {skuTitle}
          </div>
          {partialText && (
            <div className="text-xs text-gray-500 mt-0.5">{partialText}</div>
          )}
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 bg-red-500 px-2 py-1 text-xs text-white rounded-md hover:underline"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Pallet Select */}
      <div className="mt-4">
        <label className="text-xs text-gray-500">Pallet</label>
        <select
          value={selectedPalletId || ""}
          onChange={(e) => setSelectedPalletId?.(e.target.value || "")}
          className="w-full mt-1 rounded-md border px-3 py-2 text-sm bg-white"
        >
          <option value="">Create New Pallet (auto)</option>
          {palletOptions.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.pallet_id} • {p.pallet_type} • {p.status}
            </option>
          ))}
        </select>

        {allowPalletCreate && (
          <button
            type="button"
            className="mt-2 text-xs text-primary underline"
            onClick={() => setShowCreate((s) => !s)}
          >
            {showCreate ? "Hide Pallet Create" : "Create Pallet"}
          </button>
        )}

        {allowPalletCreate && showCreate && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Pallet Type</label>
              <input
                value={palletType || ""}
                onChange={(e) => setPalletType?.(e.target.value)}
                className="w-full mt-1 rounded-md border px-3 py-2 text-sm"
                placeholder="Standard / NORMAL"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Current Location</label>
              <input
                value={palletLocation || ""}
                onChange={(e) => setPalletLocation?.(e.target.value)}
                className="w-full mt-1 rounded-md border px-3 py-2 text-sm"
                placeholder="DOCK-A"
              />
            </div>

            <button
              type="button"
              disabled={!!loading}
              onClick={handleCreate}
              className="col-span-2 px-3 py-2 rounded-md text-sm border bg-white disabled:opacity-60"
            >
              Create & Select Pallet
            </button>
          </div>
        )}
      </div>

      {/* Batch / Serial / Expiry */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">Batch No</label>
          <input
            value={batchNo || ""}
            onChange={(e) => setBatchNo?.(e.target.value)}
            className="w-full mt-1 rounded-md border px-3 py-2 text-sm"
            placeholder="BATCH-5595"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500">Serial No</label>
          <input
            value={serialNo || ""}
            onChange={(e) => setSerialNo?.(e.target.value)}
            className="w-full mt-1 rounded-md border px-3 py-2 text-sm"
            placeholder="SER-022"
          />
        </div>

        <div className="col-span-2">
          <label className="text-xs text-gray-500">Expiry Date</label>
          <input
            type="date"
            value={expiryDate || ""}
            onChange={(e) => setExpiryDate?.(e.target.value)}
            className="w-full mt-1 rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Qty */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">Good Qty</label>
          <input
            type="number"
            value={goodQty || ""}
            placeholder="Quantity"
            onChange={(e) => setGoodQty?.(e.target.value)}
            className="w-full mt-1 rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Damaged Qty</label>
          <input
            type="number"
            value={damagedQty || ""}
            placeholder="Quantity"
            onChange={(e) => setDamagedQty?.(e.target.value)}
            className="w-full mt-1 rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!!loading}
        onClick={() => {
          console.log("Receive clicked", { onReceive });
          onReceive?.();
        }}
        className="mt-4 w-full px-4 py-2 rounded-md text-sm bg-primary text-white disabled:opacity-60"
      >
        Add Receiving
      </button>

      {/* Current Session Receipts */}
      <div className="mt-5">
        <div className="text-xs font-medium text-gray-600 mb-2">
          Current Session Receipts
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs text-gray-500 bg-gray-50">
            <div>Pallet</div>
            <div>Batch</div>
            <div>Serial</div>
            <div className="text-right">Good</div>
            <div className="text-right">Dmg</div>
          </div>

          {receiptsLoading ? (
            <div className="px-3 py-3 text-sm text-gray-500 border-t">
              Loading...
            </div>
          ) : receipts?.length ? (
            receipts.map((r) => (
              <div key={r.id} className="border-t px-3 py-2">
                <div className="grid grid-cols-5 gap-2 text-sm items-center">
                  <div>{r?.pallet?.pallet_id || "-"}</div>
                  <div>{r.batch_no || "-"}</div>
                  <div>{r.serial_no || "-"}</div>
                  <div className="text-right">{r.good_qty ?? 0}</div>
                  <div className="text-right">{r.damaged_qty ?? 0}</div>
                </div>

                <div className="mt-1 text-[11px] text-gray-500">
                  Received:{" "}
                  {r.received_at
                    ? new Date(r.received_at).toLocaleString()
                    : "-"}
                  {" • "}
                  By: {r.receiver?.username || "-"}
                </div>
              </div>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-gray-400 border-t">
              No receipts found for this line
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceivingSkuCard;

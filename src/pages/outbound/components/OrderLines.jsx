import React, { useState } from "react";
import { Trash2, Edit } from "lucide-react";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import { useToast } from "../../components/toast/ToastProvider";
import AddOrderLineModal from "./AddOrderLineModal";

const ReadOnlyLines = ({ data = [] }) => (
  <div className="space-y-3">
    {data.map((l, i) => (
      <div
        key={l.id || i}
        className="border border-gray-200 rounded-lg p-3 bg-white md:border-0 md:p-0 md:bg-transparent"
      >
        <div className="grid grid-cols-2 gap-2 text-sm md:hidden">
          <div>
            <span className="font-medium text-gray-500">SKU:</span>{" "}
            <span className="text-gray-900">{l.sku || ""}</span>
          </div>
          <div>
            <span className="font-medium text-gray-500">Qty:</span>{" "}
            <span className="text-gray-900">{l.ordered_qty || ""}</span>
          </div>
          <div>
            <span className="font-medium text-gray-500">UOM:</span>{" "}
            <span className="text-gray-900">{l.uom || ""}</span>
          </div>
          <div>
            <span className="font-medium text-gray-500">Rule:</span>{" "}
            <span className="text-gray-900">{l.allocation_rule || ""}</span>
          </div>
          {l.unit_price && (
            <div>
              <span className="font-medium text-gray-500">Price:</span>{" "}
              <span className="text-gray-900">{l.unit_price}</span>
            </div>
          )}
        </div>

        <div className="hidden md:grid md:grid-cols-12 md:gap-3 md:py-2 md:text-sm md:text-gray-600">
          <div className="col-span-3">{l.sku || ""}</div>
          <div className="col-span-2">{l.ordered_qty || ""}</div>
          <div className="col-span-2">{l.uom || ""}</div>
          <div className="col-span-2">{l.allocation_rule || ""}</div>
          <div className="col-span-2">
            {l.unit_price ? `$${l.unit_price}` : "-"}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const OrderLines = ({ lines = [], onChange, disabled, clientId }) => {
  const [deleteIdx, setDeleteIdx] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, idx: null });
  const toast = useToast();

  // Handle adding new line
  const handleAddLine = (lineData) => {
    const newLines = [...lines, lineData];
    onChange?.(newLines);
    toast.success("Order line added successfully");
  };

  // Handle editing existing line
  const handleEditLine = (lineData) => {
    if (editModal.idx === null) return;
    const newLines = [...lines];
    newLines[editModal.idx] = lineData;
    onChange?.(newLines);
    setEditModal({ open: false, idx: null });
    toast.success("Order line updated successfully");
  };

  // Handle deleting line
  const handleConfirmDelete = () => {
    if (deleteIdx === null) return;
    const newLines = lines.filter((_, idx) => idx !== deleteIdx);
    onChange?.(newLines);
    setDeleteIdx(null);
    toast.success("Order line deleted successfully");
  };

  if (disabled) return <ReadOnlyLines data={lines} />;

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-3 py-3 border-b md:px-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">Order Lines</div>
          <button
            type="button"
            onClick={() => setAddModal(true)}
            className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
          >
            + Add Line
          </button>
        </div>

        <div className="px-3 py-3 md:px-4">
          {lines.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No order lines added yet</p>
              <button
                type="button"
                onClick={() => setAddModal(true)}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Add your first line
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 mt-3 md:mt-0">
                {lines.map((l, idx) => (
                  <div key={l.id || idx}>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2 md:hidden">
                      ...your mobile card content...
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden sm:block overflow-x-auto mt-3">
                <div className="min-w-[500px]">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold ... pb-1">
                    <div className="col-span-2">SKU</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">UOM</div>
                    <div className="col-span-2">Allocation Rule</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-2">Actions</div>
                  </div>

                  <div className="divide-y">
                    {lines.map((l, idx) => (
                      <div
                        key={l.id || idx}
                        className="grid grid-cols-12 gap-2 py-2 items-center"
                      >
                        <div className="col-span-2">
                          <div className="text-sm text-gray-900">
                            {l.sku || "-"}
                          </div>
                          {l.batch_preference && (
                            <div className="text-xs text-gray-500">
                              Batch: {l.batch_preference}
                            </div>
                          )}
                        </div>

                        <div className="col-span-2 text-sm text-gray-900">
                          {l.ordered_qty || "-"}
                        </div>
                        <div className="col-span-2 text-sm text-gray-600">
                          {l.uom || "-"}
                        </div>
                        <div className="col-span-2 text-sm text-gray-600">
                          {l.allocation_rule || "-"}
                        </div>

                        <div className="col-span-2">
                          <div className="text-sm text-gray-900">
                            {l.unit_price
                              ? `$${parseFloat(l.unit_price).toFixed(2)}`
                              : "-"}
                          </div>
                          {l.discount_percent > 0 && (
                            <div className="text-xs text-green-600">
                              -{l.discount_percent}% off
                            </div>
                          )}
                        </div>

                        <div className="col-span-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditModal({ open: true, idx })}
                            className="p-2 rounded-md hover:bg-gray-50 text-gray-400 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteIdx(idx)}
                            className="p-2 rounded-md hover:bg-gray-50 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        {/* <div className="px-3 py-3 border-t md:px-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900"></div>
          <div className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors">
            total Quetity
          </div>
        </div> */}
      </div>

      <AddOrderLineModal
        open={addModal}
        clientId={clientId}
        onClose={() => setAddModal(false)}
        onSave={handleAddLine}
      />

      <AddOrderLineModal
        open={editModal.open}
        clientId={clientId}
        editLine={editModal.idx !== null ? lines[editModal.idx] : null}
        onClose={() => setEditModal({ open: false, idx: null })}
        onSave={handleEditLine}
      />

      <ConfirmDeleteModal
        open={deleteIdx !== null}
        title="Delete line?"
        message="Are you sure you want to delete this order line?"
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setDeleteIdx(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default OrderLines;

// pages/picking/PickTaskDetail.jsx
import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  Clock,
  User,
  KeyRound,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import http from "../../api/http";
import { format } from "date-fns";
import { useToast } from "../components/toast/ToastProvider";
import PaginatedEntityDropdown from "../inbound/components/asnform/common/PaginatedEntityDropdown";
import { useNavigate, useParams } from "react-router-dom";
import FormPage from "../components/forms/FormPage";

const StatusChip = ({ text }) => {
  const statusMap = {
    PENDING: { label: "Pending", className: "bg-gray-100 text-gray-600" },
    ASSIGNED: { label: "Assigned", className: "bg-blue-100 text-blue-700" },
    "IN PROGRESS": {
      label: "In Progress",
      className: "bg-orange-100 text-orange-700",
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-orange-100 text-orange-700",
    },
    COMPLETED: { label: "Completed", className: "bg-green-100 text-green-700" },
    DONE: { label: "Done", className: "bg-green-100 text-green-700" },
    EXCEPTION: { label: "Exception", className: "bg-red-100 text-red-700" },
    CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-700" },
    Current: { label: "Current", className: "bg-blue-100 text-blue-700" },
    Done: { label: "Done", className: "bg-green-100 text-green-700" },
    "In Progress": {
      label: "In Progress",
      className: "bg-orange-100 text-orange-700",
    },
    Pending: { label: "Pending", className: "bg-gray-100 text-gray-600" },
  };

  const statusInfo = statusMap[text] || {
    label: text,
    className: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}
    >
      {statusInfo.label}
    </span>
  );
};

const StepBadge = ({ state, index }) => {
  if (state === "done" || state === "completed") {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold">
        ✓
      </div>
    );
  }
  if (state === "current" || state === "in_progress") {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
        {index}
      </div>
    );
  }
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
      {index}
    </div>
  );
};

const PickTaskDetail = () => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const toast = useToast();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [binScan, setBinScan] = useState("");
  const [skuScan, setSkuScan] = useState("");
  const [qty, setQty] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectedUser, setSelectedUser] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [exceptionType, setExceptionType] = useState(null);

  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionNotes, setExceptionNotes] = useState("");

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  useEffect(() => {
    if (
      task &&
      (task.status === "IN PROGRESS" || task.status === "IN_PROGRESS")
    ) {
      setQty(task.qty_to_pick || "");
    }
  }, [task]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await http.get(`/pick-tasks/${taskId}`);
      setTask(response.data);

      // Pre-fill bin scan with source location if task is in progress
      if (
        response.data.status === "IN PROGRESS" ||
        response.data.status === "IN_PROGRESS"
      ) {
        setBinScan(response.data.sourceLocation?.location_code || "");
      }
    } catch (err) {
      console.error("Error fetching task details:", err);
      setError(err.response?.data?.message || "Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm");
    } catch {
      return dateString;
    }
  };

  const formatTimeElapsed = (startTime) => {
    if (!startTime) return "0m 0s";
    try {
      const start = new Date(startTime);
      const now = new Date();
      const diffInSeconds = Math.floor((now - start) / 1000);

      const minutes = Math.floor(diffInSeconds / 60);
      const seconds = diffInSeconds % 60;

      return `${minutes}m ${seconds}s`;
    } catch {
      return "N/A";
    }
  };

  const handleCompleteTask = async () => {
    if (!qty || parseFloat(qty) <= 0) {
      toast.error("Enter valid quantity");
      return;
    }

    if (parseFloat(qty) !== parseFloat(task.qty_to_pick)) {
      toast.error("Quantity must match required amount for full completion");
      return;
    }

    try {
      setSubmitting(true);

      const response = await http.post(`/pick-tasks/${taskId}/complete`, {
        qty_picked: parseFloat(qty),
        short_pick_reason: "",
        short_pick_notes: "",
      });

      if (response.data) {
        toast.success("Task completed successfully!");
        fetchTaskDetails();
        setQty("");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to complete task");
    } finally {
      setSubmitting(false);
    }
  };

  const openRaiseException = () => {
    setExceptionType("exception");
    setExceptionReason("");
    setExceptionNotes("");
    setExceptionModalOpen(true);
  };

  const openPartialPick = () => {
    if (!qty || parseFloat(qty) <= 0) {
      toast.error("Enter picked quantity");
      return;
    }

    if (parseFloat(qty) >= parseFloat(task.qty_to_pick)) {
      toast.error("Use Complete Task for full quantity");
      return;
    }

    setExceptionType("partial");
    setExceptionReason("");
    setExceptionNotes("");
    setExceptionModalOpen(true);
  };

  const handleSubmitException = async () => {
    if (!exceptionReason) {
      toast.error("Reason is required");
      return;
    }

    try {
      setSubmitting(true);

      if (exceptionType === "exception") {
        await http.post(`/pick-tasks/${taskId}/exception`, {
          reason: exceptionReason,
          notes: exceptionNotes || "",
          qty_short: parseFloat(task.qty_to_pick) - parseFloat(qty || 0),
        });

        toast.success("Exception logged successfully!");
      }

      if (exceptionType === "partial") {
        await http.post(`/pick-tasks/${taskId}/complete`, {
          qty_picked: parseFloat(qty),
          short_pick_reason: exceptionReason,
          short_pick_notes: exceptionNotes || "",
        });

        toast.success("Partial pick recorded successfully!");
      }

      setExceptionModalOpen(false);
      fetchTaskDetails();
      setQty("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelfAssign = async () => {
    try {
      setAssigning(true);

      await http.post(`/pick-tasks/self-assign`, {
        wave_id: task.wave?.id,
      });

      toast.success("Task assigned to you");
      fetchTaskDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || "Self assign failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignToUser = async () => {
    if (!selectedUser) {
      toast.error("Select a user");
      return;
    }

    try {
      setAssigning(true);

      await http.post(`/pick-tasks/assign`, {
        task_ids: [task.id],
        user_id: selectedUser,
      });

      toast.success("Task assigned successfully");
      fetchTaskDetails();
      setSelectedUser("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleStartTask = async () => {
    try {
      setSubmitting(true);

      const response = await http.post(`/pick-tasks/${taskId}/start`);

      if (response.data) {
        toast.success("Task started successfully!");
        fetchTaskDetails();
      }
    } catch (err) {
      console.error("Error starting task:", err);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to start task",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E9F1FB] p-4 lg:p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-[#E9F1FB] p-4 lg:p-6">
        <div className="mx-auto 2xl:max-w-[1900px]">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 lg:p-6">
            <div className="flex items-center gap-3 text-red-800 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-semibold">Error Loading Task</h3>
            </div>
            <p className="text-red-700 mb-4">{error || "Task not found"}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const normalizeStatus = (status) => {
    if (!status) return "PENDING";
    return status.toUpperCase().replace(/\s+/g, "_");
  };

  const status = normalizeStatus(task.status);

  const isPending = status === "PENDING";
  const isAssigned = status === "ASSIGNED";
  const isCompleted = status === "COMPLETED" || status === "DONE";
  const isInProgress = status === "IN_PROGRESS";

  const mappedTask = task
    ? {
        id: task.id,
        taskNo: task.task_no,
        status: normalizeStatus(task.status),
        waveNo: task.wave?.wave_no || "N/A",
        zone: task.sourceLocation?.zone
          ? `Zone ${task.sourceLocation.zone}`
          : task.wave?.zone_filter || "N/A",
        bin: task.sourceLocation?.location_code || "N/A",
        skuCode: task.orderLine?.sku?.sku_code || "N/A",
        skuName: task.orderLine?.sku?.sku_name || "",
        client: task.order?.client_id || "N/A",
        picker: task.picker
          ? `${task.picker.first_name} ${task.picker.last_name}`.trim() ||
            task.picker.username
          : "Unassigned",
        qtyToPick: Number(task.qty_to_pick || 0),
        qtyPicked: Number(task.qty_picked || 0),
      }
    : null;

  const steps = [
    {
      idx: 1,
      state:
        task.status === "COMPLETED" || task.status === "DONE"
          ? "done"
          : task.status === "IN_PROGRESS" || task.status === "ASSIGNED"
            ? "current"
            : "pending",
      bin: task.sourceLocation?.location_code || "N/A",
      sku: task.orderLine?.sku?.sku_code || "N/A",
      skuSub: task.orderLine?.sku?.sku_name || "N/A",
      req: Number(task.qty_to_pick || 0),
      picked: Number(task.qty_picked || 0),
      status: task.status,
    },
  ];

  return (
    <FormPage
      breadcrumbs={[
        { label: "Outbound", to: "/picking?tab=tasks" },
        { label: "Pick Task Detail" },
      ]}
      title={`Pick Task ${mappedTask.taskNo}`}
      topActions={
        <>
          <StatusChip text={mappedTask.status} />

          {isPending && (
            <>
              <button
                type="button"
                onClick={handleSelfAssign}
                disabled={assigning}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Self Assign
              </button>

              <button
                type="button"
                onClick={handleAssignToUser}
                disabled={assigning || !selectedUser}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Assign To
              </button>
              <div className="w-full lg:w-60">
                <PaginatedEntityDropdown
                  endpoint="/users"
                  listKey="users"
                  value={selectedUser}
                  onChange={(val) => setSelectedUser(val)}
                  placeholder="Assign to user"
                  enableSearch
                  searchParam="search"
                  renderItem={(u) => ({
                    title: u.first_name + u.last_name || u.username,
                    subtitle: u.email,
                  })}
                />
              </div>
            </>
          )}

          {isAssigned && (
            <button
              type="button"
              onClick={handleStartTask}
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Start Task
            </button>
          )}
        </>
      }
      bottomRight={
        isInProgress && (
          <>
            <button
              onClick={handleCompleteTask}
              disabled={submitting}
              className="bg-green-600 text-white px-4 py-2 rounded-md"
            >
              Complete
            </button>

            <button
              onClick={openRaiseException}
              disabled={submitting}
              className="border border-red-300 text-red-700 px-4 py-2 rounded-md"
            >
              Raise Exception
            </button>

            <button
              onClick={openPartialPick}
              disabled={submitting || !qty || parseFloat(qty) <= 0}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md"
            >
              Partial Pick
            </button>
          </>
        )
      }
    >
      <div className="bg-[#E9F1FB] p-4 lg:p-6 space-y-4 rounded-lg">
        <div className="rounded-lg border border-gray-200 bg-white p-4 lg:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500">Task ID</div>
              <div className="text-sm font-semibold text-gray-900">
                {mappedTask.taskNo}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500">Wave ID</div>
              <div className="text-sm font-semibold text-blue-600">
                {mappedTask.waveNo}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500">Client</div>
              <div className="text-sm font-semibold text-gray-900">
                Client {mappedTask.client}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500">Zone</div>
              <div className="text-sm font-semibold text-gray-900">
                {mappedTask.zone}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500">
                Assigned To
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {mappedTask.picker}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-200 px-5 py-4 text-sm font-semibold">
              Pick Steps
            </div>

            <div className="p-5">
              {steps.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No steps available for this wave.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <div className="min-w-[900px]">
                    {/* Header */}
                    <div className="grid grid-cols-6 bg-gray-100 px-4 py-3 text-xs font-semibold text-gray-600">
                      <div>#</div>
                      <div>Bin</div>
                      <div>SKU</div>
                      <div>Req</div>
                      <div>Picked</div>
                      <div>Status</div>
                    </div>

                    {/* Rows */}
                    {steps.map((step) => {
                      const isCurrent = step.state === "current";
                      const isDone = step.state === "done";

                      return (
                        <div
                          key={step.idx}
                          className={`grid grid-cols-6 items-center px-4 py-4 border-t text-sm ${
                            isCurrent
                              ? "bg-blue-50 border-l-4 border-blue-600"
                              : "bg-white"
                          }`}
                        >
                          {/* Step Index */}
                          <div>
                            {isDone ? (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-xs">
                                ✓
                              </div>
                            ) : (
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                                  isCurrent
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-600"
                                }`}
                              >
                                {step.idx}
                              </div>
                            )}
                          </div>

                          {/* Bin */}
                          <div className="font-medium">{step.bin}</div>

                          {/* SKU */}
                          <div>
                            <div className="font-medium">{step.sku}</div>
                            <div className="text-xs text-gray-500">
                              {step.skuSub}
                            </div>
                          </div>

                          {/* Required */}
                          <div>{step.req}</div>

                          {/* Picked */}
                          <div>{step.picked}</div>

                          {/* Status */}
                          <div>
                            <StatusChip text={step.status} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-5">
            <div className="text-sm font-semibold">Scan & Confirm</div>

            {/* Info Card */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500">Pick From</div>
                  <div className="text-lg font-bold text-blue-600">
                    {mappedTask.bin}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-gray-500">Required Qty</div>
                  <div className="text-lg font-bold">
                    {mappedTask.qtyToPick} EA
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-500">SKU</div>
                <div className="font-semibold">{mappedTask.skuCode}</div>
                <div className="text-xs text-gray-500">
                  {mappedTask.skuName}
                </div>
              </div>
            </div>

            {/* <div>
              <div className="text-sm font-medium mb-1">
                1. Scan Bin Location
              </div>
              <input
                value={binScan}
                onChange={(e) => setBinScan(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm bg-green-100"
              />
            </div> */}

            {/* <div>
              <div className="text-sm font-medium mb-1">
                2. Scan SKU Barcode
              </div>
              <input
                value={skuScan}
                onChange={(e) => setSkuScan(e.target.value)}
                placeholder="Scan SKU..."
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <div className="text-sm font-medium mb-2">
                3. Confirm Quantity
              </div>

              <div className="flex items-center border rounded-md overflow-hidden w-full">
                <button
                  type="button"
                  onClick={() =>
                    setQty((prev) => Math.max(0, Number(prev) - 1))
                  }
                  className="px-4 py-2 bg-gray-100"
                >
                  -
                </button>

                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="flex-1 text-center py-2 outline-none"
                />

                <button
                  type="button"
                  onClick={() => setQty((prev) => Number(prev) + 1)}
                  className="px-4 py-2 bg-gray-100"
                >
                  +
                </button>
              </div>
            </div> */}

            {/* Confirm Button */}
            {/* <button
              onClick={handleCompleteTask}
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 rounded-md font-medium"
            >
              Confirm Pick
            </button> */}
          </div>
        </div>
      </div>

      {exceptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="border-b px-5 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {exceptionType === "exception"
                  ? "Raise Exception"
                  : "Partial Pick Reason"}
              </h3>
              <button
                onClick={() => setExceptionModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Reason *
                </label>
                <input
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Enter reason..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={exceptionNotes}
                  onChange={(e) => setExceptionNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div className="border-t px-5 py-4 flex justify-end gap-3">
              <button
                onClick={() => setExceptionModalOpen(false)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitException}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </FormPage>
  );
};

export default PickTaskDetail;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import http from "../../api/http";
import { format } from "date-fns";
import {
  ArrowLeft,
  Download,
  Printer,
  CheckCircle,
  AlertCircle,
  Package,
  MapPin,
  Calendar,
  Clock,
  User,
  Truck,
  FileText,
  Box,
  List,
  History,
  Loader,
} from "lucide-react";
import { useToast } from "../components/toast/ToastProvider";

// Move formatDateTime outside so it's available to all components
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return format(date, "dd MMM yyyy, HH:mm");
  } catch {
    return dateString;
  }
};

const formatTime = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return format(date, "HH:mm");
  } catch {
    return dateString;
  }
};

const PickWaveDetails = () => {
  const { waveId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [wave, setWave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [releasing, setReleasing] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  useEffect(() => {
    fetchWaveDetails();
  }, [waveId]);

  const fetchWaveDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await http.get(`/pick-waves/${waveId}`);
      console.log("Wave details fetched:", response.data);
      setWave(response.data);
    } catch (err) {
      console.error("Error fetching wave details:", err);
      setError(
        err.response?.data?.message || "Failed to load pick wave details",
      );
      toast.error("Failed to load pick wave details");
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseWave = async () => {
    try {
      setReleasing(true);
      setError(null);

      const response = await http.post(`/pick-waves/${waveId}/release`);

      console.log("Wave released successfully:", response.data);

      // Refresh wave details to get updated status and tasks
      await fetchWaveDetails();

      // Close modal
      setShowReleaseModal(false);

      // Show success toast
      toast.success(
        `Wave released successfully! ${response.data.tasks_generated} tasks generated.`,
        { duration: 5000 },
      );
    } catch (err) {
      console.error("Error releasing wave:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to release wave";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setReleasing(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      RELEASED: "bg-yellow-100 text-yellow-700",
      "IN PROGRESS": "bg-blue-100 text-blue-700",
      PICKING_IN_PROGRESS: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-600",
      CLOSED: "bg-purple-100 text-purple-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const handleRefresh = () => {
    fetchWaveDetails();
    toast.info("Refreshing wave details...");
  };

  // Check if wave can be released
  const canRelease = () => {
    if (!wave) return false;

    // Convert to uppercase for case-insensitive comparison
    const status = wave.status?.toUpperCase();

    // Release button should be visible for DRAFT or PENDING status
    const releasableStatuses = ["DRAFT", "PENDING"];

    return releasableStatuses.includes(status);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !wave) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft size={16} />
            Back to Pick Waves
          </button>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 text-red-800 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-semibold">
                Error Loading Wave Details
              </h3>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Retry
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!wave) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft size={16} />
            Back to Pick Waves
          </button>

          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pick Wave Not Found
            </h3>
            <p className="text-gray-500 mb-6">
              The requested pick wave does not exist or has been removed.
            </p>
            <button
              onClick={() => navigate("/picking")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Pick Waves
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Orders",
      value: wave.total_orders,
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Total Lines",
      value: wave.total_lines,
      icon: List,
      color: "bg-green-50 text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Total Units",
      value: parseFloat(wave.total_units).toFixed(0),
      icon: Package,
      color: "bg-purple-50 text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      label: "Picked Units",
      value: parseFloat(wave.picked_units).toFixed(0),
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Tasks",
      value: `${wave.completed_tasks || 0}/${wave.total_tasks || 0}`,
      icon: Box,
      color: "bg-yellow-50 text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  const progressPercentage =
    wave.total_tasks > 0
      ? Math.round((wave.completed_tasks / wave.total_tasks) * 100)
      : 0;

  // Debug log to check status
  console.log("Current wave status:", wave.status);
  console.log("Can release:", canRelease());

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Release Wave Confirmation Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Release Pick Wave
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to release wave{" "}
              <span className="font-semibold">{wave.wave_no}</span>? This will
              generate pick tasks and make them available for picking.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReleaseModal(false)}
                disabled={releasing}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleReleaseWave}
                disabled={releasing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {releasing ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Releasing...
                  </>
                ) : (
                  "Confirm Release"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/picking")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft size={16} />
            Back to Pick Waves
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {wave.wave_no}
                </h1>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                    wave.status,
                  )}`}
                >
                  {wave.status?.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Calendar size={14} className="text-gray-400" />
                <p className="text-sm text-gray-500">
                  Created on {formatDateTime(wave.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
              <button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Download size={16} />
                Export
              </button>
              <button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Printer size={16} />
                Print
              </button>

              {/* Release Button - Visible for DRAFT or PENDING status */}
              {canRelease() && (
                <button
                  onClick={() => setShowReleaseModal(true)}
                  disabled={releasing}
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {releasing ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Releasing...
                    </>
                  ) : (
                    "Release Wave"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="text-red-600 flex-shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800 mb-1">
                  Error
                </h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-blue-600">
              {progressPercentage}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {wave.completed_tasks || 0} tasks completed
            </span>
            <span className="text-xs text-gray-500">
              {wave.total_tasks || 0} total tasks
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-full ${stat.bgColor} ${stat.color}`}
                >
                  <stat.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab("summary")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === "summary"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FileText size={16} />
                Summary
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === "orders"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <List size={16} />
                Orders ({wave.orders?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === "tasks"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Box size={16} />
                Tasks ({wave.tasks?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === "timeline"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <History size={16} />
                Timeline
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "summary" && (
              <SummaryTab wave={wave} formatDateTime={formatDateTime} />
            )}
            {activeTab === "orders" && (
              <OrdersTab orders={wave.orders} formatDateTime={formatDateTime} />
            )}
            {activeTab === "tasks" && (
              <TasksTab tasks={wave.tasks} formatDateTime={formatDateTime} />
            )}
            {activeTab === "timeline" && (
              <TimelineTab wave={wave} formatDateTime={formatDateTime} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Summary Tab Component
const SummaryTab = ({ wave, formatDateTime }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wave Information */}
        <div className="bg-gray-50 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={18} />
            Wave Information
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Wave Type:</span>
              <span className="text-sm font-medium text-gray-900">
                {wave.wave_type}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Strategy:</span>
              <span className="text-sm font-medium text-gray-900">
                {wave.wave_strategy}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Priority:</span>
              <span
                className={`text-sm font-medium px-2 py-1 rounded ${
                  wave.priority === "HIGH"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {wave.priority}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Zone Filter:</span>
              <span className="text-sm font-medium text-gray-900">
                {wave.zone_filter || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Warehouse:</span>
              <span className="text-sm font-medium text-gray-900">
                {wave.warehouse?.warehouse_name} (
                {wave.warehouse?.warehouse_code})
              </span>
            </div>
          </div>
        </div>

        {/* Carrier Information */}
        <div className="bg-gray-50 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck size={18} />
            Carrier Information
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Carrier:</span>
              <span className="text-sm font-medium text-gray-900">
                {wave.carrier || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Cutoff Time:</span>
              <span className="text-sm font-medium text-gray-900">
                {wave.carrier_cutoff_time
                  ? formatDateTime(wave.carrier_cutoff_time)
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {wave.notes && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
          <p className="text-gray-700">{wave.notes}</p>
        </div>
      )}

      {/* Timeline Summary */}
      <div className="bg-gray-50 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Created", time: wave.createdAt, icon: Calendar },
            { label: "Released", time: wave.released_at, icon: Clock },
            {
              label: "Picking Started",
              time: wave.picking_started_at,
              icon: Clock,
            },
            {
              label: "Picking Completed",
              time: wave.picking_completed_at,
              icon: CheckCircle,
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <item.icon size={16} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {item.time ? formatDateTime(item.time) : "Pending"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Orders Tab Component
const OrdersTab = ({ orders, formatDateTime }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders</h3>
        <p className="text-gray-500">This wave doesn't contain any orders.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Order No
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Lines
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Units
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-400" />
                  <span className="font-medium text-blue-600">
                    {order.order_no}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {order.customer_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                    {order.customer_email}
                  </p>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold">
                  {order.total_lines}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="font-medium">{order.total_ordered_units}</span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.status === "PICKED"
                      ? "bg-green-100 text-green-800"
                      : order.status === "ALLOCATED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {order.status}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">
                {formatDateTime(order.createdAt)}
              </td>
              <td className="py-3 px-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Tasks Tab Component
const TasksTab = ({ tasks, formatDateTime }) => {
  const navigate = useNavigate();
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <Box size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks</h3>
        <p className="text-gray-500">No pick tasks found for this wave.</p>
      </div>
    );
  }

  const getTaskStatusColor = (status) => {
    const colors = {
      PENDING: "bg-gray-100 text-gray-800",
      ASSIGNED: "bg-yellow-100 text-yellow-800",
      "IN PROGRESS": "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Total Tasks</div>
          <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Completed Tasks</div>
          <div className="text-2xl font-bold text-green-600">
            {tasks.filter((t) => t.status === "COMPLETED").length}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Completion Rate</div>
          <div className="text-2xl font-bold text-blue-600">
            {tasks.length > 0
              ? Math.round(
                  (tasks.filter((t) => t.status === "COMPLETED").length /
                    tasks.length) *
                    100,
                )
              : 0}
            %
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Task No
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.map((task) => {
              const startTime = task.pick_started_at
                ? new Date(task.pick_started_at)
                : null;
              const endTime = task.pick_completed_at
                ? new Date(task.pick_completed_at)
                : null;
              const duration =
                startTime && endTime
                  ? Math.round((endTime - startTime) / 1000)
                  : null;

              return (
                <tr
                  key={task.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">
                      {task.task_no}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {task.sku?.sku_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {task.sku?.sku_code}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="font-mono text-sm">
                        {task.sourceLocation?.location_code}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {task.qty_picked}/{task.qty_to_pick}
                      </span>
                      <span className="text-xs text-gray-500">units</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {duration ? (
                      <span className="text-sm text-gray-700">{duration}s</span>
                    ) : (
                      <span className="text-sm text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => navigate(`/picking/tasks/${task.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Timeline Tab Component
const TimelineTab = ({ wave, formatDateTime }) => {
  const timelineEvents = [
    {
      title: "Wave Created",
      timestamp: wave.createdAt,
      description: "Pick wave was created in the system",
      icon: "📝",
      status: "completed",
    },
    {
      title: "Wave Released",
      timestamp: wave.released_at,
      description: "Pick wave was released for picking",
      icon: "🚀",
      status: wave.released_at ? "completed" : "pending",
    },
    {
      title: "Picking Started",
      timestamp: wave.picking_started_at,
      description: "Picking process was initiated",
      icon: "📦",
      status: wave.picking_started_at ? "completed" : "pending",
    },
    {
      title: "Tasks Completed",
      timestamp: wave.picking_completed_at,
      description: "All pick tasks were completed",
      icon: "✅",
      status: wave.picking_completed_at ? "completed" : "pending",
    },
  ];

  const getEventStatus = (event) => {
    if (event.status === "completed") {
      return {
        icon: "✓",
        color: "text-green-600 bg-green-100",
        borderColor: "border-green-200",
      };
    }
    return {
      icon: "⏱",
      color: "text-gray-400 bg-gray-100",
      borderColor: "border-gray-200",
    };
  };

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      <div className="space-y-8 relative z-10">
        {timelineEvents.map((event, index) => {
          const status = getEventStatus(event);

          return (
            <div key={index} className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full border-2 ${status.borderColor} ${status.color} flex items-center justify-center text-lg font-bold`}
              >
                {status.icon}
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {event.title}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {event.description}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {event.timestamp
                      ? formatDateTime(event.timestamp)
                      : "Pending"}
                  </span>
                </div>
                {event.timestamp && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                    <User size={12} />
                    <span>User {wave.released_by || wave.created_by}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PickWaveDetails;

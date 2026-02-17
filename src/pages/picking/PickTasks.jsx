// pages/picking/PickTasks.jsx
import React, { useState, useEffect } from "react";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import http from "../../api/http";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const TaskStatusPill = ({ status }) => {
  const statusMap = {
    PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
    ASSIGNED: { label: "Assigned", className: "bg-blue-100 text-blue-700" },
    "IN PROGRESS": {
      label: "In Progress",
      className: "bg-blue-100 text-blue-700",
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-blue-100 text-blue-700",
    },
    COMPLETED: { label: "Completed", className: "bg-green-100 text-green-700" },
    DONE: { label: "Done", className: "bg-green-100 text-green-700" },
    EXCEPTION: { label: "Exception", className: "bg-red-100 text-red-700" },
    CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-700" },
  };

  const statusInfo = statusMap[status] || {
    label: status,
    className: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}
    >
      {statusInfo.label}
    </span>
  );
};

const PickTasks = ({ onTaskSelect }) => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    date: "Today",
    warehouse: "All Warehouses",
    client: "All Clients",
    status: "All", // Changed from "Pending" to "All"
    assigned: "Assigned to",
    zone: "All",
    search: "",
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });

  const filterConfig = [
    {
      key: "date",
      type: "select",
      label: "Date",
      value: filters.date,
      options: ["Today", "Yesterday", "Last 7 Days", "Last 30 Days"],
      className: "w-[140px]",
    },
    {
      key: "warehouse",
      type: "select",
      label: "Warehouse",
      value: filters.warehouse,
      options: ["All Warehouses", "WH001", "WH002", "WH003"],
      className: "w-[160px]",
    },
    {
      key: "client",
      type: "select",
      label: "Client",
      value: filters.client,
      options: ["All Clients", "Client 1", "Client 2", "Client 3"],
      className: "w-[140px]",
    },
    {
      key: "status",
      type: "select",
      label: "Status",
      value: filters.status,
      options: [
        "All",
        "PENDING",
        "ASSIGNED",
        "IN PROGRESS",
        "COMPLETED",
        "EXCEPTION",
        "CANCELLED",
      ],
      className: "w-[140px]",
    },
    {
      key: "assigned",
      type: "select",
      label: "Assigned to",
      value: filters.assigned,
      options: [
        "Assigned to",
        "John Doe",
        "Jane Smith",
        "Mike Ross",
        "Sarah Lee",
        "Test User",
      ],
      className: "w-[160px]",
    },
    {
      key: "zone",
      type: "select",
      label: "Zone",
      value: filters.zone,
      options: ["All", "A", "B", "C", "ZONE-A", "ZONE-B", "ZONE-C"],
      className: "w-[180px]",
    },
    {
      key: "search",
      type: "search",
      label: "Search",
      value: filters.search,
      placeholder: "Task ID / Wave ID / Order No / SKU",
      className: "w-[240px]",
    },
  ];

  // Fetch pick tasks
  const fetchPickTasks = async (page = 1) => {
    try {
      setLoading(true);

      // Build query params
      const params = {
        page,
        limit: 10,
        warehouse_id: 1, // Default warehouse, can be dynamic
      };

      // Add search filter
      if (filters.search) {
        params.search = filters.search;
      }

      // Add status filter
      if (filters.status && filters.status !== "All") {
        params.status = filters.status;
      }

      // Add zone filter
      if (filters.zone && filters.zone !== "All") {
        params.zone = filters.zone;
      }

      const response = await http.get("/pick-tasks/", { params });

      if (response.data) {
        setTasks(response.data.tasks || []);
        setPagination({
          total: response.data.total || 0,
          page: response.data.page || 1,
          pages: response.data.pages || 1,
        });
      }
    } catch (error) {
      console.error("Error fetching pick tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickTasks();
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM, HH:mm");
    } catch {
      return dateString;
    }
  };

  const getAssignedToName = (task) => {
    if (task.picker) {
      return (
        `${task.picker.first_name || ""} ${task.picker.last_name || ""}`.trim() ||
        task.picker.username ||
        `User ${task.assigned_to}`
      );
    }
    return task.assigned_to ? `User ${task.assigned_to}` : "Unassigned";
  };

  const getZoneFromLocation = (task) => {
    if (task.sourceLocation?.zone) {
      return `Zone ${task.sourceLocation.zone}`;
    }
    return task.wave?.zone_filter || "N/A";
  };

  const getActionLabel = (status) => {
    if (status === "IN PROGRESS" || status === "IN_PROGRESS")
      return "Complete Task";

    if (status === "ASSIGNED") return "Start Task";

    if (status === "PENDING") return "View";

    if (status === "EXCEPTION") return "Resolve";

    return "View Details";
  };

  const columns = [
    {
      key: "task_no",
      title: "Task ID",
      render: (r) => (
        <span className="font-semibold text-blue-600">{r.task_no}</span>
      ),
    },
    {
      key: "wave_no",
      title: "Wave ID",
      render: (r) => (
        <span className="text-gray-700">{r.wave?.wave_no || "N/A"}</span>
      ),
    },
    {
      key: "zone",
      title: "Zone",
      render: (r) => getZoneFromLocation(r),
    },
    {
      key: "order_no",
      title: "Order No",
      render: (r) => r.order?.order_no || "N/A",
    },
    {
      key: "customer",
      title: "Customer",
      render: (r) => r.order?.customer_name || "N/A",
    },
    {
      key: "sku",
      title: "SKU",
      render: (r) => r.orderLine?.sku?.sku_code || "N/A",
    },
    {
      key: "qty",
      title: "Qty",
      render: (r) => `${r.qty_picked || 0}/${r.qty_to_pick || 0}`,
    },
    {
      key: "assignedTo",
      title: "Assigned to",
      render: (r) => getAssignedToName(r),
    },
    {
      key: "status",
      title: "Status",
      render: (r) => <TaskStatusPill status={r.status} />,
    },
    {
      key: "createdAt",
      title: "Created",
      render: (r) => formatDateTime(r.createdAt),
    },
    {
      key: "actions",
      title: "Actions",
      render: (r) => (
        <button
          onClick={() => navigate(`/picking/tasks/${r.id}`)}
          className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
            r.status === "IN PROGRESS" || r.status === "IN_PROGRESS"
              ? "text-orange-600 hover:text-orange-800 hover:bg-orange-50"
              : r.status === "PENDING" || r.status === "ASSIGNED"
                ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                : r.status === "EXCEPTION"
                  ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                  : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          }`}
        >
          {getActionLabel(r.status)}
        </button>
      ),
    },
  ];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchPickTasks(1); // Reset to page 1 when applying filters
  };

  const handleResetFilters = () => {
    setFilters({
      date: "Today",
      warehouse: "All Warehouses",
      client: "All Clients",
      status: "All",
      assigned: "Assigned to",
      zone: "All",
      search: "",
    });
    fetchPickTasks(1);
  };

  const handlePageChange = (newPage) => {
    fetchPickTasks(newPage);
  };

  // Summary cards data
  const getTaskStats = () => {
    const total = tasks.length;
    const pending = tasks.filter(
      (t) => t.status === "PENDING" || t.status === "ASSIGNED",
    ).length;
    const inProgress = tasks.filter(
      (t) => t.status === "IN PROGRESS" || t.status === "IN_PROGRESS",
    ).length;
    const completed = tasks.filter(
      (t) => t.status === "COMPLETED" || t.status === "DONE",
    ).length;
    const exceptions = tasks.filter((t) => t.status === "EXCEPTION").length;

    return { total, pending, inProgress, completed, exceptions };
  };

  const stats = getTaskStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.pending}
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.inProgress}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg
                className="w-5 h-5"
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
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.completed}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Exceptions</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.exceptions}
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <FilterBar
        filters={filterConfig}
        showActions
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-gray-200 bg-white">
            <CusTable
              columns={columns}
              data={tasks}
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </div>

          {tasks.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No pick tasks found. Try adjusting your filters.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PickTasks;

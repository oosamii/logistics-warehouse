import React, { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import { useToast } from "../components/toast/ToastProvider";
import { getStatusBadgeColor } from "../components/helper";
import PaginatedEntityDropdown from "../inbound/components/asnform/common/PaginatedEntityDropdown";
import { matchDateOption } from "./components/helper";
import { getWarehouses } from "../inbound/components/api/masters.api";

const Putaway = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [warehouses, setWarehouses] = useState([]);

  const [putawayData, setPutawayData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    aging: 0,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 5,
  });

  const [filterOptions, setFilterOptions] = useState({
    warehouses: [{ label: "All", value: "All" }],
    clients: ["All"],
    statuses: [
      "All",
      "Pending",
      "Assigned",
      "In Progress",
      "Completed",
      "Cancelled",
    ],
    sources: ["All", "Dock", "Receiving Bin", "Quality Check"],
    zones: ["All"],
  });

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [assignForm, setAssignForm] = useState({
    user_id: "",
    destination_location: "",
  });
  const [assigning, setAssigning] = useState(false);

  const [filterValues, setFilterValues] = useState({
    dateRange: "All",
    warehouse: "All",
    client: "All",
    status: "All",
    source: "All",
    zone: "All",
    search: "",
  });

  const [selectedIds, setSelectedIds] = useState([]);

  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    user_id: "",
    destination_location: "",
  });
  const [bulkAssigning, setBulkAssigning] = useState(false);

  const fetchPutawayData = async () => {
    try {
      setLoading(true);

      const warehouseId = 1;
      const response = await http.get(
        `/grn-lines/?warehouse_id=${warehouseId}&page=1&limit=${pagination?.limit}`,
      );
      if (response.data.success) {
        setPutawayData(response.data.data);
        calculateStats(response.data.data);
        extractFilterOptions(response.data.data);
        setPagination(response?.data?.pagination);
      }
    } catch (error) {
      console.error("Error fetching putaway data:", error);
      toast.error("Failed to load putaway tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await http.get("/users?role=operator,supervisor");
      if (response.data.success) {
        setUsers(response.data.data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await http.get("/locations?page=1&limit=100");
      if (response.data.success) {
        const filteredLocations = response.data.data.locations.filter(
          (location) =>
            location.is_putawayable === true && location.is_active === true,
        );
        setLocations(filteredLocations);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to load locations");
    }
  };

  const getwhereHouses = async () => {
    const data = await getWarehouses();
    setWarehouses(data);
  };

  useEffect(() => {
    getwhereHouses();
    fetchPutawayData();
    fetchUsers();
    fetchLocations();
  }, []);

  useEffect(() => {
    setFilterOptions((prev) => ({
      ...prev,
      warehouses: [
        { label: "All", value: "All" },
        ...warehouses.map((w) => ({
          label: w.warehouse_name,
          value: w.id,
        })),
      ],
    }));
  }, [warehouses]);

  const extractFilterOptions = (data) => {
    if (!data || data.length === 0) return;

    const zones = [
      "All",
      ...new Set(
        data
          .map((item) => item.destination_location?.zone)
          .filter(Boolean)
          .map((zone) => `Zone ${zone}`),
      ),
    ];

    const clients = [
      "All",
      ...new Set(
        data.map((item) => item.sku?.client_name || "Unknown").filter(Boolean),
      ),
    ];

    setFilterOptions((prev) => ({
      ...prev,
      zones,
      clients: [...new Set([...prev.clients, ...clients])],
    }));
  };

  const calculateStats = (data) => {
    const now = new Date();
    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let agingCount = 0;

    data.forEach((task) => {
      const status = task.putaway_status?.toUpperCase();

      switch (status) {
        case "PENDING":
          pendingCount++;
          break;
        case "ASSIGNED":
        case "IN_PROGRESS":
          inProgressCount++;
          const createdAt = new Date(task.created_at);
          const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
          if (hoursDiff > 4) {
            agingCount++;
          }
          break;
        case "COMPLETED":
          completedCount++;
          break;
        default:
          pendingCount++;
      }
    });

    setStats({
      total: data.length,
      pending: pendingCount,
      inProgress: inProgressCount,
      completed: completedCount,
      aging: agingCount,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPutawayStatus = (status) => {
    const statusMap = {
      PENDING: "Pending",
      ASSIGNED: "Assigned",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };
    return statusMap[status] || status || "Pending";
  };

  const formatDestinationLocation = (location) => {
    if (!location) return "-";

    const { zone, aisle, rack, level } = location;
    if (zone && aisle && rack && level) {
      return `${zone}-${aisle}-${rack}-${level}`;
    } else if (location.location_code) {
      return location.location_code;
    }
    return "-";
  };

  const formatAssigneeName = (assignee) => {
    if (!assignee) return "-";
    return (
      `${assignee.first_name} ${assignee.last_name}`.trim() ||
      assignee.username ||
      "-"
    );
  };

  const handleStartPutaway = (task) => {
    const status = task.putaway_status?.toUpperCase();

    if (status === "PENDING") {
      setSelectedTask(task);
      setAssignForm({
        user_id: "",
        destination_location: task.destination_location_id || "",
      });
      setAssignModalOpen(true);
    } else if (
      status === "ASSIGNED" ||
      status === "IN_PROGRESS" ||
      status === "COMPLETED"
    ) {
      navigate(`/putaway/putawaydetails/${task.id}`, { state: { task } });
    }
  };

  const handleAssignTask = async () => {
    if (!selectedTask) return;

    if (!assignForm.user_id || !assignForm.destination_location) {
      toast.error("Please select a user and destination location");
      return;
    }

    try {
      setAssigning(true);

      const payload = {
        line_id: selectedTask.id,
        user_id: parseInt(assignForm.user_id),
        destination_location: parseInt(assignForm.destination_location),
      };

      console.log("Assigning task with payload:", payload);
      const response = await http.post("/grns/assign-putaway", payload);

      if (response.data.success) {
        toast.success("Putaway task assigned successfully!");
        setAssignModalOpen(false);
        setSelectedTask(null);
        fetchPutawayData();
      } else {
        toast.error(response.data.message || "Failed to assign task");
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error(
        error.response?.data?.message || "Failed to assign putaway task",
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleViewTask = (task) => {
    navigate(`/putaway/putawaydetails/${task.id}`, { state: { task } });
  };

  const handleBulkAssign = () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least 1 task to assign");
      return;
    }
    setBulkForm({ user_id: "", destination_location: "" });
    setBulkAssignOpen(true);
  };

  const handleFilterChange = (key, value) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilterValues({
      dateRange: "All",
      warehouse: "All",
      client: "All",
      status: "All",
      source: "All",
      zone: "All",
      search: "",
    });
  };

  const filters = [
    {
      key: "dateRange",
      type: "select",
      label: "Date Range",
      value: filterValues.dateRange,
      options: ["Today", "Yesterday", "Last 7 Days", "This Month", "All"],
    },
    {
      key: "warehouse",
      type: "select",
      label: "Warehouse",
      value: filterValues.warehouse,
      options: [
        { label: "All", value: "All" },
        ...warehouses.map((w) => ({
          label: w.warehouse_name,
          value: w.id,
        })),
      ],
    },
    {
      key: "status",
      type: "select",
      label: "Status",
      value: filterValues.status,
      options: filterOptions.statuses,
      className: "w-[140px]",
    },
    {
      key: "source",
      type: "select",
      label: "Source",
      value: filterValues.source,
      options: filterOptions.sources,
      className: "w-[140px]",
    },
    {
      key: "zone",
      type: "select",
      label: "Zone",
      value: filterValues.zone,
      options: filterOptions.zones,
      className: "w-[140px]",
    },
    {
      key: "search",
      type: "search",
      label: "Search",
      placeholder: "Task ID / ASN / GRN / SKU",
      value: filterValues.search,
      className: "w-[260px]",
    },
  ];

  const filteredData = putawayData.filter((task) => {
    if (filterValues.search) {
      const searchLower = filterValues.search.toLowerCase();
      const matchesSearch =
        task.pt_task_id?.toLowerCase().includes(searchLower) ||
        task.sku?.sku_code?.toLowerCase().includes(searchLower) ||
        task.sku?.sku_name?.toLowerCase().includes(searchLower) ||
        task.batch_no?.toLowerCase().includes(searchLower) ||
        task.grn?.grn_no?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    if (filterValues.status !== "All") {
      const statusMap = {
        Pending: "PENDING",
        Assigned: "ASSIGNED",
        "In Progress": "IN_PROGRESS",
        Completed: "COMPLETED",
        Cancelled: "CANCELLED",
      };

      if (task.putaway_status !== statusMap[filterValues.status]) {
        return false;
      }
    }

    if (filterValues.zone !== "All") {
      const zoneLetter = filterValues.zone.replace("Zone ", "").trim();
      if (task.destination_location?.zone !== zoneLetter) {
        return false;
      }
    }

    if (filterValues.source !== "All") {
      if (filterValues.source === "Dock") {
        if (!task.source_location?.location_code?.includes("DOCK")) {
          return false;
        }
      } else if (filterValues.source === "Receiving Bin") {
        if (!task.source_location?.location_code?.includes("BIN")) {
          return false;
        }
      } else if (filterValues.source === "Quality Check") {
        if (!task.source_location?.location_code?.includes("QC")) {
          return false;
        }
      }
    }

    if (filterValues?.warehouse !== "All") {
      return (
        filterValues?.warehouse === task?.destination_location?.warehouse_id
      );
    }

    if (filterValues?.dateRange !== "All") {
      return matchDateOption(filterValues?.dateRange, task?.updated_at);
    }
    return true;
  });

  const formatLocationOption = (location) => {
    let displayText = location.location_code;
    if (location.zone && location.aisle && location.rack && location.level) {
      displayText += ` (${location.zone}-${location.aisle}-${location.rack}-${location.level})`;
    }
    if (location.available_capacity !== undefined) {
      displayText += ` - Available: ${location.available_capacity}`;
    }
    return displayText;
  };

  const columns = [
    {
      key: "select",
      title: "",
      render: (row) => (
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleOne(row.id)}
        />
      ),
    },
    {
      key: "taskId",
      title: "Task ID",
      render: (row) => (
        <div className="leading-tight">
          <div className="text-xs text-gray-400">PT</div>
          <div
            className="text-sm font-semibold text-blue-600 cursor-pointer hover:underline"
            onClick={() => handleViewTask(row)}
          >
            {row.pt_task_id || "N/A"}
          </div>
        </div>
      ),
    },
    {
      key: "grn",
      title: "GRN No",
      render: (row) => (
        <div className="text-sm font-semibold">
          {row.grn?.grn_no || `GRN-${String(row.grn_id).padStart(5, "0")}`}
        </div>
      ),
    },
    {
      key: "sku",
      title: "SKU Details",
      render: (row) => (
        <div className="leading-tight">
          <div className="text-sm font-medium text-gray-900">
            {row.sku?.sku_name || "N/A"}
          </div>
          <div className="text-xs text-gray-400">
            {row.sku?.sku_code || "N/A"}
          </div>
          {row.batch_no && (
            <div className="text-xs text-gray-500 mt-1">
              Batch: {row.batch_no}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "qty",
      title: "Qty",
      render: (row) => `${row.qty || 0} ${row.sku?.uom || "EA"}`,
    },
    {
      key: "source",
      title: "Source",
      render: (row) => row.source_location?.location_code || "N/A",
    },
    {
      key: "destLoc",
      title: "Dest. Loc",
      render: (row) => formatDestinationLocation(row.destination_location),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => {
        const status = row.putaway_status?.toUpperCase();
        const displayStatus = formatPutawayStatus(status);
        return (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(status)}`}
          >
            {displayStatus}
          </span>
        );
      },
    },
    {
      key: "assigned",
      title: "Assigned To",
      render: (row) => formatAssigneeName(row.assignee),
    },
    {
      key: "created",
      title: "Created",
      render: (row) => formatDate(row.created_at),
    },
    {
      key: "action",
      title: "Action",
      render: (row) => {
        const status = row.putaway_status?.toUpperCase();
        const isPending = status === "PENDING";
        const isAssigned = status === "ASSIGNED";
        const isInProgress = status === "IN_PROGRESS";

        if (isPending) {
          return (
            <button
              onClick={() => handleStartPutaway(row)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Assign
            </button>
          );
        } else if (isAssigned || isInProgress) {
          return (
            <button
              onClick={() => handleStartPutaway(row)}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Start
            </button>
          );
        } else {
          return (
            <button
              onClick={() => handleViewTask(row)}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View
            </button>
          );
        }
      },
    },
  ];

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const allVisibleIds = filteredData.map((x) => x.id);
  const isAllSelected =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((id) => selectedIds.includes(id));

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      if (isAllSelected) {
        // unselect only visible ones
        return prev.filter((id) => !allVisibleIds.includes(id));
      }
      // add visible ones
      const merged = new Set([...prev, ...allVisibleIds]);
      return Array.from(merged);
    });
  };

  const handleBulkAssignSubmit = async () => {
    if (!bulkForm.user_id || !bulkForm.destination_location) {
      toast.error("Please select a user and destination location");
      return;
    }

    try {
      setBulkAssigning(true);

      const payload = {
        grn_line_ids: selectedIds,
        updates: {
          assigned_to: parseInt(bulkForm.user_id),
          destination_location_id: parseInt(bulkForm.destination_location),
          putaway_status: "ASSIGNED",
        },
      };

      const res = await http.put("/grn-lines/bulk/update", payload);

      if (res.data?.success) {
        toast.success(`Assigned ${selectedIds.length} tasks successfully`);
        setBulkAssignOpen(false);
        setSelectedIds([]);
        fetchPutawayData();
      } else {
        toast.error(res.data?.message || "Failed to bulk assign");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to bulk assign");
    } finally {
      setBulkAssigning(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <PageHeader
        title="Putaway Tasks"
        subtitle="Move received stock from dock to storage locations"
        actions={
          <>
            <div>
              <button
                onClick={() => toast.info("Export feature coming soon!")}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Export
              </button>
              <p className="text-gray-500 text-xs"></p>
            </div>
            <div>
              <button
                onClick={handleBulkAssign}
                disabled={selectedIds.length === 0}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
              >
                Assign Tasks
              </button>
              <p className="text-gray-500 text-xs px-2">Note:Select GRN</p>
            </div>
          </>
        }
      />

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        onApply={() => console.log("Filters applied:", filterValues)}
      >
        <div>
          <p className="text-xs text-gray-500">Client</p>
          <PaginatedEntityDropdown
            endpoint="/clients"
            listKey="clients"
            value={filterValues.client}
            onChange={(id) => handleFilterChange("client", id)}
            enableSearch
            renderItem={(c) => ({
              title: c.client_name,
              subtitle: c.client_code,
            })}
          />
        </div>
      </FilterBar>

      {/* Status Cards */}
      <div className="mb-4 grid grid-cols-5 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">Total Tasks</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">
            {stats.total}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">Pending</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">
            {stats.pending}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">In Progress</div>
          <div className="mt-2 text-2xl font-semibold text-blue-600">
            {stats.inProgress}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">Completed</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">
            {stats.completed}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">Aging &gt; 4h</div>
          <div className="mt-2 text-2xl font-semibold text-red-600">
            {stats.aging}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {/* Table top selection bar */}
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 text-sm text-gray-500">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={isAllSelected}
            onChange={toggleAllVisible}
          />
          <span>{selectedIds.length} Selected</span>

          {selectedIds.length > 0 && (
            <button
              onClick={() => setSelectedIds([])}
              className="ml-2 text-xs text-blue-600 hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading putaway tasks...</div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">No putaway tasks found</div>
          </div>
        ) : (
          <CusTable columns={columns} data={filteredData} />
        )}
      </div>

      {/* Assign Task Modal */}
      {assignModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Putaway Task
              </h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Task Details
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Task ID:</span>
                      <div className="font-medium">
                        {selectedTask.pt_task_id}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">SKU:</span>
                      <div className="font-medium">
                        {selectedTask.sku?.sku_name}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Quantity:</span>
                      <div className="font-medium">
                        {selectedTask.qty} {selectedTask.sku?.uom}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Source:</span>
                      <div className="font-medium">
                        {selectedTask.source_location?.location_code}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To User *
                </label>
                <select
                  value={assignForm.user_id}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, user_id: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Location *
                </label>
                <select
                  value={assignForm.destination_location}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      destination_location: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {formatLocationOption(location)}
                    </option>
                  ))}
                </select>
                {selectedTask.sku?.putaway_zone && (
                  <p className="text-xs text-gray-500 mt-1">
                    Suggested Zone: {selectedTask.sku.putaway_zone}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTask}
                  disabled={
                    assigning ||
                    !assignForm.user_id ||
                    !assignForm.destination_location
                  }
                  className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assigning ? "Assigning..." : "Assign Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-gray-700">
        <div className="font-semibold text-gray-900 mb-1">
          Putaway Guidelines
        </div>
        <ul className="list-disc pl-5 space-y-1">
          <li>Putaway quantity cannot exceed the received quantity.</li>
          <li>
            If the suggested location capacity is reached, you must flag the
            task and request an alternate location.
          </li>
          <li>
            Batch and Expiry details must be verified physically before
            confirming the task.
          </li>
          <li>
            Scan the destination location barcode before confirming putaway.
          </li>
          <li>Report any discrepancies immediately to your supervisor.</li>
        </ul>
      </div>

      {/* Filter Summary */}
      {!loading && (
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredData.length} of {putawayData.length} tasks
          {filterValues.search && ` matching "${filterValues.search}"`}
          {filterValues.status !== "All" &&
            ` with status "${filterValues.status}"`}
          {filterValues.zone !== "All" && ` in ${filterValues.zone}`}
        </div>
      )}

      {bulkAssignOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Bulk Assign Putaway Tasks
              </h3>
              <button
                onClick={() => setBulkAssignOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-md text-sm mb-4">
              Selected Tasks:{" "}
              <span className="font-semibold">{selectedIds.length}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To User *
                </label>
                <select
                  value={bulkForm.user_id}
                  onChange={(e) =>
                    setBulkForm({ ...bulkForm, user_id: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select User</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Location *
                </label>
                <select
                  value={bulkForm.destination_location}
                  onChange={(e) =>
                    setBulkForm({
                      ...bulkForm,
                      destination_location: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {formatLocationOption(loc)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setBulkAssignOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleBulkAssignSubmit}
                  disabled={
                    bulkAssigning ||
                    !bulkForm.user_id ||
                    !bulkForm.destination_location
                  }
                  className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkAssigning ? "Assigning..." : "Assign Selected"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Putaway;

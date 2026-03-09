import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import http from "../../api/http";
import { format } from "date-fns";

const StatusPill = ({ status }) => {
  const statusMap = {
    DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-600" },
    RELEASED: { label: "Released", className: "bg-yellow-100 text-yellow-700" },
    "IN PROGRESS": {
      label: "In Progress",
      className: "bg-blue-100 text-blue-700",
    },
    PICKING_IN_PROGRESS: {
      label: "Picking In Progress",
      className: "bg-blue-100 text-blue-700",
    },
    COMPLETED: { label: "Completed", className: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-600" },
    CLOSED: { label: "Closed", className: "bg-purple-100 text-purple-700" },
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

const PickWaves = ({ onWaveSelect, onTaskSelect }) => {
  const navigate = useNavigate(); // Initialize navigate

  const [filters, setFilters] = useState({
    date: "Today",
    warehouse: "All Warehouses",
    client: "All Clients",
    status: "All",
    assigned: "Assigned to",
    search: "",
  });

  const [waves, setWaves] = useState([]);
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
      options: ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "Custom"],
      className: "w-[140px]",
    },
    {
      key: "warehouse",
      type: "select",
      label: "Warehouse",
      value: filters.warehouse,
      options: ["All Warehouses", "WH-NYC-01", "WH-LA-02", "WH-CHI-03"],
      className: "w-[160px]",
    },
    {
      key: "client",
      type: "select",
      label: "Client",
      value: filters.client,
      options: ["All Clients", "Acme Corp", "Tech Retailers", "Global Foods"],
      className: "w-[140px]",
    },
    {
      key: "status",
      type: "select",
      label: "Status",
      value: filters.status,
      options: [
        "All",
        "DRAFT",
        "RELEASED",
        "IN PROGRESS",
        "PICKING_IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "CLOSED",
      ],
      className: "w-[120px]",
    },
    {
      key: "assigned",
      type: "select",
      label: "Assigned to",
      value: filters.assigned,
      options: ["Assigned to", "Team Alpha", "Team Beta", "Unassigned"],
      className: "w-[150px]",
    },
    {
      key: "search",
      type: "search",
      label: "Search",
      value: filters.search,
      placeholder: "Wave ID / Order No / Client",
      className: "w-[240px]",
    },
  ];

  // Fetch pick waves
  const fetchPickWaves = async (page = 1) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: 10,
        warehouse_id: 1,
      };

      if (filters.search) {
        params.search = filters.search;
      }

      if (filters.status && filters.status !== "All") {
        params.status = filters.status;
      }

      const response = await http.get("/pick-waves/", { params });

      if (response.data) {
        setWaves(response.data.waves || []);
        setPagination({
          total: response.data.total || 0,
          page: response.data.page || 1,
          pages: response.data.pages || 1,
        });
      }
    } catch (error) {
      console.error("Error fetching pick waves:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickWaves();
  }, []);

  // Function to navigate to wave details page
  const handleViewDetails = (wave) => {
    // Method 1: Using navigate (for separate page)
    navigate(`/picking/waves/${wave.id}`);

    // OR Method 2: Using onWaveSelect prop (for same page tab)
    // if (onWaveSelect) {
    //   onWaveSelect(wave.id);
    // }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM, HH:mm");
    } catch {
      return dateString;
    }
  };

  const calculateCompletionRate = (totalTasks, completedTasks) => {
    if (!totalTasks || totalTasks === 0) return "0%";
    const percentage = (completedTasks / totalTasks) * 100;
    return `${Math.round(percentage)}%`;
  };

  const columns = [
    {
      key: "wave_no",
      title: "Wave ID",
      render: (r) => (
        <button
          onClick={() => handleViewDetails(r)}
          className="font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          {r.wave_no}
        </button>
      ),
    },
    // {
    //   key: "client",
    //   title: "Client",
    //   render: (r) => {
    //     const client = r.orders?.[0]?.client_id || "N/A";
    //     return <span>{client === 1 ? "Acme Corp" : `Client ${client}`}</span>;
    //   },
    // },
    {
      key: "orders",
      title: "Orders",
      render: (r) => r.total_orders || 0,
    },
    {
      key: "skuLines",
      title: "SKU Lines",
      render: (r) => r.total_lines || 0,
    },
    {
      key: "units",
      title: "Units",
      render: (r) => r.total_units || "0.000",
    },
    {
      key: "strategy",
      title: "Strategy",
      render: (r) => r.wave_strategy || "-",
    },
    {
      key: "createdTime",
      title: "Created Time",
      render: (r) => formatDateTime(r.createdAt),
    },
    {
      key: "status",
      title: "Status",
      render: (r) => <StatusPill status={r.status} />,
    },
    {
      key: "completion",
      title: "Completion",
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {calculateCompletionRate(r.total_tasks, r.completed_tasks)}
          </span>
          <span className="text-xs text-gray-500">
            {r.completed_tasks || 0}/{r.total_tasks || 0} tasks
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <button
            className="text-blue-600 text-sm font-medium hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded"
            onClick={() => handleViewDetails(r)}
          >
            View Details
          </button>
          {r.status === "DRAFT" && (
            <button className="text-green-600 text-sm font-medium hover:text-green-800 px-2 py-1 hover:bg-green-50 rounded">
              Release
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchPickWaves(1);
  };

  const handleResetFilters = () => {
    setFilters({
      date: "Today",
      warehouse: "All Warehouses",
      client: "All Clients",
      status: "All",
      assigned: "Assigned to",
      search: "",
    });
    fetchPickWaves(1);
  };

  const handlePageChange = (newPage) => {
    fetchPickWaves(newPage);
  };

  return (
    <div className="space-y-6">
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
              data={waves}
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </div>

          {waves.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No pick waves found. Try adjusting your filters or create a new
              pick wave.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PickWaves;

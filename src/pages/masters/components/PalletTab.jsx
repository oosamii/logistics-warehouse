import React, { useMemo, useState, useEffect, useCallback } from "react";
import FilterBar from "../../components/FilterBar";
import CusTable from "../../components/CusTable";
import Pagination from "../../components/Pagination";
import { Pencil, Trash2, Package } from "lucide-react";
import http from "../../../api/http";
import toast from "react-hot-toast";

const PalletTab = () => {
  const [pallets, setPallets] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [docks, setDocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [docksLoading, setDocksLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPallet, setSelectedPallet] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination state - matching backend response
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [filtersState, setFiltersState] = useState({
    search: "",
    pallet_type: "All Types",
    status: "All Status",
    warehouse_id: "All Warehouses",
  });

  // Fetch warehouses
  const fetchWarehouses = useCallback(async () => {
    try {
      setWarehousesLoading(true);
      const response = await http.get("/warehouses");
      if (response.data.success) {
        setWarehouses(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching warehouses:", err);
      toast.error("Failed to load warehouses");
    } finally {
      setWarehousesLoading(false);
    }
  }, []);

  // Fetch docks
  const fetchDocks = useCallback(async () => {
    try {
      setDocksLoading(true);
      const response = await http.get("/docks/?showIsActive=true");
      if (response.data.success) {
        setDocks(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching docks:", err);
      toast.error("Failed to load docks");
    } finally {
      setDocksLoading(false);
    }
  }, []);

  // Fetch pallets with pagination
  const fetchPallets = useCallback(async (page = 1, showToast = false) => {
    try {
      setLoading(true);
      if (showToast) setRefreshing(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      // Add filters if they're not "All" values
      if (filtersState.search) {
        params.append('search', filtersState.search);
      }
      if (filtersState.pallet_type !== "All Types") {
        params.append('pallet_type', filtersState.pallet_type);
      }
      if (filtersState.status !== "All Status") {
        params.append('status', filtersState.status);
      }
      if (filtersState.warehouse_id !== "All Warehouses" && filtersState.warehouse_id) {
        params.append('warehouse_id', filtersState.warehouse_id);
      }

      const response = await http.get(`/pallets?${params.toString()}`);
      
      if (response.data.success) {
        setPallets(response.data.data);
        // Update pagination from backend response
        setPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        });
        if (showToast) {
          toast.success("Pallets refreshed successfully");
        }
      } else {
        throw new Error("Failed to fetch pallets");
      }
    } catch (err) {
      console.error("Error fetching pallets:", err);
      const errorMsg = "Failed to load pallets. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      if (showToast) setRefreshing(false);
    }
  }, [pagination.limit, filtersState]);

  useEffect(() => {
    fetchPallets(1);
    fetchWarehouses();
    fetchDocks();
  }, []); // Empty dependency array - run once on mount

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchPallets(newPage);
  };

  const palletTypes = ["STANDARD", "EURO", "CUSTOM", "GAYLORD"];
  const palletStatuses = [
    "IN_STORAGE",
    "IN_TRANSIT",
    "RESERVED",
    "DAMAGED",
    "AVAILABLE",
    "EMPTY",
  ];

  // Warehouse filter options
  const warehouseOptions = useMemo(() => {
    const baseOptions = ["All Warehouses"];
    const warehouseList = warehouses.map((wh) => `${wh.warehouse_name} (${wh.warehouse_code})`);
    return [...baseOptions, ...warehouseList];
  }, [warehouses]);

  // Get warehouse ID from display name
  const getWarehouseIdFromName = (displayName) => {
    if (displayName === "All Warehouses") return null;
    const match = displayName.match(/\(([^)]+)\)/);
    if (match) {
      const code = match[1];
      const warehouse = warehouses.find((wh) => wh.warehouse_code === code);
      return warehouse ? warehouse.id : null;
    }
    return null;
  };

  // Get display name from warehouse ID
  const getWarehouseDisplayName = (warehouseId) => {
    if (warehouseId === "All Warehouses" || !warehouseId) return "All Warehouses";
    const warehouse = warehouses.find((wh) => wh.id === parseInt(warehouseId));
    return warehouse ? `${warehouse.warehouse_name} (${warehouse.warehouse_code})` : "All Warehouses";
  };

  const filters = [
    {
      key: "search",
      type: "search",
      label: "Search",
      placeholder: "Search pallet ID...",
      value: filtersState.search,
      className: "w-[280px]",
    },
    {
      key: "pallet_type",
      label: "Pallet Type",
      value: filtersState.pallet_type,
      options: ["All Types", ...palletTypes],
      className: "w-[200px]",
    },
    {
      key: "status",
      label: "Status",
      value: filtersState.status,
      options: ["All Status", ...palletStatuses],
      className: "w-[200px]",
    },
    {
      key: "warehouse_id",
      label: "Warehouse",
      value: getWarehouseDisplayName(filtersState.warehouse_id),
      options: warehouseOptions,
      className: "w-[250px]",
    },
  ];

  // Handle warehouse filter change
  const onFilterChange = (key, val) => {
    if (key === "warehouse_id") {
      const warehouseId = val === "All Warehouses" ? "All Warehouses" : getWarehouseIdFromName(val);
      setFiltersState((p) => ({ ...p, [key]: warehouseId }));
    } else {
      setFiltersState((p) => ({ ...p, [key]: val }));
    }
  };

  const onReset = () => {
    setFiltersState({
      search: "",
      pallet_type: "All Types",
      status: "All Status",
      warehouse_id: "All Warehouses",
    });
    fetchPallets(1);
    toast.success("Filters reset to default");
  };

  const onApply = () => {
    fetchPallets(1);
    toast.success("Filters applied");
  };

  const handleAddPallet = () => {
    setSelectedPallet(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditPallet = (pallet) => {
    setSelectedPallet(pallet);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeletePallet = async (pallet) => {
    if (!deleteConfirm || deleteConfirm.id !== pallet.id) {
      setDeleteConfirm({
        id: pallet.id,
        code: pallet.pallet_id,
      });
      return;
    }

    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        await http.delete(`/pallets/${pallet.id}`);
        // Refresh the current page after delete
        fetchPallets(pagination.page);
        setDeleteConfirm(null);
        resolve();
      } catch (err) {
        console.error("Error deleting pallet:", err);
        setDeleteConfirm(null);
        reject(err);
      }
    });

    toast.promise(deletePromise, {
      loading: "Deleting pallet...",
      success: "Pallet deleted successfully",
      error: (err) =>
        `Failed to delete pallet: ${err.response?.data?.message || "Unknown error"}`,
    });
  };

  const handleRefresh = () => {
    fetchPallets(pagination.page, true);
  };

  const handleModalClose = (refresh = false) => {
    setShowModal(false);
    setSelectedPallet(null);
    if (refresh) {
      fetchPallets(pagination.page);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      IN_STORAGE: "bg-green-100 text-green-700",
      IN_TRANSIT: "bg-blue-100 text-blue-700",
      RESERVED: "bg-yellow-100 text-yellow-700",
      DAMAGED: "bg-red-100 text-red-700",
      AVAILABLE: "bg-gray-100 text-gray-700",
      EMPTY: "bg-gray-100 text-gray-700",
    };
    return statusColors[status] || "bg-gray-100 text-gray-700";
  };

  const getPalletTypeColor = (type) => {
    const typeColors = {
      STANDARD: "bg-blue-100 text-blue-700",
      EURO: "bg-green-100 text-green-700",
      CUSTOM: "bg-purple-100 text-purple-700",
      GAYLORD: "bg-amber-100 text-amber-700",
    };
    return typeColors[type] || "bg-gray-100 text-gray-700";
  };

  const getLocationDisplay = (pallet) => {
    if (pallet.dock_id) {
      const dock = docks.find(d => d.id === pallet.dock_id);
      return dock ? `${dock.dock_name} (${dock.dock_code})` : "Not Assigned";
    }
    return pallet.current_location || "Not Assigned";
  };

  const columns = useMemo(
    () => [
      {
        key: "pallet_id",
        title: "Pallet ID",
        render: (row) => (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-blue-600">{row.pallet_id}</span>
          </div>
        ),
      },
      {
        key: "pallet_type",
        title: "Type",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getPalletTypeColor(row.pallet_type)}`}
          >
            {row.pallet_type}
          </span>
        ),
      },
      {
        key: "warehouse",
        title: "Warehouse",
        render: (row) => {
          const warehouse = warehouses.find((w) => w.id === row.warehouse_id);
          return (
            <div className="text-sm">
              <div className="font-medium">
                {warehouse?.warehouse_name || "Unknown"}
              </div>
              <div className="text-xs text-gray-500">
                {warehouse?.warehouse_code || ""}
              </div>
            </div>
          );
        },
      },
      {
        key: "current_location",
        title: "Current Location",
        render: (row) => (
          <span className="text-sm">{getLocationDisplay(row)}</span>
        ),
      },
      {
        key: "status",
        title: "Status",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(row.status)}`}
          >
            {row.status.replace("_", " ")}
          </span>
        ),
      },
      {
        key: "updated_at",
        title: "Last Updated",
        render: (row) => (
          <div className="text-sm">
            <div>{new Date(row.updated_at).toLocaleDateString()}</div>
            <div className="text-xs text-gray-500">
              {new Date(row.updated_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ),
      },
      {
        key: "actions",
        title: "Actions",
        render: (row) => (
          <div className="flex items-center justify-start gap-1">
            <button
              type="button"
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
              title="Edit"
              onClick={() => handleEditPallet(row)}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`rounded-md p-2 hover:bg-gray-100 ${deleteConfirm?.id === row.id ? "text-white bg-red-600" : "text-red-600"}`}
              title={deleteConfirm?.id === row.id ? "Confirm Delete" : "Delete"}
              onClick={() => handleDeletePallet(row)}
            >
              {deleteConfirm?.id === row.id ? (
                <span className="text-xs font-medium">Confirm</span>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        ),
      },
    ],
    [deleteConfirm, warehouses, docks],
  );

  // Add/Edit Pallet Modal
  const PalletModal = () => {
    // For create mode
    const [createFormData, setCreateFormData] = useState({
      pallet_type: "STANDARD",
      warehouse_id: warehouses.length > 0 ? warehouses[0].id : "",
      dock_id: "",
    });

    // For edit mode - only dock_id and status
    const [editFormData, setEditFormData] = useState({
      dock_id: "",
    });
    const [editStatus, setEditStatus] = useState("EMPTY");

    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState("");

    // Filter docks based on selected warehouse for create mode
    const filteredDocksForCreate = useMemo(() => {
      if (!createFormData.warehouse_id) return docks;
      return docks.filter(dock => dock.warehouse_id === parseInt(createFormData.warehouse_id));
    }, [docks, createFormData.warehouse_id]);

    // Filter docks based on selected pallet's warehouse for edit mode
    const filteredDocksForEdit = useMemo(() => {
      if (!selectedPallet?.warehouse_id) return docks;
      return docks.filter(dock => dock.warehouse_id === parseInt(selectedPallet.warehouse_id));
    }, [docks, selectedPallet]);

    useEffect(() => {
      if (selectedPallet && isEditing) {
        // Edit mode - only set dock_id and status
        setEditFormData({
          dock_id: selectedPallet.dock_id || "",
        });
        setEditStatus(selectedPallet.status);
      } else if (warehouses.length > 0) {
        // Create mode - reset form
        setCreateFormData({
          pallet_type: "STANDARD",
          warehouse_id: warehouses[0].id,
          dock_id: "",
        });
      }
      setModalError("");
    }, [selectedPallet, isEditing, warehouses]);

    const handleCreateChange = (e) => {
      const { name, value } = e.target;
      setCreateFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleEditChange = (e) => {
      const { name, value } = e.target;
      setEditFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleStatusChange = (e) => {
      setEditStatus(e.target.value);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setModalLoading(true);
      setModalError("");

      try {
        let response;

        if (isEditing && selectedPallet) {
          // Update pallet - ONLY dock_id and status can be updated
          const payload = {
            dock_id: editFormData.dock_id ? parseInt(editFormData.dock_id) : null,
            status: editStatus,
          };
          response = await http.put(`/pallets/${selectedPallet.id}`, payload);
        } else {
          // Create pallet - NO pallet_id field, NO status field
          // Only pallet_type, warehouse_id, and optional dock_id
          const payload = {
            pallet_type: createFormData.pallet_type,
            warehouse_id: parseInt(createFormData.warehouse_id),
          };
          
          // Only add dock_id if it's selected
          if (createFormData.dock_id) {
            payload.dock_id = parseInt(createFormData.dock_id);
          }
          
          response = await http.post("/pallets", payload);
        }

        if (response.data.success) {
          toast.success(
            isEditing
              ? "Pallet updated successfully"
              : "Pallet created successfully",
          );
          handleModalClose(true);
        } else {
          throw new Error(response.data.message || "Operation failed");
        }
      } catch (err) {
        console.error("Error saving pallet:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          `Failed to ${isEditing ? "update" : "create"} pallet. Please try again.`;
        setModalError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setModalLoading(false);
      }
    };

    if (!showModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold">
              {isEditing ? "Edit Pallet" : "Add New Pallet"}
            </h2>
            <button
              onClick={() => handleModalClose(false)}
              className="rounded-md p-1 hover:bg-gray-100"
              disabled={modalLoading}
            >
              <Package className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="max-h-[70vh] overflow-y-auto p-6">
              {modalError && (
                <div className="mb-4 rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{modalError}</p>
                </div>
              )}

              {isEditing ? (
                // EDIT MODE - Only dock location and status are editable
                <div className="space-y-6">
                  {/* Pallet Information - Read Only */}
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-gray-700">Pallet Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-600">
                          Pallet ID
                        </label>
                        <p className="text-sm font-medium text-gray-900">{selectedPallet?.pallet_id}</p>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-600">
                          Pallet Type
                        </label>
                        <p className="text-sm font-medium text-gray-900">{selectedPallet?.pallet_type}</p>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-600">
                          Warehouse
                        </label>
                        <p className="text-sm font-medium text-gray-900">
                          {warehouses.find(w => w.id === selectedPallet?.warehouse_id)?.warehouse_name || "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Editable Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Dock Location
                      </label>
                      <select
                        name="dock_id"
                        value={editFormData.dock_id}
                        onChange={handleEditChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        disabled={docksLoading}
                      >
                        <option value="">Select Dock </option>
                        {filteredDocksForEdit.map((dock) => (
                          <option key={dock.id} value={dock.id}>
                            {dock.dock_name} ({dock.dock_code}) - {dock.dock_type}
                          </option>
                        ))}
                      </select>
                      {docksLoading && (
                        <p className="mt-1 text-xs text-gray-500">
                          Loading docks...
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Status *
                      </label>
                      <select
                        value={editStatus}
                        onChange={handleStatusChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        required
                      >
                        {palletStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                
                </div>
              ) : (
                // CREATE MODE - All fields editable except status and pallet_id
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Pallet Type *
                    </label>
                    <select
                      name="pallet_type"
                      value={createFormData.pallet_type}
                      onChange={handleCreateChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      required
                    >
                      {palletTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Warehouse *
                    </label>
                    <select
                      name="warehouse_id"
                      value={createFormData.warehouse_id}
                      onChange={handleCreateChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      required
                      disabled={warehousesLoading}
                    >
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.warehouse_name} ({wh.warehouse_code})
                        </option>
                      ))}
                    </select>
                    {warehousesLoading && (
                      <p className="mt-1 text-xs text-gray-500">
                        Loading warehouses...
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Dock Location (Optional)
                    </label>
                    <select
                      name="dock_id"
                      value={createFormData.dock_id}
                      onChange={handleCreateChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      disabled={docksLoading || !createFormData.warehouse_id}
                    >
                      <option value="">Select Dock</option>
                      {filteredDocksForCreate.map((dock) => (
                        <option key={dock.id} value={dock.id}>
                          {dock.dock_name} ({dock.dock_code}) - {dock.dock_type}
                        </option>
                      ))}
                    </select>
                    {docksLoading && (
                      <p className="mt-1 text-xs text-gray-500">
                        Loading docks...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleModalClose(false)}
                  disabled={modalLoading}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {modalLoading ? "Saving..." : isEditing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Convert pagination for the Pagination component (which expects 'pages')
  const paginationForComponent = {
    page: pagination.page,
    pages: pagination.totalPages,
    total: pagination.total,
    limit: pagination.limit
  };

  if (loading && !refreshing && pallets.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 animate-pulse text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Loading pallets...</p>
        </div>
      </div>
    );
  }

  if (error && pallets.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Pallet Management
          </h2>
          <p className="text-sm text-gray-600">
            Manage and track pallets in your warehouse
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Package className="h-4 w-4" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={handleAddPallet}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <Package className="h-4 w-4" />+ Add Pallet
          </button>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        onApply={onApply}
        onReset={onReset}
      />

      <div className="mt-4 rounded-lg border border-gray-200 bg-white">
        {pallets.length > 0 ? (
          <>
            <CusTable columns={columns} data={pallets} />
            {pagination.totalPages > 1 && (
              <Pagination 
                pagination={paginationForComponent} 
                onPageChange={handlePageChange} 
              />
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No pallets found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or add a new pallet.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleAddPallet}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Package className="-ml-0.5 mr-1.5 inline h-4 w-4" />
                Add New Pallet
              </button>
            </div>
          </div>
        )}
      </div>

      <PalletModal />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Confirm Delete</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete pallet{" "}
              <strong>{deleteConfirm.code}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const pallet = pallets.find((p) => p.id === deleteConfirm.id);
                  if (pallet) handleDeletePallet(pallet);
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PalletTab;
import { useState, useEffect, useCallback } from "react";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import Pagination from "../components/Pagination";
import RateCardModal from "./components/RateCardModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "../components/toast/ToastProvider";
import http from "../../api/http";
import PaginatedEntityDropdown from "../inbound/components/asnform/common/PaginatedEntityDropdown";

const RateCards = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("rate");
  const [filters, setFilters] = useState({
    client_id: "",
    chargeType: "All",
    is_active: "All",
    search: "",
  });
  const [rateCards, setRateCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRateCard, setSelectedRateCard] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rateCardToDelete, setRateCardToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 1,
    limit: 20,
  });

  const fetchRateCards = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
        };

        if (filters.client_id) params.client_id = filters.client_id;

        if (filters.chargeType && filters.chargeType !== "All") {
          params.charge_type = filters.chargeType;
        }

        if (filters.is_active && filters.is_active !== "All") {
          params.is_active = filters.is_active;
        }

        if (filters.search) params.search = filters.search;

        const response = await http.get("/rate-cards/", { params });

        if (response.data.success) {
          setRateCards(response.data.data.rate_cards);
          setPagination({
            ...pagination,
            total: response.data.data.pagination.total,
            pages: response.data.data.pagination.pages,
          });
        }
      } catch (error) {
        console.error("Error fetching rate cards:", error);
        toast.error(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Failed to fetch rate cards",
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [
      filters.client_id,
      filters.chargeType,
      filters.is_active,
      filters.search,
      pagination.page,
      pagination.limit,
      toast,
    ],
  );

  const openDeleteModal = (rateCard) => {
    setRateCardToDelete(rateCard);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!rateCardToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await http.delete(`/rate-cards/${rateCardToDelete.id}`);

      if (response.data.success) {
        toast.success(
          response.data.message || "Rate card deleted successfully",
        );

        setRateCards((prev) =>
          prev.map((card) =>
            card.id === rateCardToDelete.id
              ? { ...card, is_active: false }
              : card,
          ),
        );

        setDeleteModalOpen(false);
        setRateCardToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting rate card:", error);

      if (error.response?.data?.message?.includes("already inactive")) {
        toast.info("This rate card is already inactive");
        setRateCards((prev) =>
          prev.map((card) =>
            card.id === rateCardToDelete.id
              ? { ...card, is_active: false }
              : card,
          ),
        );
        setDeleteModalOpen(false);
        setRateCardToDelete(null);
      } else {
        toast.error(
          error.response?.data?.message || "Error deleting rate card",
        );
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalSuccess = (message) => {
    toast.success(message);
    fetchRateCards(false);
  };

  const handleEdit = (rateCard) => {
    setSelectedRateCard(rateCard);
    setModalOpen(true);
  };

  const handleNewRateCard = () => {
    setSelectedRateCard(null);
    setModalOpen(true);
  };

  useEffect(() => {
    fetchRateCards();
  }, [fetchRateCards]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== undefined) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  const tabs = [
    { id: "billable", label: "Billable Events" },
    { id: "ready", label: "Ready to Invoice" },
    { id: "invoiced", label: "Invoiced" },
    { id: "payments", label: "Payments / Aging" },
    { id: "rate", label: "Rate Cards" },
  ];

  const chargeTypeOptions = [
    "All",
    ...new Set(rateCards.map((card) => card.charge_type)),
  ];

  const filterConfig = [
    {
      key: "chargeType",
      label: "",
      value: filters.chargeType,
      options: chargeTypeOptions,
    },
    {
      key: "search",
      type: "search",
      label: "",
      placeholder: "Search Rate Cards...",
      value: filters.search,
      className: "min-w-[260px]",
    },
  ];

  const ChargeTypePill = ({ value }) => {
    const chargeTypeMap = {
      STORAGE: { label: "Storage", color: "bg-blue-50 text-blue-700" },
      INBOUND_HANDLING: {
        label: "Inbound",
        color: "bg-green-50 text-green-700",
      },
      PUTAWAY: { label: "Putaway", color: "bg-green-50 text-green-700" },
      PICKING: { label: "Pick/Pack", color: "bg-orange-50 text-orange-700" },
      PACKING: { label: "Pick/Pack", color: "bg-orange-50 text-orange-700" },
      SHIPPING_ADMIN: { label: "Shipping", color: "bg-gray-100 text-gray-700" },
      VALUE_ADDED_SERVICE: {
        label: "Value Added",
        color: "bg-purple-50 text-purple-700",
      },
      OTHER: { label: "Other", color: "bg-gray-100 text-gray-700" },
    };

    const { label, color } = chargeTypeMap[value] || {
      label: value.replace(/_/g, " "),
      color: "bg-gray-100 text-gray-700",
    };

    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${color}`}
      >
        {label}
      </span>
    );
  };

  const BillingBasisPill = ({ value }) => {
    const basisMap = {
      PER_UNIT: "Per Unit",
      PER_UNIT_PER_DAY: "Per Unit / Day",
      PER_PALLET: "Per Pallet",
      PER_PALLET_PER_DAY: "Per Pallet / Day",
      PER_SQFT_PER_DAY: "Per Sq Ft / Day",
      PER_CASE: "Per Case",
      PER_LINE: "Per Line",
      PER_ORDER: "Per Order",
      PER_CARTON: "Per Carton",
      PER_SHIPMENT: "Per Shipment",
      PER_KG: "Per KG",
      FLAT_RATE: "Flat Rate",
    };

    return <span>{basisMap[value] || value.replace(/_/g, " ")}</span>;
  };

  const columns = [
    {
      key: "rate_card_name",
      title: "Rate Card Name",
      render: (row) => (
        <button
          onClick={() => handleEdit(row)}
          className={`font-semibold ${row.is_active ? "text-blue-600 hover:text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
          title={
            row.is_active ? "Click to edit" : "Click to edit and reactivate"
          }
        >
          {row.rate_card_name}
        </button>
      ),
    },
    {
      key: "charge_type",
      title: "Charge Type",
      render: (row) => <ChargeTypePill value={row.charge_type} />,
    },
    {
      key: "billing_basis",
      title: "Basis",
      render: (row) => <BillingBasisPill value={row.billing_basis} />,
    },
    {
      key: "rate",
      title: "Rate",
      render: (row) => `${parseFloat(row.rate).toFixed(2)} ${row.currency}`,
    },
    {
      key: "min_charge",
      title: "Min Charge",
      render: (row) =>
        `${parseFloat(row.min_charge).toFixed(2)} ${row.currency}`,
    },
    {
      key: "effective_from",
      title: "Effective Period",
      render: (row) => {
        const from = new Date(row.effective_from).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const to = new Date(row.effective_to).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return `${from} - ${to}`;
      },
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            row.is_active
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center justify-start gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
              row.is_active
                ? "border-gray-200 bg-white text-red-600 hover:bg-red-50"
                : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
            }`}
            title={
              row.is_active
                ? "Delete (Mark as Inactive)"
                : "Cannot delete inactive rate card"
            }
            disabled={!row.is_active}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setFilters({ chargeType: "All", search: "" });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleApply = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto py-6 space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <FilterBar
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
                onApply={handleApply}
              >
                <div className="w-full sm:w-[260px]">
                  <p className="text-xs text-gray-500 mb-1">Client</p>

                  <PaginatedEntityDropdown
                    endpoint="/clients"
                    listKey="clients"
                    value={filters.client_id}
                    onChange={(id) => handleFilterChange("client_id", id)}
                    placeholder="All Clients"
                    limit={10}
                    enableSearch
                    searchParam="search"
                    renderItem={(c) => ({
                      title: `${c.client_name} (${c.client_code || "-"})`,
                      subtitle: c.email || c.phone || "",
                    })}
                  />
                </div>
              </FilterBar>
            </div>

            <button
              onClick={handleNewRateCard}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              New Rate Card
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <CusTable columns={columns} data={rateCards} />
              {rateCards.length > 0 && (
                <Pagination
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              )}
              {rateCards.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                  No rate cards found
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <RateCardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        rateCard={selectedRateCard}
      />

      <ConfirmDeleteModal
        open={deleteModalOpen}
        title="Deactivate Rate Card"
        message={`Are you sure you want to deactivate "${rateCardToDelete?.rate_card_name}"? This will mark it as inactive. You can reactivate it through edit.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        loading={deleteLoading}
        onClose={() => {
          setDeleteModalOpen(false);
          setRateCardToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default RateCards;

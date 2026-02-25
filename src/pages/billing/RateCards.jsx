import React, { useState, useEffect } from "react";
import FilterBar from "../components/FilterBar";
import CusTable from "../components/CusTable";
import { Download, Plus, Play, Pencil, Copy } from "lucide-react";
import http from "../../api/http";

const RateCards = () => {
  const [activeTab, setActiveTab] = useState("rate");
  const [filters, setFilters] = useState({
    chargeType: "",
    search: "",
  });
  const [rateCards, setRateCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 1,
    limit: 20,
  });

  // Fetch rate cards from API
  const fetchRateCards = async () => {
    setLoading(true);
    try {
      const params = {
        client_id: 1,
        page: pagination.page,
        limit: pagination.limit,
      };

      // Add filters if they exist
      if (filters.chargeType && filters.chargeType !== "All") {
        params.charge_type = filters.chargeType;
      }
      if (filters.search) {
        params.search = filters.search;
      }

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
      // You might want to show an error toast here
    } finally {
      setLoading(false);
    }
  };

  // Fetch on component mount and when filters/pagination changes
  useEffect(() => {
    fetchRateCards();
  }, [filters.chargeType, filters.search, pagination.page]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== undefined) {
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on search
        fetchRateCards();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Header Tabs (UI only)
  const tabs = [
    { id: "billable", label: "Billable Events" },
    { id: "ready", label: "Ready to Invoice" },
    { id: "invoiced", label: "Invoiced" },
    { id: "payments", label: "Payments / Aging" },
    { id: "rate", label: "Rate Cards" },
  ];

  // Extract unique charge types from data for filter options
  const chargeTypeOptions = [
    "All",
    ...new Set(rateCards.map(card => card.charge_type))
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
    // Map API charge types to display names and colors
    const chargeTypeMap = {
      STORAGE: { label: "Storage", color: "bg-blue-50 text-blue-700" },
      INBOUND_HANDLING: { label: "Inbound", color: "bg-green-50 text-green-700" },
      PUTAWAY: { label: "Putaway", color: "bg-green-50 text-green-700" },
      PICKING: { label: "Pick/Pack", color: "bg-orange-50 text-orange-700" },
      PACKING: { label: "Pick/Pack", color: "bg-orange-50 text-orange-700" },
      SHIPPING_ADMIN: { label: "Shipping", color: "bg-gray-100 text-gray-700" },
    };

    const { label, color } = chargeTypeMap[value] || { 
      label: value.replace(/_/g, ' '), 
      color: "bg-gray-100 text-gray-700" 
    };

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
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
      PER_SHIPMENT: "Per Shipment",
      PER_ORDER: "Per Order",
      PER_KG: "Per KG",
    };

    return <span>{basisMap[value] || value.replace(/_/g, ' ')}</span>;
  };

  const columns = [
    {
      key: "rate_card_name",
      title: "Rate Card Name",
      render: (row) => (
        <button className="font-semibold text-blue-600 hover:text-blue-700">
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
      render: (row) => parseFloat(row.rate).toFixed(2)
    },
    { key: "currency", title: "Currency" },
    { 
      key: "effective_from", 
      title: "Effective From",
      render: (row) => new Date(row.effective_from).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center justify-start gap-2">
          <button 
            onClick={() => handleEdit(row)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={() => handleDuplicate(row)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          >
            <Copy size={16} />
          </button>
        </div>
      ),
    },
  ];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({ chargeType: "All", search: "" });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleApply = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchRateCards();
  };

  const handleEdit = (rateCard) => {
    console.log("Edit rate card:", rateCard);
    // Navigate to edit page or open modal
  };

  const handleDuplicate = (rateCard) => {
    console.log("Duplicate rate card:", rateCard);
    // Handle duplication logic
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-5">
        {/* Filter row + New Rate Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <FilterBar
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
                onApply={handleApply}
              />
            </div>

            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus size={16} />
              New Rate Card
            </button>
          </div>
        </div>

        {/* Table with loading state */}
        <div className="rounded-xl border border-gray-200 bg-white">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <CusTable 
              columns={columns} 
              data={rateCards} 
              pagination={{
                currentPage: pagination.page,
                totalPages: pagination.pages,
                totalItems: pagination.total,
                onPageChange: handlePageChange,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RateCards;
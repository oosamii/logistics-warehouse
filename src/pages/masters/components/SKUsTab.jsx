import React, { useEffect, useMemo, useState } from "react";
import FilterBar from "../../components/FilterBar";
import CusTable from "../../components/CusTable";
import Pagination from "../../components/Pagination";
import { Pencil } from "lucide-react";
import http from "../../../api/http";
import AddSkuModal from "./modals/AddSkuModal";
import { useAccess } from "../../utils/useAccess";
import { getUserRole } from "../../utils/authStorage";
import { useNavigate } from "react-router-dom";

const SKUsTab = () => {
  const navigate = useNavigate();
  const [filtersState, setFiltersState] = useState({
    client: "All Clients",
    category: "All Categories",
    controls: "Any",
    search: "",
  });

  const [loading, setLoading] = useState(false);
  const [skus, setSkus] = useState([]);
  const [clients, setClients] = useState([]);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  });

  // modal
  const [showSkuModal, setShowSkuModal] = useState(false);
  const [skuMode, setSkuMode] = useState("create"); // create | edit
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingSku, setEditingSku] = useState(null);

  const roleCode = getUserRole();
  const isAdmin = roleCode === "ADMIN";
  const access = useAccess("SKUS");
  const canCreateSku = isAdmin || access.canCreate;
  const canUpdateSku = isAdmin || access.canUpdate;
  const canDeleteSku = isAdmin || access.canDelete;
  const showActionsColumn = canUpdateSku || canDeleteSku;

  const onFilterChange = (key, val) =>
    setFiltersState((p) => ({ ...p, [key]: val }));

  const onReset = () => {
    setFiltersState({
      client: "All Clients",
      category: "All Categories",
      controls: "Any",
      search: "",
    });
    fetchSkus(1);
  };

  const onApply = () => fetchSkus(1);

  const fetchClients = async () => {
    // for dropdown only (cheap)
    const res = await http.get("/clients?page=1&limit=200");
    setClients(res?.data?.data?.clients || []);
  };

  const fetchSkus = async (page = 1) => {
    try {
      setLoading(true);
      const limit = pagination.limit || 10;

      // If your backend supports filters, pass them here.
      // For now: server pagination + client-side filters
      const res = await http.get(`/skus?page=${page}&limit=${limit}`);
      const payload = res?.data?.data;

      setSkus(payload?.skus || payload?.items || payload || []); // supports different response shapes
      setPagination(
        payload?.pagination || { total: 0, page: 1, pages: 1, limit },
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchSkus(1);
  }, []);

  const clientOptions = useMemo(() => {
    const names = (clients || []).map((c) => c.client_name);
    return ["All Clients", ...names];
  }, [clients]);

  const filters = [
    {
      key: "client",
      label: "Client",
      value: filtersState.client,
      options: clientOptions,
      className: "w-[220px]",
    },
    {
      key: "category",
      label: "Category",
      value: filtersState.category,
      options: [
        "All Categories",
        "Electronics",
        "FMCG",
        "Apparel",
        "Food",
        "Home",
        "Furniture",
      ],
      className: "w-[220px]",
    },
    {
      key: "controls",
      label: "Controls",
      value: filtersState.controls,
      options: ["Any", "With Controls", "No Controls"],
      className: "w-[220px]",
    },
    {
      key: "search",
      type: "search",
      label: "Search",
      placeholder: "Search SKU code / name...",
      value: filtersState.search,
      className: "w-[360px]",
    },
  ];

  const mapControls = (r) => {
    const list = [];
    if (r.requires_serial_tracking) list.push("Serial");
    if (r.requires_batch_tracking) list.push("Batch");
    if (r.requires_expiry_tracking) list.push("Expiry");
    if (r.fragile) list.push("Fragile");
    if (r.hazardous) list.push("Hazardous");
    return list;
  };

  const filteredRows = useMemo(() => {
    const q = (filtersState.search || "").toLowerCase().trim();

    return (skus || []).filter((r) => {
      const matchesSearch =
        !q || `${r.sku_code} ${r.sku_name}`.toLowerCase().includes(q);

      const matchesCategory =
        filtersState.category === "All Categories" ||
        (r.category || "") === filtersState.category;

      const controls = mapControls(r);
      const hasControls = controls.length > 0;
      const matchesControls =
        filtersState.controls === "Any" ||
        (filtersState.controls === "With Controls" && hasControls) ||
        (filtersState.controls === "No Controls" && !hasControls);

      const clientName = r.client_name || r.client?.client_name; // if API embeds
      const matchesClient =
        filtersState.client === "All Clients" ||
        clientName === filtersState.client;

      return (
        matchesSearch && matchesCategory && matchesControls && matchesClient
      );
    });
  }, [skus, filtersState]);

  const openCreate = () => {
    // if you want enforce a client selection for create, you can choose first client or show warning
    setSkuMode("create");
    setEditingSku(null);
    setSelectedClient(null);
    setShowSkuModal(true);
  };

  const openEdit = async (row) => {
    // safer: fetch single sku for full fields
    const res = await http.get(`/skus/${row.id}`);
    const sku = res?.data?.data || res?.data;

    setSkuMode("edit");
    setEditingSku(sku);
    setSelectedClient(null);
    setShowSkuModal(true);
  };

  const columns = useMemo(
    () => [
      {
        key: "sku_code",
        title: "SKU Code",
        render: (row) => (
          <div>
            <button
              className="text-sm font-semibold text-blue-600 hover:underline"
              onClick={() => navigate(`/inventory/sku/${row.id}?page=putaway`)}
            >
              {row.sku_code}
            </button>
            <div className="text-xs text-gray-500">{row.sku_name}</div>
          </div>
        ),
      },
      { key: "category", title: "Category" },
      { key: "uom", title: "UOM", render: (row) => row.uom || "-" },
      {
        key: "controls",
        title: "Controls",
        render: (row) => {
          const list = mapControls(row);
          if (!list.length) return <span className="text-gray-500">-</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {list.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                >
                  {c}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        key: "putaway_zone",
        title: "Putaway Zone",
        render: (row) => row.putaway_zone || "-",
      },
      {
        key: "pick_rule",
        title: "Pick Rule",
        render: (row) => row.pick_rule || "-",
      },
      {
        key: "status",
        title: "Status",
        render: (row) => {
          const isActive = row.is_active !== false; // default active
          return (
            <span
              className={[
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
                isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700",
              ].join(" ")}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      ...(showActionsColumn
        ? [
            {
              key: "actions",
              title: "Actions",
              render: (row) => (
                <div className="flex items-center gap-2">
                  {canUpdateSku && (
                    <button
                      type="button"
                      className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                      title="Edit"
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ),
            },
          ]
        : []),
    ],
    [clients, filtersState],
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        {canCreateSku && (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
          >
            + Add SKU
          </button>
        )}
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        onApply={onApply}
        onReset={onReset}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-2">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading SKUs...</div>
        ) : (
          <CusTable columns={columns} data={filteredRows} />
        )}

        <Pagination
          pagination={pagination}
          onPageChange={(p) => fetchSkus(p)}
        />
      </div>

      <AddSkuModal
        open={showSkuModal}
        mode={skuMode}
        client={selectedClient}
        sku={editingSku}
        onClose={() => setShowSkuModal(false)}
        onCreated={() => fetchSkus(pagination.page)}
        onUpdated={() => fetchSkus(pagination.page)}
      />
    </div>
  );
};

export default SKUsTab;

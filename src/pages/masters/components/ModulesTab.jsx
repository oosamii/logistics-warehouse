import React, { useEffect, useMemo, useState } from "react";
import FilterBar from "../../components/FilterBar";
import CusTable from "../../components/CusTable";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import http from "../../../api/http";
import { Field, Modal } from "./helper";
import { toast } from "react-hot-toast";
import { useAccess } from "../../utils/useAccess";
import { getUserRole } from "../../utils/authStorage";
import { MODULE_CODES } from "../../routes/routePerms";

const emptyModule = {
  name: "",
  code: "",
  description: "",
  display_order: "",
  icon: "",
  is_active: true,
};

const ModulesTab = () => {
  const [filtersState, setFiltersState] = useState({
    search: "",
    status: "All",
  });

  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);

  // create/edit
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [activeModule, setActiveModule] = useState(null);
  const [form, setForm] = useState(emptyModule);
  const [formErrors, setFormErrors] = useState({});

  // delete
  const [showDelete, setShowDelete] = useState(false);
  const [deleteObj, setDeleteObj] = useState(null);

  const roleCode = getUserRole();
  const isAdmin = roleCode === "ADMIN";
  const access = useAccess("MODULES");
  const canCreate = isAdmin || access.canCreate;
  const canUpdate = isAdmin || access.canUpdate;
  const canDelete = isAdmin || access.canDelete;
  const showActionsColumn = canUpdate || canDelete;

  const filters = [
    {
      key: "search",
      type: "search",
      label: "Search",
      placeholder: "Search name / code / description...",
      value: filtersState.search,
      className: "w-[360px]",
    },
    {
      key: "status",
      label: "Status",
      value: filtersState.status,
      options: ["All", "Active", "Inactive"],
      className: "w-[200px]",
    },
  ];

  const onFilterChange = (key, val) =>
    setFiltersState((p) => ({ ...p, [key]: val }));

  const onReset = () => setFiltersState({ search: "", status: "All" });
  const onApply = () => {};

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await http.get("/modules");
      const list =
        res?.data?.data?.map((m, i) => ({ ...m, slNo: i + 1 })) || [];
      setModules(list);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to fetch modules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const filteredModules = useMemo(() => {
    const q = (filtersState.search || "").toLowerCase().trim();
    const status = filtersState.status;

    return modules.filter((m) => {
      const matchesQ =
        !q ||
        `${m.name || ""} ${m.code || ""} ${m.description || ""} ${m.icon || ""}`
          .toLowerCase()
          .includes(q);

      const isActive = m.is_active ?? true;
      const matchesStatus =
        status === "All" ||
        (status === "Active" && isActive) ||
        (status === "Inactive" && !isActive);

      return matchesQ && matchesStatus;
    });
  }, [modules, filtersState]);

  const validate = () => {
    const errs = {};

    if (!form.name?.trim()) errs.name = "Name is required";
    if (!form.code?.trim()) errs.code = "Code is required";
    // Code suggested format: CAPS + underscore (optional)
    if (form.code && !/^[A-Z0-9_]+$/.test(form.code)) {
      errs.code = "Use only A-Z, 0-9, underscore (e.g. INBOUND)";
    }

    if (form.display_order === "" || form.display_order === null) {
      errs.display_order = "Display order is required";
    } else if (!/^\d+$/.test(String(form.display_order))) {
      errs.display_order = "Display order must be a number";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreate = () => {
    setMode("create");
    setActiveModule(null);
    setForm(emptyModule);
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (m) => {
    setMode("edit");
    setActiveModule(m);
    setForm({
      name: m.name || "",
      code: m.code || "",
      description: m.description || "",
      display_order:
        m.display_order === 0 || m.display_order ? String(m.display_order) : "",
      icon: m.icon || "",
      is_active: m.is_active ?? true,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description?.trim() || "",
        display_order: Number(form.display_order),
        icon: form.icon?.trim() || "",
        ...(mode === "edit" ? { is_active: !!form.is_active } : {}),
      };

      if (mode === "create") {
        await http.post("/modules", payload);
      } else {
        const id = activeModule?.id || activeModule?._id;
        await http.put(`/modules/${id}`, payload);
      }

      toast.success(
        `Module ${mode === "create" ? "created" : "updated"} successfully.`,
      );

      setShowForm(false);
      await fetchModules();
    } catch (e) {
      const data = e?.response?.data;
      toast.error(data?.message || "Failed to save module");

      // if backend ever sends field errors in array like users
      if (Array.isArray(data?.errors)) {
        const mapped = data.errors.reduce((acc, item) => {
          if (item?.field && item?.message) acc[item.field] = item.message;
          return acc;
        }, {});
        setFormErrors((prev) => ({ ...prev, ...mapped }));
      }

      console.error("Save module error:", {
        status: e?.response?.status,
        data,
      });
    } finally {
      setLoading(false);
    }
  };

  const askDelete = (m) => {
    setDeleteObj(m);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    const m = deleteObj;
    if (!m) return;

    const id = m?.id || m?._id;

    try {
      setLoading(true);
      await http.delete(`/modules/${id}`);
      toast.success("Module deleted successfully.");
      setShowDelete(false);
      setDeleteObj(null);
      await fetchModules();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to delete module");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      { key: "slNo", title: "Sl No." },
      { key: "name", title: "Name" },
      { key: "code", title: "Code" },
      {
        key: "description",
        title: "Description",
        render: (row) => row.description || "-",
      },
      {
        key: "display_order",
        title: "Order",
        render: (row) =>
          row.display_order === 0 || row.display_order
            ? row.display_order
            : "-",
      },
      { key: "icon", title: "Icon" },
      {
        key: "status",
        title: "Status",
        render: (row) => {
          const isActive = row.is_active ?? true;
          return (
            <span
              className={[
                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
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
                  {canUpdate && (
                    <button
                      className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700"
                      onClick={() => openEdit(row)}
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white"
                      onClick={() => askDelete(row)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ),
            },
          ]
        : []),
    ],
    [],
  );

  const moduleOptions = useMemo(() => {
    return MODULE_CODES.map((m) => ({
      label: m,
      value: m,
    }));
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        {canCreate && (
          <button
            onClick={openCreate}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
          >
            + Add Module
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
          <div className="p-6 text-sm text-gray-600">Loading...</div>
        ) : (
          <CusTable columns={columns} data={filteredModules} />
        )}
      </div>

      {showForm && (
        <Modal
          title={mode === "create" ? "Add Module" : "Edit Module"}
          subtitle={
            mode === "create"
              ? "Create a new module (token required)."
              : "Update module details."
          }
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={submitForm}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {mode === "create" ? "Create" : "Update"}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 pb-32">
            <Field
              label="Name"
              required
              value={form.name}
              error={formErrors.name}
              onChange={(v) => {
                setForm((p) => ({ ...p, name: v }));
                setFormErrors((e) => ({ ...e, name: "" }));
              }}
            />
            {/* <Field
              label="Code"
              required
              value={form.code}
              error={formErrors.code}
              onChange={(v) => {
                const next = v.toUpperCase().replace(/\s+/g, "_");
                setForm((p) => ({ ...p, code: next }));
                setFormErrors((e) => ({ ...e, code: "" }));
              }}
            /> */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code *
              </label>

              <select
                value={form.code || ""}
                onChange={(e) => {
                  setForm((p) => ({ ...p, code: e.target.value }));
                  setFormErrors((err) => ({ ...err, code: "" }));
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select Module</option>

                {MODULE_CODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              {formErrors.code && (
                <p className="mt-1 text-xs text-red-500">{formErrors.code}</p>
              )}
            </div>
            <Field
              label="Display Order"
              required
              value={form.display_order}
              error={formErrors.display_order}
              onChange={(v) => {
                if (!/^\d*$/.test(v)) return;
                setForm((p) => ({ ...p, display_order: v }));
                setFormErrors((e) => ({ ...e, display_order: "" }));
              }}
            />
            <Field
              label="Icon"
              value={form.icon}
              error={formErrors.icon}
              onChange={(v) => setForm((p) => ({ ...p, icon: v }))}
            />
            <div className="md:col-span-2">
              <Field
                label="Description"
                value={form.description}
                error={formErrors.description}
                onChange={(v) => setForm((p) => ({ ...p, description: v }))}
              />
            </div>
            {mode === "edit" && (
              <div className="md:col-span-2 flex items-center gap-3 pt-1">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, is_active: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
            )}
          </div>
        </Modal>
      )}

      <ConfirmDeleteModal
        open={showDelete}
        title="Delete Module"
        message={`Are you sure you want to delete "${deleteObj?.name || ""}"?`}
        loading={loading}
        onClose={() => {
          if (loading) return;
          setShowDelete(false);
          setDeleteObj(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ModulesTab;

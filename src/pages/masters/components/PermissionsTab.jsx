import React, { useEffect, useMemo, useState } from "react";
import FilterBar from "../../components/FilterBar";
import CusTable from "../../components/CusTable";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import http from "../../../api/http";
import { Field, Modal } from "./helper";
import { toast } from "react-hot-toast";
import { useAccess } from "../../utils/useAccess";
import { getUserRole } from "../../utils/authStorage";
import { PERMISSION_ACTIONS } from "../../routes/routePerms";

const emptyPermission = {
  name: "",
  code: "",
  description: "",
};

const PermissionsTab = () => {
  const [filtersState, setFiltersState] = useState({ search: "" });
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);

  // create/edit
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [activePermission, setActivePermission] = useState(null);
  const [form, setForm] = useState(emptyPermission);
  const [formErrors, setFormErrors] = useState({});

  // delete
  const [showDelete, setShowDelete] = useState(false);
  const [deleteObj, setDeleteObj] = useState(null);

  const roleCode = getUserRole();
  const isAdmin = roleCode === "ADMIN";
  const access = useAccess("PERMISSIONS");
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
      className: "w-[420px]",
    },
  ];

  const onFilterChange = (key, val) =>
    setFiltersState((p) => ({ ...p, [key]: val }));

  const onReset = () => setFiltersState({ search: "" });
  const onApply = () => {};

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const res = await http.get("/permissions");
      const list = res?.data?.data || [];
      setPermissions(list);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to fetch permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const filtered = useMemo(() => {
    const q = (filtersState.search || "").toLowerCase().trim();
    if (!q) return permissions;

    return permissions.filter((p) =>
      `${p.name || ""} ${p.code || ""} ${p.description || ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [permissions, filtersState]);

  const validate = () => {
    const errs = {};
    if (!form.name?.trim()) errs.name = "Name is required";
    if (!form.code?.trim()) errs.code = "Code is required";

    if (form.code && !/^[A-Z0-9_]+$/.test(form.code)) {
      errs.code = "Use only A-Z, 0-9, underscore (e.g. ASSIGN)";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreate = () => {
    setMode("create");
    setActivePermission(null);
    setForm(emptyPermission);
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (p) => {
    setMode("edit");
    setActivePermission(p);
    setForm({
      name: p.name || "",
      code: p.code || "",
      description: p.description || "",
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
      };

      if (mode === "create") {
        await http.post("/permissions", payload);
      } else {
        const id = activePermission?.id || activePermission?._id;
        await http.put(`/permissions/${id}`, payload);
      }

      toast.success(
        `Permission ${mode === "create" ? "created" : "updated"} successfully.`,
      );

      setShowForm(false);
      await fetchPermissions();
    } catch (e) {
      const data = e?.response?.data;
      toast.error(data?.message || "Failed to save permission");

      // if backend sends array errors like users/modules
      if (Array.isArray(data?.errors)) {
        const mapped = data.errors.reduce((acc, item) => {
          if (item?.field && item?.message) acc[item.field] = item.message;
          return acc;
        }, {});
        setFormErrors((prev) => ({ ...prev, ...mapped }));
      }

      console.error("Save permission error:", {
        status: e?.response?.status,
        data,
      });
    } finally {
      setLoading(false);
    }
  };

  const askDelete = (p) => {
    setDeleteObj(p);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    const p = deleteObj;
    if (!p) return;

    const id = p?.id || p?._id;

    try {
      setLoading(true);
      await http.delete(`/permissions/${id}`);
      toast.success("Permission deleted successfully.");
      setShowDelete(false);
      setDeleteObj(null);
      await fetchPermissions();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to delete permission");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      { key: "name", title: "Name" },
      { key: "code", title: "Code" },
      {
        key: "description",
        title: "Description",
        render: (row) => row.description || "-",
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

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        {canCreate && (
          <button
            onClick={openCreate}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
          >
            + Add Permission
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
          <CusTable columns={columns} data={filtered} />
        )}
      </div>

      {showForm && (
        <Modal
          title={mode === "create" ? "Add Permission" : "Edit Permission"}
          subtitle={
            mode === "create"
              ? "Create a new permission (token required)."
              : "Update permission details."
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code *
              </label>

              <select
                value={form.code}
                onChange={(e) => {
                  setForm((p) => ({ ...p, code: e.target.value }));
                  setFormErrors((err) => ({ ...err, code: "" }));
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select Permission</option>

                {PERMISSION_ACTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {formErrors.code && (
                <p className="mt-1 text-xs text-red-500">{formErrors.code}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Field
                label="Description"
                value={form.description}
                error={formErrors.description}
                onChange={(v) => setForm((p) => ({ ...p, description: v }))}
              />
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDeleteModal
        open={showDelete}
        title="Delete Permission"
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

export default PermissionsTab;

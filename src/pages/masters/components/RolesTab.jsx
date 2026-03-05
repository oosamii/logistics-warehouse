import React, { useEffect, useMemo, useState } from "react";
import FilterBar from "../../components/FilterBar";
import CusTable from "../../components/CusTable";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import http from "../../../api/http";
import { Field, Modal } from "./helper";
import { toast } from "react-hot-toast";
import { getUserRole } from "../../utils/authStorage";
import { useAccess } from "../../utils/useAccess";

const emptyRole = {
  role_name: "",
  role_code: "",
  description: "",
  is_active: true,
};

const RolesTab = () => {
  const [filtersState, setFiltersState] = useState({
    search: "",
    status: "All",
  });

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [grantedMap, setGrantedMap] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [activeRole, setActiveRole] = useState(null);
  const [form, setForm] = useState(emptyRole);
  const [formErrors, setFormErrors] = useState({});
  const [showDelete, setShowDelete] = useState(false);
  const [deleteObj, setDeleteObj] = useState(null);
  const [showAccessModal, setShowAccessModal] = useState(false); // new

  const roleCode = getUserRole();
  const isAdmin = roleCode === "ADMIN";
  const access = useAccess("ROLES");
  const canCreate = isAdmin || access.canCreate;
  const canUpdate = isAdmin || access.canUpdate;
  const canDelete = isAdmin || access.canDelete;
  const showActionsColumn = canUpdate || canDelete;

  const filters = [
    {
      key: "search",
      type: "search",
      label: "Search",
      placeholder: "Search role name / code / description...",
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

  const fetchRoleDetails = async (roleId) => {
    try {
      setLoading(true);
      const res = await http.get(`/roles/${roleId}`);

      const perms = res?.data?.data?.permissions || [];

      // Build grantedMap: { [moduleId]: { [permissionId]: true } }
      const map = perms.reduce((acc, item) => {
        if (!item?.is_granted) return acc;
        const mid = item.module_id;
        const pid = item.permission_id;

        if (!acc[mid]) acc[mid] = {};
        acc[mid][pid] = true;
        return acc;
      }, {});

      setGrantedMap(map);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Failed to load role permissions",
      );
      setGrantedMap({});
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await http.get("/roles");
      setRoles(res?.data?.data || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchModulesAndPermissions = async () => {
    try {
      const [mRes, pRes] = await Promise.all([
        http.get("/modules"),
        http.get("/permissions"),
      ]);
      setModules(mRes?.data?.data || []);
      setPermissions(pRes?.data?.data || []);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Failed to fetch modules/permissions",
      );
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchModulesAndPermissions();
  }, []);

  const filteredRoles = useMemo(() => {
    const q = (filtersState.search || "").toLowerCase().trim();
    const status = filtersState.status;

    return roles.filter((r) => {
      const matchesQ =
        !q ||
        `${r.role_name || ""} ${r.role_code || ""} ${r.description || ""}`
          .toLowerCase()
          .includes(q);

      const isActive = r.is_active ?? true;
      const matchesStatus =
        status === "All" ||
        (status === "Active" && isActive) ||
        (status === "Inactive" && !isActive);

      return matchesQ && matchesStatus;
    });
  }, [roles, filtersState]);

  const validate = () => {
    const errs = {};
    if (!form.role_name?.trim()) errs.role_name = "Role name is required";
    if (!form.role_code?.trim()) errs.role_code = "Role code is required";

    if (form.role_code && !/^[A-Z0-9_]+$/.test(form.role_code)) {
      errs.role_code = "Use only A-Z, 0-9, underscore (e.g. INB_MNG)";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openCreate = () => {
    setMode("create");
    setActiveRole(null);
    setForm(emptyRole);
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (r) => {
    setMode("edit");
    setActiveRole(r);
    setForm({
      role_name: r.role_name || "",
      role_code: r.role_code || "",
      description: r.description || "",
      is_active: r.is_active ?? true,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const openAccess = async (r) => {
    setSelectedRole(r);
    await fetchRoleDetails(r.id);
    setShowAccessModal(true);
  };

  const submitForm = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const payload = {
        role_name: form.role_name.trim(),
        role_code: form.role_code.trim(),
        description: form.description?.trim() || "",
        ...(mode === "edit" ? { is_active: !!form.is_active } : {}),
      };

      if (mode === "create") {
        await http.post("/roles", payload);
      } else {
        const id = activeRole?.id || activeRole?._id;
        await http.put(`/roles/${id}`, payload);
      }

      toast.success(
        `Role ${mode === "create" ? "created" : "updated"} successfully.`,
      );
      setShowForm(false);
      await fetchRoles();
    } catch (e) {
      const data = e?.response?.data;
      toast.error(data?.message || "Failed to save role");

      if (Array.isArray(data?.errors)) {
        const mapped = data.errors.reduce((acc, item) => {
          if (item?.field && item?.message) acc[item.field] = item.message;
          return acc;
        }, {});
        setFormErrors((prev) => ({ ...prev, ...mapped }));
      }

      console.error("Save role error:", { status: e?.response?.status, data });
    } finally {
      setLoading(false);
    }
  };

  const askDelete = (r) => {
    setDeleteObj(r);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    const r = deleteObj;
    if (!r) return;

    const id = r?.id || r?._id;

    try {
      setLoading(true);
      await http.delete(`/roles/${id}`);
      toast.success("Role deleted successfully.");
      setShowDelete(false);
      setDeleteObj(null);

      // if deleted role was selected, reset
      if (selectedRole?.id === id) {
        setSelectedRole(null);
        setGrantedMap({});
      }

      await fetchRoles();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete role");
    } finally {
      setLoading(false);
    }
  };

  const roleColumns = useMemo(
    () => [
      { key: "role_name", title: "Role Name" },
      { key: "role_code", title: "Role Code" },
      {
        key: "description",
        title: "Description",
        render: (row) => row.description || "-",
      },
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
                    <>
                      <button
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700"
                        onClick={() => openAccess(row)}
                      >
                        Manage Access
                      </button>
                    </>
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
    [selectedRole],
  );

  const isGranted = (moduleId, permissionId) =>
    !!grantedMap?.[moduleId]?.[permissionId];

  const setGrantLocal = (moduleId, permissionId, val) => {
    setGrantedMap((prev) => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || {}),
        [permissionId]: val,
      },
    }));
  };

  const toggleGrant = async (moduleId, permissionId, nextVal) => {
    if (!selectedRole?.id) {
      toast.error("Select a role first.");
      return;
    }

    const roleId = selectedRole.id;

    // Optimistic UI
    setGrantLocal(moduleId, permissionId, nextVal);

    try {
      if (nextVal) {
        await http.post("/roles/permissions", {
          role_id: roleId,
          module_id: moduleId,
          permission_id: permissionId,
          is_granted: true,
        });
        toast.success("Permission granted.");
      } else {
        await http.delete("/roles/permissions", {
          data: {
            role_id: roleId,
            module_id: moduleId,
            permission_id: permissionId,
          },
        });
        toast.success("Permission removed.");
      }
    } catch (e) {
      // rollback
      setGrantLocal(moduleId, permissionId, !nextVal);
      toast.error(e?.response?.data?.message || "Failed to update permission");
      console.error("Toggle permission error:", e?.response?.data || e);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <div className="mb-4 flex items-center justify-end">
          {canCreate && (
            <button
              onClick={openCreate}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
            >
              + Add Role
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
            <CusTable columns={roleColumns} data={filteredRoles} />
          )}
        </div>
      </div>

      {/* RIGHT: Role Access Matrix */}
      {/* access control modal moved below, original inline panel removed */}

      {/* Role Create/Edit Modal */}
      {showForm && (
        <Modal
          title={mode === "create" ? "Add Role" : "Edit Role"}
          subtitle={
            mode === "create"
              ? "Create a new role (token required)."
              : "Update role details."
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
              label="Role Name"
              required
              value={form.role_name}
              error={formErrors.role_name}
              onChange={(v) => {
                setForm((p) => ({ ...p, role_name: v }));
                setFormErrors((e) => ({ ...e, role_name: "" }));
              }}
            />

            <Field
              label="Role Code"
              required
              value={form.role_code}
              error={formErrors.role_code}
              onChange={(v) => {
                const next = v.toUpperCase().replace(/\s+/g, "_");
                setForm((p) => ({ ...p, role_code: next }));
                setFormErrors((e) => ({ ...e, role_code: "" }));
              }}
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
                  id="role_active"
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, is_active: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="role_active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Access Control Modal */}
      {showAccessModal && selectedRole && (
        <Modal
          title="Role Access Control"
          subtitle={`Editing: ${selectedRole.role_name} (${selectedRole.role_code})`}
          onClose={() => {
            setShowAccessModal(false);
            setSelectedRole(null);
            setGrantedMap({});
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setShowAccessModal(false);
                  setSelectedRole(null);
                  setGrantedMap({});
                }}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
              >
                Close
              </button>
            </>
          }
        >
          {/* wrapper gives independent scrollbars */}
          <div className="p-5">
            <div className="overflow-auto max-h-[60vh]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                      Module
                    </th>
                    {permissions.map((p) => (
                      <th
                        key={p.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500"
                      >
                        {p.code}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {modules.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-gray-500">{m.code}</div>
                      </td>

                      {permissions.map((p) => {
                        const checked = isGranted(m.id, p.id);
                        return (
                          <td key={p.id} className="px-4 py-3">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  toggleGrant(m.id, p.id, e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-3 text-xs text-gray-500">
                Note: Current API set shared does not include “GET assigned
                permissions”. Once you share it, I’ll load the existing grants
                automatically.
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Role Modal */}
      <ConfirmDeleteModal
        open={showDelete}
        title="Delete Role"
        message={`Are you sure you want to delete "${deleteObj?.role_name || ""}"?`}
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

export default RolesTab;

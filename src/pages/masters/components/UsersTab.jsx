import React, { use, useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import FilterBar from "../../components/FilterBar";
import CusTable from "../../components/CusTable";
import http from "../../../api/http";
import { Field, Modal } from "./helper";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import { useToast } from "../../components/toast/ToastProvider";
import Pagination from "../../components/Pagination";
import { useAccess } from "../../utils/useAccess";
import { getUserRole } from "../../utils/authStorage";

const emptyUser = {
  username: "",
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone: "",
};

const UsersTab = () => {
  const toast = useToast();
  const [filtersState, setFiltersState] = useState({
    search: "",
    status: "All",
  });

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  // modal
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [activeUser, setActiveUser] = useState(null);
  const [form, setForm] = useState(emptyUser);

  // change password
  const [showPwd, setShowPwd] = useState(false);
  const [pwdUser, setPwdUser] = useState(null);
  const [pwdForm, setPwdForm] = useState({
    old_password: "",
    new_password: "",
  });

  const [showDelete, setShowDelete] = useState(false);
  const [deleteUserObj, setDeleteUserObj] = useState(null);
  const [pwdErrors, setPwdErrors] = useState({});
  const [errors, setErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // roles + assign modal
  const [showRoles, setShowRoles] = useState(false);
  const [rolesUser, setRolesUser] = useState(null);
  const [allRoles, setAllRoles] = useState([]);
  const [assignedRoleIds, setAssignedRoleIds] = useState([]);
  const [initialRoleIds, setInitialRoleIds] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 5,
  });

  const roleCode = getUserRole();
  const isAdmin = roleCode === "ADMIN";
  const access = useAccess("USER_MANAGEMENT");
  const canCreateUser = isAdmin || access.canCreate;
  const canUpdateUser = isAdmin || access.canUpdate;
  const canDeleteUser = isAdmin || access.canDelete;
  const showActionsColumn = canUpdateUser || canDeleteUser;

  const handlePageChange = (newPage) => {
    fetchUsers(newPage);
  };

  const filters = [
    {
      key: "search",
      type: "search",
      label: "Search",
      placeholder: "Search username / email / phone...",
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

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await http.get(
        `/users?page=${page}&limit=${pagination?.limit}`,
      );
      const list = res?.data?.data?.users || [];
      setUsers(list);
      setPagination(res?.data?.data?.pagination || pagination);
    } catch (e) {
      console.error(e?.response);
      toast.error(
        `${e?.response?.data?.message || e?.response?.data || "Failed to fetch users."}`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const onReset = () => setFiltersState({ search: "", status: "All" });
  const onApply = () => {}; // optional (FilterBar requires buttons)

  const filteredUsers = useMemo(() => {
    const q = (filtersState.search || "").toLowerCase().trim();
    const status = filtersState.status;

    return users.filter((u) => {
      const matchesQ =
        !q ||
        `${u.username || ""} ${u.email || ""} ${u.phone || ""}`
          .toLowerCase()
          .includes(q);

      const isActive = u.is_active ?? u.active ?? true;
      const matchesStatus =
        status === "All" ||
        (status === "Active" && isActive) ||
        (status === "Inactive" && !isActive);

      return matchesQ && matchesStatus;
    });
  }, [users, filtersState]);

  const openCreate = () => {
    setMode("create");
    setActiveUser(null);
    setForm(emptyUser);
    setShowForm(true);
  };

  const openEdit = (u) => {
    setMode("edit");
    setActiveUser(u);
    setForm({
      username: u.username || "",
      email: u.email || "",
      password: "",
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      phone: u.phone || "",
    });
    setShowForm(true);
  };

  const submitForm = async () => {
    if (mode === "create") {
      const errs = {};

      if (!form.password) {
        errs.password = "Password is required";
      } else if (form.password.length < 8) {
        errs.password = "Minimum 8 characters required";
      }

      if (Object.keys(errs).length > 0) {
        setFormErrors(errs);
        return;
      }
    }

    try {
      setLoading(true);

      if (mode === "create") {
        await http.post("/users", form);
      } else {
        const id = activeUser?.id || activeUser?._id;
        await http.put(`/users/${id}`, {
          username: form.username,
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
        });
      }
      toast.success(
        `User ${mode === "create" ? "created" : "updated"} successfully.`,
      );
      setShowForm(false);
      setFormErrors({});
      await fetchUsers();
    } catch (e) {
      console.log("RESPONSE:", e?.response);
      const data = e?.response?.data;
      if (!data) {
        toast.error("Network error. Please try again.");
        return;
      }
      toast.error(data.message || "Request failed");
      if (Array.isArray(data.errors)) {
        const fieldErrors = {};
        data.errors.forEach((err) => {
          fieldErrors[err.field] = err.message;
        });
        setFormErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = (u) => {
    setDeleteUserObj(u);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    const u = deleteUserObj;
    if (!u) return;

    const id = u?.id || u?._id;

    try {
      setLoading(true);
      await http.delete(`/users/${id}`);
      toast.success("User deleted successfully.");
      setShowDelete(false);
      setDeleteUserObj(null);
      await fetchUsers();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete user.");
    } finally {
      setLoading(false);
    }
  };

  const openChangePassword = (u) => {
    setPwdUser(u);
    setPwdForm({ old_password: "", new_password: "" });
    setShowPwd(true);
  };

  const submitPassword = async () => {
    if (!validatePasswordForm()) return;

    const id = pwdUser?.id || pwdUser?._id;
    try {
      setLoading(true);
      await http.put(`/users/${id}/password`, pwdForm);
      setShowPwd(false);
      setPwdErrors({});
      toast.success("Password changed successfully.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      { key: "username", title: "Username" },
      { key: "email", title: "Email" },
      {
        key: "name",
        title: "Name",
        render: (row) =>
          `${row.first_name || ""} ${row.last_name || ""}`.trim() || "-",
      },
      { key: "phone", title: "Phone" },
      {
        key: "status",
        title: "Status",
        render: (row) => {
          const isActive = row.is_active ?? row.active ?? true;
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
      // delete update both access not allowed then hide actions column
      ...(showActionsColumn
        ? [
            {
              key: "actions",
              title: "Actions",

              render: (row) => (
                <div className="flex items-center gap-2">
                  {canUpdateUser && (
                    <>
                      <button
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700"
                        onClick={() => openChangePassword(row)}
                      >
                        Password
                      </button>
                      <button
                        className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700"
                        onClick={() => openRolesModal(row)}
                      >
                        Roles
                      </button>
                    </>
                  )}
                  {canDeleteUser && (
                    <button
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white"
                      onClick={() => deleteUser(row)}
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

  const validatePasswordForm = () => {
    const errs = {};

    if (!pwdForm.old_password) {
      errs.old_password = "Old password is required";
    }

    if (!pwdForm.new_password) {
      errs.new_password = "New password is required";
    } else if (pwdForm.new_password.length < 8) {
      errs.new_password = "Minimum 8 characters required";
    }

    setPwdErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const fetchAllRoles = async () => {
    try {
      // If your backend already has /roles, this will work.
      // If your endpoint is different, replace this.
      const res = await http.get("/roles");
      const list = res?.data?.data?.roles || res?.data?.data || [];
      setAllRoles(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setAllRoles([]);
    }
  };

  const fetchUserRoles = async (userId) => {
    const res = await http.get(`/user-roles/user/${userId}`);
    const roles = res?.data?.data?.roles || [];
    return roles;
  };

  const openRolesModal = async (u) => {
    const id = u?.id || u?._id;
    if (!id) return;

    try {
      setLoading(true);
      setRolesUser(u);
      setShowRoles(true);

      // Load master roles (once)
      if (!allRoles.length) await fetchAllRoles();

      // Load assigned roles for this user
      const roles = await fetchUserRoles(id);
      const ids = roles.map((r) => r.id);

      setAssignedRoleIds(ids);
      setInitialRoleIds(ids);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load user roles.");
      setShowRoles(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (roleId) => {
    setAssignedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((x) => x !== roleId)
        : [...prev, roleId],
    );
  };

  const saveUserRoles = async () => {
    const u = rolesUser;
    const userId = u?.id || u?._id;
    if (!userId) return;

    const toRemove = initialRoleIds.filter(
      (id) => !assignedRoleIds.includes(id),
    );

    try {
      setLoading(true);

      // Add new roles (bulk)
      if (assignedRoleIds.length) {
        await http.post("/user-roles/bulk", {
          user_id: userId,
          role_ids: assignedRoleIds,
        });
      }

      // Remove unchecked roles (one-by-one delete)
      // if (toRemove.length) {
      //   await Promise.all(
      //     toRemove.map((rid) =>
      //       http.delete("/user-roles", {
      //         data: { user_id: userId, role_id: rid },
      //       }),
      //     ),
      //   );
      // }

      toast.success("Roles updated successfully.");
      setShowRoles(false);
      setRolesUser(null);
      setInitialRoleIds([]);
      setAssignedRoleIds([]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update roles.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        {canCreateUser && (
          <button
            onClick={openCreate}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
          >
            + Add User
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
          <>
            <CusTable columns={columns} data={filteredUsers} />
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {showForm && (
        <Modal
          title={mode === "create" ? "Add User" : "Edit User"}
          subtitle={
            mode === "create"
              ? "Create a new user (token required)."
              : "Update user details."
          }
          onClose={() => {
            setShowForm(false);
            setFormErrors({});
          }}
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
              label="Username"
              value={form.username}
              required
              error={formErrors.username}
              onChange={(v) => setForm((p) => ({ ...p, username: v }))}
            />
            <Field
              type="email"
              label="Email"
              required
              value={form.email}
              error={errors.email}
              onChange={(v) => {
                setForm((p) => ({ ...p, email: v }));
                setErrors((e) => ({ ...e, email: "" }));
              }}
            />
            <Field
              label="First Name"
              value={form.first_name}
              error={formErrors.first_name}
              onChange={(v) => setForm((p) => ({ ...p, first_name: v }))}
            />
            <Field
              label="Last Name"
              value={form.last_name}
              error={formErrors.last_name}
              onChange={(v) => setForm((p) => ({ ...p, last_name: v }))}
            />
            <Field
              label="Phone"
              required
              value={form.phone}
              error={errors.phone}
              onChange={(v) => {
                if (v.length > 10) return;
                if (!/^\d*$/.test(v)) return;

                setForm((p) => ({ ...p, phone: v }));
                setErrors((e) => ({ ...e, phone: "" }));
              }}
            />
            {mode === "create" && (
              <Field
                label="Password"
                type="password"
                required
                value={form.password}
                error={formErrors.password}
                onChange={(v) => {
                  setForm((p) => ({ ...p, password: v }));
                  setFormErrors((e) => ({ ...e, password: "" }));
                }}
              />
            )}
          </div>
        </Modal>
      )}

      {showRoles && (
        <Modal
          title="Assign Roles"
          subtitle={rolesUser?.username || ""}
          onClose={() => {
            if (loading) return;
            setShowRoles(false);
            setRolesUser(null);
            setAssignedRoleIds([]);
            setInitialRoleIds([]);
          }}
          footer={
            <>
              <button
                onClick={() => setShowRoles(false)}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={saveUserRoles}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                Save Roles
              </button>
            </>
          }
        >
          <div className="space-y-3">
            {!allRoles.length ? (
              <div className="text-sm text-gray-600">
                No roles found. (Check /roles API)
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {allRoles.map((r) => {
                  const checked = assignedRoleIds.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRole(r.id)}
                      className={[
                        "flex items-start gap-3 rounded-lg border px-3 py-2 text-left",
                        checked
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-200 bg-white",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border",
                          checked
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 bg-white",
                        ].join(" ")}
                      >
                        {checked ? <Check className="h-3.5 w-3.5" /> : null}
                      </span>

                      <span className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900">
                          {r.role_name || r.name || "Role"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {r.role_code || r.code || ""}
                        </div>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      {showPwd && (
        <Modal
          title="Change Password"
          subtitle={pwdUser?.username || ""}
          onClose={() => setShowPwd(false)}
          footer={
            <>
              <button
                onClick={() => setShowPwd(false)}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={submitPassword}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                Update Password
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <Field
              label="Old Password"
              type="password"
              required
              value={pwdForm.old_password}
              error={pwdErrors.old_password}
              onChange={(v) => {
                setPwdForm((p) => ({ ...p, old_password: v }));
                setPwdErrors((e) => ({ ...e, old_password: "" }));
              }}
            />

            <Field
              label="New Password"
              type="password"
              required
              value={pwdForm.new_password}
              error={pwdErrors.new_password}
              onChange={(v) => {
                setPwdForm((p) => ({ ...p, new_password: v }));
                setPwdErrors((e) => ({ ...e, new_password: "" }));
              }}
            />
          </div>
        </Modal>
      )}

      <ConfirmDeleteModal
        open={showDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteUserObj?.username || ""}"?`}
        loading={loading}
        onClose={() => {
          if (loading) return;
          setShowDelete(false);
          setDeleteUserObj(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default UsersTab;

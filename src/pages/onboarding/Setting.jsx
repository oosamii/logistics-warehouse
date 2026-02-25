import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Edit,
  Save,
} from "lucide-react";
import http from "../../api/http";
import toast from "react-hot-toast";
import { getUserRole } from "../utils/authStorage";
import { useAccess } from "../utils/useAccess";

const safeJsonParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const toDateInputValue = (isoOrDateLike) => {
  if (!isoOrDateLike) return "";
  const d = new Date(isoOrDateLike);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const formatNiceDateTime = (isoOrDateLike) => {
  if (!isoOrDateLike) return "—";
  const d = new Date(isoOrDateLike);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const Setting = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const roleCode = getUserRole();
  const isAdmin = roleCode === "ADMIN";
  const access = useAccess("USER_MANAGEMENT");
  const canCreate = isAdmin || access.canCreate;
  const canUpdate = isAdmin || access.canUpdate;
  const canDelete = isAdmin || access.canDelete;
  const showActionsColumn = canUpdate || canDelete;

  const sessionUser = useMemo(() => {
    const raw = sessionStorage.getItem("user");
    return safeJsonParse(raw, null);
  }, []);

  const initialUserData = useMemo(() => {
    const first = sessionUser?.first_name || "";
    const last = sessionUser?.last_name || "";
    const fullName = `${first} ${last}`.trim() || sessionUser?.username || "—";

    const roleName =
      sessionUser?.roles?.[0]?.role_name ||
      sessionUser?.roles?.[0]?.role_code ||
      "—";

    return {
      fullName,
      email: sessionUser?.email || "",
      phone: sessionUser?.phone || "",
      joinDate: toDateInputValue(sessionUser?.created_at), // date input needs YYYY-MM-DD
      lastUpdated: sessionUser?.updated_at || sessionUser?.created_at || null,
      roleName,
      department: "",
      employeeId: sessionUser?.id
        ? `EMP-${String(sessionUser.id).padStart(4, "0")}`
        : "",
      address: "",
      company: "Logistics Co.",
    };
  }, [sessionUser]);

  const [userData, setUserData] = useState(initialUserData);

  useEffect(() => {
    setUserData(initialUserData);
  }, [initialUserData]);

  const handleInputChange = (field, value) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!sessionUser?.id) return;

    setIsSaving(true);

    try {
      const nameParts = userData.fullName.trim().split(" ");
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || "";

      const payload = {
        username: sessionUser.username,
        email: userData.email,
        first_name,
        last_name,
        phone: userData.phone,
        is_active: sessionUser.is_active,
      };

      const res = await http.put(`/users/${sessionUser.id}`, payload);

      const updated = res?.data?.data;

      if (!updated) {
        throw new Error("Invalid response structure");
      }

      // 🔥 Merge updated fields into existing session user
      const mergedUser = {
        ...sessionUser, // keep everything (including roles)
        ...updated, // overwrite only changed fields
        roles: sessionUser.roles, // 👈 explicitly preserve roles
      };

      // Save back to session storage
      sessionStorage.setItem("user", JSON.stringify(mergedUser));

      // Update UI state
      setUserData((prev) => ({
        ...prev,
        fullName: `${mergedUser.first_name} ${mergedUser.last_name}`.trim(),
        email: mergedUser.email,
        phone: mergedUser.phone,
        lastUpdated: mergedUser.updated_at,
      }));

      setIsEditing(false);

      toast.success("Profile updated successfully 🚀");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Update failed",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUserData(initialUserData);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Profile"
        subtitle="Manage your account information"
        actions={
          <>
            {canUpdate && (
              <button
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
                  isEditing
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isEditing ? <Save size={16} /> : <Edit size={16} />}
                {isEditing ? "Save Changes" : "Edit Profile"}
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {!isEditing && (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-300">
                  <User size={64} className="text-blue-600" />
                </div>

                <h2 className="mb-2 text-xl font-bold text-gray-900">
                  {userData.fullName}
                </h2>
                <p className="mb-4 text-gray-600">{userData.roleName}</p>

                <div className="grid w-full grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-sm text-gray-600">Employee ID</p>
                    <p className="font-semibold">{userData.employeeId}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-semibold">{userData.department}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Contact Information
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{userData.email || ""}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{userData.phone || ""}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{userData.address || ""}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Joined</p>
                    <p className="font-medium">
                      {userData.joinDate ? userData.joinDate : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className={isEditing ? "lg:col-span-3" : "lg:col-span-2"}>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-6 text-lg font-semibold text-gray-900">
              {isEditing ? "Edit Profile Information" : "Profile Information"}
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={userData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    {userData.fullName}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    {userData.email || "—"}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={userData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    {userData.phone || "—"}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Position
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={userData.roleName}
                    onChange={(e) =>
                      handleInputChange("roleName", e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    {userData.roleName}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Department
                </label>
                {isEditing ? (
                  <select
                    value={userData.department}
                    onChange={(e) =>
                      handleInputChange("department", e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>—</option>
                    <option>Operations</option>
                    <option>Warehouse</option>
                    <option>Shipping</option>
                    <option>Finance</option>
                    <option>Management</option>
                  </select>
                ) : (
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    {userData.department}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Employee ID
                </label>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  {userData.employeeId}
                </div>
              </div>

              {/* Join Date */}
              {/* <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Join Date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={userData.joinDate}
                    onChange={(e) =>
                      handleInputChange("joinDate", e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    {userData.joinDate || "—"}
                  </div>
                )}
              </div> */}

              {/* Address */}
              {/* <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Address
                </label>
                {isEditing ? (
                  <textarea
                    value={userData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    {userData.address || "—"}
                  </div>
                )}
              </div> */}
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {!isEditing && (
            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Additional Information
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <Building size={20} className="mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-semibold">{userData.company}</p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <User size={20} className="mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-semibold">{userData.roleName}</p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <Calendar size={20} className="mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-semibold">
                    {formatNiceDateTime(userData.lastUpdated)}
                  </p>
                </div>
              </div>
            </div>
          )}
          {!sessionUser && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Session user not found in storage. Please log in again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setting;

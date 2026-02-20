import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../utils/AuthProvider";
import { hasPermission } from "../utils/permissions";
import { PermissionButton } from "../utils/useAccess";

import UsersTab from "./components/UsersTab";
import ModulesTab from "./components/ModulesTab";
import PermissionsTab from "./components/PermissionsTab";
import RolesTab from "./components/RolesTab";
import SKUsTab from "./components/SKUsTab";
import LocationsBinsTab from "./components/LocationsBinsTab";
import ClientsTab from "./components/ClientsTab";
import SlottingRulesTab from "./components/SlottingRulesTab";
import WarehouseTab from "./components/WarehouseTab";
import SupplierTab from "./components/SupplierTab";
import DockTab from "./components/DockTab";
import { getUserRole } from "../utils/authStorage";
import CarrierTab from "./components/CarrierTab";

const TAB_CONFIG = [
  { key: "Users", module: "USER_MANAGEMENT", Component: UsersTab },
  { key: "Modules", module: "MODULES", Component: ModulesTab },
  { key: "Permissions", module: "PERMISSIONS", Component: PermissionsTab },
  { key: "Roles", module: "ROLES", Component: RolesTab },
  { key: "SKUs", module: "SKUS", Component: SKUsTab },
  { key: "Locations & Bins", module: "LOCATIONS", Component: LocationsBinsTab },
  { key: "Clients", module: "CLIENTS", Component: ClientsTab },
  {
    key: "Slotting Rules",
    module: "SLOTTINGRULES",
    Component: SlottingRulesTab,
  },
  { key: "Warehouses", module: "WAREHOUSE", Component: WarehouseTab },
  { key: "Suppliers", module: "SUPPLIERS", Component: SupplierTab },
  { key: "Docks", module: "DOCKS", Component: DockTab },
  { key: "Carriers", module: "CARRIERS", Component: CarrierTab },
];

const Masters = () => {
  const { perms, loadingPerms } = useAuth();
  const [activeTab, setActiveTab] = useState(null);
  const roleCode = getUserRole();
  const isAdmin = roleCode === "ADMIN";

  const visibleTabs = useMemo(() => {
    if (isAdmin) return TAB_CONFIG;
    if (!perms) return [];
    return TAB_CONFIG.filter((t) => hasPermission(perms, t.module, "READ"));
  }, [isAdmin, perms]);

  useEffect(() => {
    if (loadingPerms) return;

    if (!activeTab && visibleTabs.length) {
      setActiveTab(visibleTabs[0].key);
      return;
    }
    if (activeTab && visibleTabs.length) {
      const stillAllowed = visibleTabs.some((t) => t.key === activeTab);
      if (!stillAllowed) setActiveTab(visibleTabs[0].key);
    }
  }, [loadingPerms, visibleTabs, activeTab]);

  if (loadingPerms) {
    return <div className="p-6 text-sm text-gray-600">Loading...</div>;
  }

  if (!visibleTabs.length) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900">Unauthorized</h2>
        <p className="mt-1 text-sm text-gray-600">
          You don’t have access to any Masters section.
        </p>
      </div>
    );
  }

  const active = visibleTabs.find((t) => t.key === activeTab) || visibleTabs[0];
  const ActiveComponent = active.Component;

  const canImport = hasPermission(perms, active.module, "CREATE");
  const canExport = hasPermission(perms, active.module, "EXPORT");

  return (
    <div>
      <PageHeader
        title="WMS Masters"
        subtitle="Configure master data and access control rules"
        actions={
          <div className="flex gap-2">
            {canImport && (
              <PermissionButton
                module={active.module}
                perm="CREATE"
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
              >
                Import
              </PermissionButton>
            )}
            {canExport && (
              <PermissionButton
                module={active.module}
                perm="EXPORT"
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
              >
                Export
              </PermissionButton>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex flex-wrap gap-4">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={[
                "px-3 py-2 text-sm font-medium border-b-2 -mb-px",
                activeTab === t.key
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-gray-900",
              ].join(" ")}
            >
              {t.key}
            </button>
          ))}
        </div>
      </div>

      <ActiveComponent />
    </div>
  );
};

export default Masters;

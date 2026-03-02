import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import { useAuth } from "../utils/AuthProvider";
import { hasPermission } from "../utils/permissions";
import { PermissionButton } from "../utils/useAccess";
import { getUserRole } from "../utils/authStorage";

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
import CarrierTab from "./components/CarrierTab";

const TAB_CONFIG = [
  {
    key: "Users",
    slug: "users",
    module: "USER_MANAGEMENT",
    Component: UsersTab,
  },
  { key: "Modules", slug: "modules", module: "MODULES", Component: ModulesTab },
  {
    key: "Permissions",
    slug: "permissions",
    module: "PERMISSIONS",
    Component: PermissionsTab,
  },
  { key: "Roles", slug: "roles", module: "ROLES", Component: RolesTab },
  { key: "SKUs", slug: "skus", module: "SKUS", Component: SKUsTab },
  {
    key: "Locations & Bins",
    slug: "locations-bins",
    module: "LOCATIONS",
    Component: LocationsBinsTab,
  },
  { key: "Clients", slug: "clients", module: "CLIENTS", Component: ClientsTab },
  {
    key: "Slotting Rules",
    slug: "slotting-rules",
    module: "SLOTTINGRULES",
    Component: SlottingRulesTab,
  },
  {
    key: "Warehouses",
    slug: "warehouses",
    module: "WAREHOUSE",
    Component: WarehouseTab,
  },
  {
    key: "Suppliers",
    slug: "suppliers",
    module: "SUPPLIERS",
    Component: SupplierTab,
  },
  { key: "Docks", slug: "docks", module: "DOCKS", Component: DockTab },
  {
    key: "Carriers",
    slug: "carriers",
    module: "CARRIERS",
    Component: CarrierTab,
  },
];

const Masters = () => {
  const { perms, loadingPerms } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const roleCode = getUserRole();
  const isAdmin = roleCode === "ADMIN";

  const visibleTabs = useMemo(() => {
    if (isAdmin) return TAB_CONFIG;
    if (!perms) return [];
    return TAB_CONFIG.filter((t) => hasPermission(perms, t.module, "READ"));
  }, [isAdmin, perms]);

  // helper: read tab from url
  const urlTabSlug = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return (sp.get("tab") || "").toLowerCase();
  }, [location.search]);

  const [activeSlug, setActiveSlug] = useState(null);

  // Sync state FROM url + permissions
  useEffect(() => {
    if (loadingPerms) return;
    if (!visibleTabs.length) return;

    const requested = visibleTabs.find((t) => t.slug === urlTabSlug);
    const fallback = visibleTabs[0];

    const next = (requested || fallback).slug;

    // keep internal state
    setActiveSlug(next);

    // if url missing/invalid, fix url (replace to avoid history spam)
    if (!requested && urlTabSlug !== next) {
      navigate(`/masters?tab=${next}`, { replace: true });
    }
  }, [loadingPerms, visibleTabs, urlTabSlug, navigate]);

  if (loadingPerms)
    return <div className="p-6 text-sm text-gray-600">Loading...</div>;

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

  const active =
    visibleTabs.find((t) => t.slug === activeSlug) ||
    visibleTabs.find((t) => t.slug === urlTabSlug) ||
    visibleTabs[0];

  const ActiveComponent = active.Component;

  const canImport = hasPermission(perms, active.module, "CREATE");
  const canExport = hasPermission(perms, active.module, "EXPORT");

  const onTabClick = (t) => {
    setActiveSlug(t.slug);
    navigate(`/masters?tab=${t.slug}`);
  };

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
              key={t.slug}
              onClick={() => onTabClick(t)}
              className={[
                "px-3 py-2 text-sm font-medium border-b-2 -mb-px",
                active?.slug === t.slug
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

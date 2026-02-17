import Dashboard from "../dashboard/Dashboard";
import Putaway from "../putaway/Putaway";
import PutawayDetails from "../putaway/PutawayDetails";
import CreateASN from "../inbound/CreateASN";
import InboundASN from "../inbound/InboundASN";
import AsnDetail from "../inbound/AsnDetail";
import AsnReceiving from "../inbound/AsnReceiving";
import Inventory from "../inventory/Inventory";
import { useRoutes, Navigate } from "react-router-dom";
import Picking from "../picking/Picking";
import PickWaves from "../picking/PickWaves";
import PickTasks from "../picking/PickTasks";
import PickTaskDetail from "../picking/PickTaskDetail";
import PickExceptions from "../picking/PickExceptions";
import Packing from "../packing/Packing";
import Shipping from "../shipping/Shipping";
import ShipmentDetail from "../shipping/ShipmentDetail";
import Masters from "../masters/Masters";
import OutboundOrders from "../outbound/OutboundOrders";
import OrderDetail from "../outbound/OrderDetail";
import CreateSalesOrder from "../outbound/CreateSalesOrder";
import Reports from "../reports/Reports";
import InboundTAT from "../reports/InboundTAT";
import PutawayAging from "../reports/PutawayAging";
import InventoryAccuracy from "../reports/InventoryAccuracy";
import SpaceUtilization from "../reports/SpaceUtilization";
import PickProductivity from "../reports/PickProductivity";
import PackProductivity from "../reports/PackProductivity";
import OutboundSLA from "../reports/OutboundSLA";
import BillingRevenue from "../reports/BillingRevenue";
import Billing from "../billing/Billing";
import Setting from "../onboarding/Setting";
import { RequirePermission, RequireAuth } from "../utils/auth/RequireAuth";
import { ROUTE_PERMS } from "./routePerms";
import Unauthorized from "../unauthorized/Unauthorized";
import StockBySkuTab from "../inventory/components/tabs/stockBySku/StockBySkuTab";
import SkuDetailPage from "../inventory/components/SkuDetailPage";
import PickWaveDetails from "../picking/PickWaveDetails";
import CreatePickWavePage from "../picking/components/CreatePickWavePage";

const protect = (path, element) => {
  const rule = ROUTE_PERMS[path];
  if (!rule) {
    console.warn("[ROUTE_PERMS MISSING]", path);
    return <RequireAuth>{element}</RequireAuth>;
  }

  return (
    <RequireAuth>
      <RequirePermission moduleCode={rule.module} permCode={rule.perm}>
        {element}
      </RequirePermission>
    </RequireAuth>
  );
};

const NewRoutes = [
  {
    path: "/unauthorized",
    element: (
      <RequireAuth>
        <Unauthorized />
      </RequireAuth>
    ),
  },
  { path: "/dashboard", element: protect("/dashboard", <Dashboard />) },
  { path: "/", element: <Navigate to="/inventory" replace /> },

  {
    path: "/putaway",
    element: protect("/putaway", <Putaway />),
  },
  {
    path: "/putawaydetails/:id", // Add :id parameter here
    element: protect("/putawaydetails/:id", <PutawayDetails />),
  },

  { path: "/inbound", element: protect("/inbound", <InboundASN />) },
  { path: "/createASN/:id", element: protect("/createASN/:id", <CreateASN />) },
  {
    path: "/ASNdetails/:id",
    element: protect("/ASNdetails/:id", <AsnDetail />),
  },
  {
    path: "/ASNreceive/:id",
    element: protect("/ASNreceive/:id", <AsnReceiving />),
  },

  { path: "/outbound", element: protect("/outbound", <OutboundOrders />) },
  {
    path: "/orderDetails/:id",
    element: protect("/orderDetails/:id", <OrderDetail />),
  },
  {
    path: "/outbound/saleOrderCreate/:id",
    element: protect("/outbound/saleOrderCreate/:id", <CreateSalesOrder />),
  },

  { path: "/masters", element: protect("/masters", <Masters />) },

  { path: "/reports", element: protect("/reports", <Reports />) },
  { path: "/inboundTAT", element: protect("/inboundTAT", <InboundTAT />) },
  {
    path: "/putawayAging",
    element: protect("/putawayAging", <PutawayAging />),
  },
  {
    path: "/inventoryAccuracy",
    element: protect("/inventoryAccuracy", <InventoryAccuracy />),
  },
  {
    path: "/spaceUtilization",
    element: protect("/spaceUtilization", <SpaceUtilization />),
  },
  {
    path: "/pickProductivity",
    element: protect("/pickProductivity", <PickProductivity />),
  },
  {
    path: "/packProductivity",
    element: protect("/packProductivity", <PackProductivity />),
  },
  { path: "/outboundSLA", element: protect("/outboundSLA", <OutboundSLA />) },
  {
    path: "/billingRevenue",
    element: protect("/billingRevenue", <BillingRevenue />),
  },

  {
    path: "/inventory",
    element: protect("/inventory", <Inventory />),
    children: [{ index: true, element: <StockBySkuTab /> }],
  },

  { path: "/picking", element: protect("/picking", <Picking />) },
  {
    path: "/picking/tasks/:taskId",
    element: protect("/picking/tasks/:taskId", <PickTaskDetail />),
  },
  {
    path: "/picking/createPickWavePage",
    element: protect("/picking/createPickWavePage", <CreatePickWavePage />),
  },
  { path: "/packing", element: protect("/packing", <Packing />) },
  { path: "/shipping", element: protect("/shipping", <Shipping />) },
  {
    path: "/shippingdetails",
    element: protect("/shippingdetails", <ShipmentDetail />),
  },

  { path: "/billing", element: protect("/billing", <Billing />) },
  { path: "/setting", element: protect("/setting", <Setting />) },
  {
    path: "/inventory/sku/:skuId",
    element: protect("/inventory/sku/:skuId", <SkuDetailPage />),
  },
  {
    path: "/picking/waves/:waveId",
    element: protect("/picking/waves/:waveId", <PickWaveDetails />),
  },
];

export default NewRoutes;

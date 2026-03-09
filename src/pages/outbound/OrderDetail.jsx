// OrderDetail.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Printer, Pencil } from "lucide-react";
import { useParams } from "react-router-dom";
import Breadcrumbs from "../components/header/Breadcrumbs";
import PageHeader from "../components/PageHeader";
import SideNav from "./components/detailpagetabs/SideNav";
import OrderSummaryBar from "./components/detailpagetabs/OrderSummaryBar";
import OverviewTab from "./components/detailpagetabs/OverviewTab";
import LinesTab from "./components/detailpagetabs/LinesTab";
import AllocationTab from "./components/detailpagetabs/AllocationTab";
import EmptyState from "./components/detailpagetabs/EmptyState";
import PickingTab from "./components/detailpagetabs/PickingTab";
import PackingTab from "./components/detailpagetabs/PackingTab";
import ShippingTab from "./components/detailpagetabs/ShippingTab";
import BillingTab from "./components/detailpagetabs/BillingTab";
import DocumentsTab from "./components/detailpagetabs/DocumentsTab";
import AuditTab from "./components/detailpagetabs/AuditTab";
import { useToast } from "../components/toast/ToastProvider";
import http from "@/api/http";

const OrderDetail = () => {
  const { id } = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch order data
  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const res = await http.get(`/sales-orders/${id}`);
      setOrder(res.data);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast?.error?.("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusTone = (status) => {
    switch (status) {
      case "DRAFT":
        return "gray";
      case "CONFIRMED":
        return "blue";
      case "ALLOCATED":
        return "green";
      case "PICKING":
        return "orange";
      case "PICKED":
        return "yellow";
      case "PACKING":
        return "purple";
      case "PACKED":
        return "purple";
      case "SHIPPED":
        return "green";
      case "DELIVERED":
        return "green";
      case "CANCELLED":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status) => {
    const map = {
      DRAFT: "Draft",
      CONFIRMED: "Confirmed",
      ALLOCATED: "Allocated",
      PICKING: "Picking",
      PICKED: "Picked",
      PACKING: "Packing",
      PACKED: "Packed",
      SHIPPED: "Shipped",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
    };
    return map[status] || status;
  };

  const getPriorityTone = (priority) => {
    switch (priority) {
      case "HIGH":
        return "red";
      case "MEDIUM":
        return "orange";
      case "NORMAL":
        return "blue";
      default:
        return "gray";
    }
  };

  // Format order data for summary bar
  const orderSummary = useMemo(() => {
    if (!order) return null;

    return {
      orderNo: order.order_no,
      status: getStatusLabel(order.status),
      statusTone: getStatusTone(order.status),
      allocationBadge: `${order.allocation_status} Allocation`,
      allocationTone:
        order.allocation_status === "FULL"
          ? "green"
          : order.allocation_status === "PARTIAL"
            ? "orange"
            : "red",
      priorityBadge: `${order.priority} Priority`,
      priorityTone: getPriorityTone(order.priority),
      client: order.client?.client_name || order.customer_name,
      shipTo: `${order.ship_to_name}, ${order.ship_to_city}`,
      slaDue: order.sla_due_date
        ? new Date(order.sla_due_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Not set",
      lines: order.total_lines || 0,
      units: parseFloat(order.total_ordered_units || 0).toFixed(0),
    };
  }, [order]);

  // Navigation items with counts
  const navItems = useMemo(() => {
    if (!order) return [];

    const allocationCount =
      order.lines?.filter((l) => parseFloat(l.allocated_qty || 0) > 0).length ||
      0;

    const pickedCount = parseFloat(order.total_picked_units || 0) > 0 ? 1 : 0;
    const packedCount = parseFloat(order.total_packed_units || 0) > 0 ? 1 : 0;
    const shippingCount = order.tracking_number ? 1 : 0;
    const billingCount = order.invoice_no ? 1 : 0;

    return [
      { key: "overview", label: "Overview", count: 0 },
      { key: "lines", label: "Lines", count: order.total_lines || 0 },
      { key: "allocation", label: "Allocation", count: allocationCount },
      { key: "picking", label: "Picking", count: pickedCount },
      { key: "packing", label: "Packing", count: packedCount },
      { key: "shipping", label: "Shipping", count: shippingCount },
      { key: "billing", label: "Billing", count: billingCount },
      { key: "documents", label: "Documents", count: 0 },
      { key: "audit", label: "Audit", count: 0 },
    ];
  }, [order]);

  if (loading) {
    return (
      <div className="max-w-full">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <div className="text-gray-500">Loading order details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-full">
        <div className="mb-3">
          <Breadcrumbs
            items={[
              { label: "Outbound", to: "/outbound" },
              { label: "Order Not Found" },
            ]}
          />
        </div>
        <EmptyState
          title="Order Not Found"
          message="The order you're looking for doesn't exist or has been deleted."
          actionText="Back to Orders"
          actionLink="/outbound"
        />
      </div>
    );
  }

  const handleAllocate = async () => {
    try {
      const res = await http.post(`/sales-orders/${id}/allocate`);
      if (res.data?.success) {
        toast.success("Order allocated successfully");
        fetchOrderDetail();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to allocate order");
    }
  };

  const handleStartPicking = async () => {
    try {
      const res = await http.post(`/pick-tasks/${id}/start`);
      if (res.data?.success) {
        toast.success("Picking started");
        fetchOrderDetail();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start picking");
    }
  };

  return (
    <div className="max-w-full">
      <div className="mb-3">
        <Breadcrumbs
          items={[
            { label: "Outbound", to: "/outbound" },
            { label: `Order ${order.order_no}` },
          ]}
        />
      </div>

      <PageHeader
        title={`Order ${order.order_no}`}
        subtitle={`${order.client?.client_name || "Client"} • ${order.order_date ? new Date(order.order_date).toLocaleDateString() : ""}`}
        actions={
          <>
            {/* <button className="px-4 py-2 border rounded-md text-sm bg-white inline-flex items-center gap-2">
              <Printer size={16} />
              Print
            </button> */}
            {/* <button className="px-4 py-2 border rounded-md text-sm bg-white inline-flex items-center gap-2">
              <Pencil size={16} />
              Edit Order
            </button> */}
            {/* {order.status === "CONFIRMED" && (
              <button
                onClick={handleAllocate}
                className="px-4 py-2 rounded-md text-sm bg-blue-600 text-white"
              >
                Allocate
              </button>
            )} */}
            {/* {order.status === "ALLOCATED" && (
              <button
                onClick={handleStartPicking}
                className="px-4 py-2 rounded-md text-sm bg-green-600 text-white"
              >
                Start Picking
              </button>
            )} */}
          </>
        }
      />

      <div className="mt-4 space-y-4">
        {orderSummary && <OrderSummaryBar order={orderSummary} />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <SideNav
              active={activeTab}
              onChange={setActiveTab}
              items={navItems}
            />
          </div>

          <div className="lg:col-span-9">
            {activeTab === "overview" && (
              <OverviewTab
                order={order}
                onEditShipTo={() => console.log("edit ship-to")}
                onEditShipping={() => console.log("edit shipping")}
              />
            )}

            {activeTab === "lines" && <LinesTab lines={order.lines || []} />}

            {activeTab === "allocation" && (
              <AllocationTab
                allocations={order.lines?.flatMap((l) => l.allocations) || []}
              />
            )}

            {activeTab === "picking" && (
              <PickingTab
                order={order}
                onReassignPickers={() => console.log("reassign pickers")}
                onCreatePickWave={() => console.log("create pick wave")}
                onViewAllTasks={() => console.log("view all pick tasks")}
              />
            )}

            {activeTab === "packing" && (
              <PackingTab
                order={order}
                onPrintPackingSlip={() => console.log("print packing slip")}
                onStartPacking={() => console.log("start packing")}
              />
            )}

            {activeTab === "shipping" && (
              <ShippingTab
                order={order}
                onGenerateAwb={() => console.log("generate awb")}
                onDispatchShipment={() => console.log("dispatch shipment")}
                onPodUpload={(file) => console.log("pod uploaded", file)}
              />
            )}

            {activeTab === "billing" && (
              <BillingTab
                order={order}
                onMarkReady={() => console.log("mark ready")}
                onCreateInvoice={() => console.log("create invoice")}
                onViewInvoice={() => console.log("view invoice")}
              />
            )}

            {activeTab === "documents" && (
              <DocumentsTab
                orderId={order.id}
                onDownloadAll={() => console.log("download all")}
                onUpload={() => console.log("upload document")}
                onView={(row) => console.log("view", row)}
                onDownload={(row) => console.log("download", row)}
                onDelete={(row) => console.log("delete", row)}
              />
            )}

            {activeTab === "audit" && <AuditTab order={order} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

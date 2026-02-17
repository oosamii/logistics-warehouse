// CreateSalesOrder.jsx

// routes
// /sales-orders/new
// /sales-orders/:id

import { useEffect, useMemo, useRef, useState } from "react";
import FormPage from "../components/forms/FormPage";
import FormCard from "../components/forms/FormCard";
import FormGrid from "../components/forms/FormGrid";
import { InputField } from "../components/forms/Field";
import SummaryCard from "../components/forms/SummaryCard";
import ChecklistCard from "../components/forms/ChecklistCard";
import AttachmentsDropzone from "../components/forms/AttachmentsDropzone";
import OrderLines from "./components/OrderLines";
import { useNavigate, useParams } from "react-router-dom";
import http from "@/api/http.js";
import { validateSalesOrder } from "./components/helper";
import { useToast } from "../components/toast/ToastProvider";
import BasicInformationSection from "../inbound/components/asnform/BasicInformationSection";
import ShipToCustomer from "./components/ShipToCustomer";

const Switch = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange?.(!checked)}
    className={[
      "relative inline-flex h-6 w-11 items-center rounded-full transition",
      checked ? "bg-blue-600" : "bg-gray-200",
    ].join(" ")}
    aria-pressed={checked}
  >
    <span
      className={[
        "inline-block h-5 w-5 transform rounded-full bg-white transition",
        checked ? "translate-x-5" : "translate-x-1",
      ].join(" ")}
    />
  </button>
);

const ToggleRow = ({ title, desc, checked, onChange, disabled }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      {desc && <div className="text-xs text-gray-500 mt-0.5">{desc}</div>}
    </div>
    <div className={disabled ? "opacity-40 pointer-events-none" : ""}>
      <Switch checked={checked} onChange={onChange} />
    </div>
  </div>
);

const CreateSalesOrder = () => {
  const { id } = useParams();
  const isEdit = id !== "new";
  const toast = useToast();
  const navigate = useNavigate();

  const [header, setHeader] = useState({
    warehouse_id: null,
    warehouse_name: "",
    client_id: null,
    client_name: "",
    orderRef: "",
    priority: "NORMAL",
    orderType: "STANDARD",
    slaDueDate: "",
  });
  const [shipTo, setShipTo] = useState({
    name: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    instructions: "",
  });
  const [shipping, setShipping] = useState({
    carrier: "",
    serviceLevel: "",
    packagingPreference: "",
    codAmount: "",
    awbTracking: "",
  });
  const [alloc, setAlloc] = useState({
    autoAllocateOnConfirm: true,
    allowPartial: true,
    reserveInventory: true,
    allowSubstituteSku: false,
  });
  const [lines, setLines] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const basicInfoRef = useRef(null);
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const hydrateForm = (data) => {
    // HEADER
    setHeader({
      warehouse_id: data.warehouse_id || null,
      warehouse_name: data.warehouse?.warehouse_name || "",
      client_id: data.client_id || null,
      client_name: data.client?.client_name || "",
      orderRef: data.reference_no || "",
      priority: data.priority || "NORMAL",
      orderType: data.order_type || "STANDARD",
      slaDueDate: data.sla_due_date ? data.sla_due_date.split("T")[0] : "",
      notes: data.notes || "",
    });

    // SHIP TO
    setShipTo({
      name: data.ship_to_name || data.customer_name || "",
      phone: data.ship_to_phone || data.customer_phone || "",
      email: data.customer_email || "",
      address1: data.ship_to_address_line1 || "",
      address2: data.ship_to_address_line2 || "",
      city: data.ship_to_city || "",
      state: data.ship_to_state || "",
      pincode: data.ship_to_pincode || "",
      gstin: data.gstin || "",
      instructions: data.special_instructions || "",
    });

    // SHIPPING
    setShipping({
      carrier: data.carrier || "",
      serviceLevel: data.carrier_service || "",
      packagingPreference: data.packaging_preference || "",
      codAmount: data.cod_amount || "",
      awbTracking: data.tracking_number || "",
    });

    setLines(
      data.lines?.map((l) => ({
        id: l.id,
        sku_id: l.sku_id,
        sku: l.sku?.sku_code || "",
        name: l.sku?.sku_name || "",
        ordered_qty: Number(l.ordered_qty),
        uom: l.uom || "EA",
        allocation_rule: l.allocation_rule,
        batch_preference: l.batch_preference,
        expiry_date_min: l.expiry_date_min,
        unit_price: Number(l.unit_price),
        discount_percent: Number(l.discount_percent),
        discount_amount: Number(l.discount_amount),
        tax_percent: Number(l.tax_percent),
        tax_amount: Number(l.tax_amount),
        note: l.notes || "",
        allocations: l.allocations || [],
      })) || [],
    );

    // STATUS
    setStatus(data.status || "DRAFT");
  };

  useEffect(() => {
    if (!isEdit) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data } = await http.get(`/sales-orders/${id}`);
        hydrateForm(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load sales order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, isEdit]);

  const setH = (k, v) => setHeader((p) => ({ ...p, [k]: v }));
  const setS = (k, v) => setShipTo((p) => ({ ...p, [k]: v }));
  const setSh = (k, v) => setShipping((p) => ({ ...p, [k]: v }));

  const totals = useMemo(() => {
    const totalLines = (lines || []).filter((l) => l.sku || l.uom).length;
    const totalUnits = lines.reduce(
      (s, l) => s + (Number(l.ordered_qty) || 0),
      0,
    );
    return { totalLines, totalUnits };
  }, [lines]);

  const readiness = useMemo(() => {
    const basicData = basicInfoRef.current?.getData?.();

    const okWarehouse = !!basicData?.warehouse_id;
    const okClient = !!basicData?.client_id;

    const okShipTo = !!shipTo.name && !!shipTo.phone && !!shipTo.address1;
    const okLines = totals?.totalLines > 0 && totals?.totalUnits > 0;

    return [
      { label: "Warehouse Selected", done: okWarehouse },
      { label: "Client Selected", done: okClient },
      { label: "Ship-to Filled", done: okShipTo },
      { label: "Lines Added", done: okLines },
    ];
  }, [header, shipTo, totals]);

  const summaryData = useMemo(
    () => ({
      asnNumber: "Generated on save", // reuse SummaryCard, label stays
      supplier: header.client_id || "-",
      expectedArrival: shipTo.name || "-",
      lines: totals.totalLines,
      units: totals.totalUnits,
    }),
    [header, shipTo, totals],
  );

  const addLine = () =>
    setLines((p) => [
      ...p,
      {
        id: String(Date.now()),
        sku: "",
        name: "",
        uom: "Each",
        qty: 0,
        allocationRule: "FIFO",
        note: "",
      },
    ]);

  const buildPayload = () => ({
    warehouse_id: header.warehouse_id,
    client_id: header.client_id,

    customer_name: shipTo.name,
    customer_phone: shipTo.phone,
    customer_email: shipTo.email || null,

    ship_to_name: shipTo.name,
    ship_to_address_line1: shipTo.address1,
    ship_to_address_line2: shipTo.address2 || null,
    ship_to_city: shipTo.city,
    ship_to_state: shipTo.state,
    ship_to_country: "India",
    ship_to_pincode: String(shipTo.pincode),
    ship_to_phone: shipTo.phone,

    order_type: header.orderType,
    priority: header.priority,
    sla_due_date: header.slaDueDate ? header.slaDueDate.split("T")[0] : null,

    carrier: shipping.carrier || null,
    carrier_service: shipping.serviceLevel || null,

    reference_no: header.orderRef || null,
    special_instructions: shipTo.instructions || null,
    notes: header.notes || null,

    payment_mode: Number(shipping.codAmount) > 0 ? "COD" : "PREPAID",
    cod_amount: Number(shipping.codAmount) || 0,

    lines: lines
      .filter((l) => l.sku_id && Number(l.ordered_qty) > 0)
      .map((l) => ({
        sku_id: l.sku_id,
        ordered_qty: Number(l.ordered_qty),
        uom: l.uom || "EA",
        allocation_rule: l.allocation_rule || "FIFO",
        batch_preference: l.batch_preference || null,
        expiry_date_min: l.expiry_date_min || null,
        unit_price: Number(l.unit_price) || 0,
        discount_percent: Number(l.discount_percent) || 0,
        discount_amount: Number(l.discount_amount) || 0,
        tax_percent: Number(l.tax_percent) || 0,
        tax_amount: Number(l.tax_amount) || 0,
        notes: l.note || l.notes || null,
      })),

    attachments: attachments.map((f) => ({
      url: f.url,
      name: f.name,
      type: f.type,
    })),
  });

  const onSaveDraft = async () => {
    if (isLocked) return toast.error("Order is locked");

    const basicErrors = basicInfoRef.current?.validate("draft") || [];

    if (basicErrors.length) {
      basicErrors.forEach((e) => toast.error(e));
      return;
    }

    const { isValid, errors } = validateSalesOrder(header, shipTo, lines);
    if (!isValid) {
      Object.values(errors).forEach((e) => toast.error(e));
      return;
    }

    const payload = buildPayload();

    try {
      if (!isEdit) {
        await http.post("/sales-orders", payload);
        toast.success("Order created as Draft");
        navigate("/outbound");
      } else {
        await http.put(`/sales-orders/${id}`, payload);
        toast.success("Draft updated");
        navigate("/outbound");
      }
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to save draft");
    }
  };

  const onConfirm = async () => {
    if (isLocked) return toast.error("Order already allocated");

    const basicErrors = basicInfoRef.current?.validate("confirm") || [];
    if (basicErrors.length) {
      basicErrors.forEach((e) => toast.error(e));
      return;
    }

    const { isValid, errors } = validateSalesOrder(header, shipTo, lines);
    if (!isValid) {
      Object.values(errors).forEach((e) => toast.error(e));
      return;
    }

    const payload = buildPayload();
    if (!payload) return;

    let orderId = id;
    try {
      if (!isEdit) {
        const { data } = await http.post("/sales-orders", payload);
        console.log(data);
        orderId = data?.order.id;
      } else {
        await http.put(`/sales-orders/${id}`, payload);
      }

      await http.post(`/sales-orders/${orderId}/confirm`);
      toast.success("Order created as confirmed");
      navigate("/outbound");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to confirm order");
    }
  };

  const isLocked = ["ALLOCATED", "PICKED", "PACKED", "SHIPPED"].includes(
    status,
  );
  const canEdit = !isLocked;
  const canConfirm = status === "DRAFT" || !isEdit;
  return (
    <FormPage
      breadcrumbs={[
        { label: "Outbound", to: "/outbound" },
        { label: "Create Sales Order" },
      ]}
      title="Create Sales Order"
      topActions={
        <>
          <button
            onClick={() => {
              navigate("/outbound");
            }}
            className="px-4 py-2 border rounded-md text-sm bg-white"
          >
            Cancel
          </button>
          {canEdit && (
            <button
              onClick={onSaveDraft}
              className="px-4 py-2 border rounded-md text-sm bg-white"
            >
              Save Draft
            </button>
          )}
        </>
      }
      bottomLeft={
        <button
          onClick={() => navigate("/outbound")}
          className="px-4 py-2 border rounded-md text-sm bg-white"
        >
          Cancel
        </button>
      }
      bottomRight={
        <>
          {canEdit && (
            <button
              onClick={onSaveDraft}
              className="px-4 py-2 border rounded-md text-sm bg-white"
            >
              Save Draft
            </button>
          )}
          {canConfirm && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-md text-sm bg-primary text-white"
            >
              Save & Confirm
            </button>
          )}
          {!canEdit && !canConfirm && (
            <div className="px-4 py-2 rounded-md text-sm bg-gray-300 text-white">
              Status: {status}
            </div>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <BasicInformationSection
            ref={basicInfoRef}
            initialAsn={{
              warehouse_id: header.warehouse_id,
              client_id: header.client_id,
              reference_no: header.orderRef,
              notes: header.notes,
            }}
            clientQuery={isEdit ? { id: header.client_id } : {}}
            mode={isEdit ? "edit" : "create"}
            showSupplier={false}
            showDock={false}
            dockType="OUTBOUND"
            onChange={(data) => {
              setHeader((prev) => ({
                ...prev,
                warehouse_id: data.warehouse_id || null,
                client_id: data.client_id || null,
                orderRef: data.reference_no || "",
                notes: data.notes || "",
                warehouse_name: data.warehouse_label || "",
                client_name: data.client_label || "",
              }));
            }}
          />

          <ShipToCustomer
            shipTo={shipTo}
            setShipTo={setShipTo}
            phoneError={phoneError}
            setPhoneError={setPhoneError}
            emailError={emailError}
            setEmailError={setEmailError}
          />

          <FormCard title="Carrier & Shipping">
            <FormGrid>
              <InputField
                label="Carrier"
                value={shipping.carrier}
                onChange={(v) => setSh("carrier", v)}
              />
              <InputField
                label="Service Level"
                value={shipping.serviceLevel}
                onChange={(v) => setSh("serviceLevel", v)}
              />
              <InputField
                label="Packaging Preference"
                value={shipping.packagingPreference}
                onChange={(v) => setSh("packagingPreference", v)}
              />
              <InputField
                label="COD Amount"
                value={shipping.codAmount}
                onChange={(v) => setSh("codAmount", v)}
              />
              <InputField
                label="AWB / Tracking"
                placeholder="If available"
                value={shipping.awbTracking}
                onChange={(v) => setSh("awbTracking", v)}
              />
            </FormGrid>
          </FormCard>

          <OrderLines
            lines={lines}
            onChange={setLines}
            disabled={isLocked}
            clientId={header.client_id}
          />

          {/* <div className="rounded-lg border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b">
              <div className="text-sm font-semibold text-gray-900">
                Allocation Settings
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <ToggleRow
                  title="Auto-allocate on confirm"
                  desc="Immediately reserve stock upon confirmation"
                  checked={alloc.autoAllocateOnConfirm}
                  onChange={(v) =>
                    setAlloc((p) => ({ ...p, autoAllocateOnConfirm: v }))
                  }
                />
                <ToggleRow
                  title="Reserve inventory"
                  desc="Hard allocate stock to this order"
                  checked={alloc.reserveInventory}
                  onChange={(v) =>
                    setAlloc((p) => ({ ...p, reserveInventory: v }))
                  }
                />
              </div>

              <div className="space-y-5">
                <ToggleRow
                  title="Allow partial allocation"
                  desc="Proceed even if full quantity isn't available"
                  checked={alloc.allowPartial}
                  onChange={(v) => setAlloc((p) => ({ ...p, allowPartial: v }))}
                />
                <ToggleRow
                  title="Allow substitute SKU"
                  desc="Replace with mapped alternatives if OOS"
                  checked={alloc.allowSubstituteSku}
                  onChange={(v) =>
                    setAlloc((p) => ({ ...p, allowSubstituteSku: v }))
                  }
                  disabled={!alloc.allowPartial}
                />
              </div>
            </div>
          </div> */}

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="px-4 py-3 border-b">
              <div className="text-sm font-semibold text-gray-900">
                Allocation Settings
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Auto-allocate on confirm
                  </div>
                  <div className="text-xs text-gray-500">
                    {alloc.autoAllocateOnConfirm ? "Yes" : "No"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Reserve inventory
                  </div>
                  <div className="text-xs text-gray-500">
                    {alloc.reserveInventory ? "Yes" : "No"}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Allow partial allocation
                  </div>
                  <div className="text-xs text-gray-500">
                    {alloc.allowPartial ? "Yes" : "No"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Allow substitute SKU
                  </div>
                  <div className="text-xs text-gray-500">
                    {alloc.allowSubstituteSku ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AttachmentsDropzone value={attachments} onChange={setAttachments} />
          <div className="h-10" />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <SummaryCard data={summaryData} />
          <ChecklistCard items={readiness} />
          <div className="h-10" />
        </div>
      </div>
    </FormPage>
  );
};

export default CreateSalesOrder;

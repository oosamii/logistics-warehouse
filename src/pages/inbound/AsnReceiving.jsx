import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import FormPage from "../components/forms/FormPage";
import CusTable from "../components/CusTable";
import AttachmentsDropzone from "../components/forms/AttachmentsDropzone";

import ReceivingSkuCard from "./components/receiving/ReceivingSkuCard";
import ShortageCard from "./components/receiving/ShortageCard";

import http from "../../api/http";
import {
  calcShortage,
  calcTotals,
  normalizeAsn,
  toReceivingRows,
} from "./components/utils/asnReceiving";
import {
  createPallet,
  getAsnLinePallets,
  getPallets,
} from "./components/api/masters.api";
import { useToast } from "@/pages/components/toast/ToastProvider";

const SHORTAGE_REASONS = [
  "MISSING",
  "WRONG_SKU",
  "PARTIAL_SHIPMENT",
  "DAMAGED_IN_TRANSIT",
  "OTHER",
];

const AsnReceiving = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const { asnData: navAsn } = location.state || {};

  const [asn, setAsn] = useState(navAsn || null);
  const [attachments, setAttachments] = useState([]);

  const [loading, setLoading] = useState(false);

  const [pallets, setPallets] = useState([]);
  const [selectedPalletId, setSelectedPalletId] = useState("");

  const [palletType, setPalletType] = useState("");
  const [palletLocation, setPalletLocation] = useState("");

  const [batchNo, setBatchNo] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [goodQty, setGoodQty] = useState("");
  const [damagedQty, setDamagedQty] = useState("");

  const [shortageMeta, setShortageMeta] = useState({});

  const rows = useMemo(() => toReceivingRows(asn?.lines || []), [asn]);
  const [activeLineId, setActiveLineId] = useState(null);
  const [lineReceipts, setLineReceipts] = useState([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);

  const clearSelection = () => {
    setActiveLineId(null);

    setBatchNo("");
    setSerialNo("");
    setExpiryDate("");
    setGoodQty(0);
    setDamagedQty(0);
    setSelectedPalletId("");
  };

  const fetchAsn = async () => {
    if (!navAsn?.id) return;
    const res = await http.get(`/asns/${navAsn.id}`);
    setAsn(normalizeAsn(res));
  };

  const fetchPallets = async () => {
    const list = await getPallets();
    setPallets(list || []);
  };

  useEffect(() => {
    if (navAsn?.id) fetchAsn();
    fetchPallets();
  }, [navAsn?.id]);

  const activeLine = useMemo(() => {
    if (!activeLineId) return null;
    return rows.find((x) => String(x.id) === String(activeLineId)) || null;
  }, [rows, activeLineId]);

  useEffect(() => {
    const loadReceipts = async () => {
      if (!activeLine?.asnLineId) {
        setLineReceipts([]);
        return;
      }

      setReceiptsLoading(true);
      try {
        const list = await getAsnLinePallets(activeLine.asnLineId);
        setLineReceipts(list || []);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load receipts";
        toast.error(msg);
        setLineReceipts([]);
      } finally {
        setReceiptsLoading(false);
      }
    };

    loadReceipts();
  }, [activeLine?.asnLineId]);

  const totals = useMemo(() => calcTotals(asn), [asn]);

  const shortageUnits = useMemo(() => {
    const raw = activeLine?.raw;
    return calcShortage(raw);
  }, [activeLine]);

  const canPostGrn = asn?.status === "IN_RECEIVING";

  const columns = useMemo(
    () => [
      {
        key: "idx",
        title: "#",
        render: (_row, idx) => idx + 1,
      },
      {
        key: "skuDetails",
        title: "SKU Details",
        render: (row) => (
          <button
            type="button"
            className="w-full text-left"
            onClick={() => {
              setActiveLineId(String(row.id));
            }}
          >
            <div className="min-w-0">
              <div className="text-sm text-blue-500 font-medium hover:underline">
                {row.sku}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {row.skuDesc}
              </div>
            </div>
          </button>
        ),
      },
      { key: "uom", title: "UOM" },
      { key: "exp", title: "Exp" },
      { key: "rcvd", title: "Rcvd" },
      { key: "dmg", title: "Dmg" },
      {
        key: "status",
        title: "Status",
        render: (row) => (
          <span
            className={[
              "px-2 py-1 rounded-full text-xs",
              row.status === "Partial"
                ? "bg-yellow-50 text-yellow-700"
                : row.status === "Completed"
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-700",
            ].join(" ")}
          >
            {row.status}
          </span>
        ),
      },
    ],
    [],
  );

  const onCreatePallet = async () => {
    if (!asn?.warehouse_id) {
      toast.error("Warehouse is missing.");
      return;
    }

    setLoading(true);
    try {
      const created = await createPallet({
        warehouse_id: asn.warehouse_id,
        pallet_type: palletType || "",
        current_location: palletLocation || "",
      });

      await fetchPallets();

      if (created?.id) {
        setSelectedPalletId(String(created.id));
        toast.success(
          `Pallet created: ${created.pallet_id || `ID ${created.id}`}`,
        );
      } else {
        toast.success("Pallet created.");
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create pallet";

      toast.error(`${msg}${status ? ` (HTTP ${status})` : ""}`);
    } finally {
      setLoading(false);
    }
  };

  const onReceive = async () => {
    console.log("onReceive fired", {
      activeLine,
      goodQty,
      damagedQty,
      selectedPalletId,
    });

    if (!activeLine?.asnLineId) {
      toast.error("Select a receiving line first.");
      console.warn("BLOCK: no activeLine.asnLineId");
      return;
    }

    const good = Number(goodQty || 0);
    const dmg = Number(damagedQty || 0);
    if (good + dmg <= 0) {
      toast.error("Enter Good Qty or Damaged Qty.");
      console.warn("BLOCK: qty is zero");
      return;
    }

    const meta = shortageMeta[activeLine.asnLineId] || {};
    const hasShortage = shortageUnits > 0;

    const payload = {
      batch_no: batchNo || undefined,
      serial_no: serialNo || undefined,
      expiry_date: expiryDate || undefined,
      good_qty: good,
      damaged_qty: dmg,

      ...(selectedPalletId
        ? { pallet_id: Number(selectedPalletId) }
        : { pallet_type: palletType || "" }),

      ...(hasShortage
        ? {
            shortage_reason: meta.reason,
            shortage_notes: meta.notes || "",
          }
        : {}),
    };

    console.log("POST /asn-lines/:id/receive payload =>", payload);

    setLoading(true);
    try {
      const res = await http.post(
        `/asn-lines/${activeLine.asnLineId}/receive`,
        payload,
      );
      console.log("Receive API success:", res?.data);

      toast.success("Received quantity added.");
      await fetchAsn();
      const list = await getAsnLinePallets(activeLine.asnLineId);
      setLineReceipts(list || []);

      setGoodQty("");
      setDamagedQty("");
    } catch (err) {
      console.error("Receive API failed:", err);

      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Receive failed";

      toast.error(`${msg}${status ? ` (HTTP ${status})` : ""}`);
    } finally {
      setLoading(false);
    }
  };

  const onPostGrn = async () => {
    if (!canPostGrn || !asn?.id) return;

    setLoading(true);
    try {
      await http.post(`/grns/post-from-asn`, { asn_id: asn.id });

      toast.success("GRN posted successfully.");
      navigate("/inbound");
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to post GRN";

      toast.error(`${msg}${status ? ` (HTTP ${status})` : ""}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FormPage
        hideFooter
        breadcrumbs={[
          { label: "Inbound", to: "/inbound" },
          { label: "ASN", to: `/inbound/ASNdetails/${asn?.id}` },
          { label: "Receiving" },
        ]}
        title={`ASN Receiving ${asn?.asn_no ? `- ${asn.asn_no}` : ""}`}
        topActions={
          <>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border rounded-md text-sm bg-white flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <button className="px-4 py-2 border rounded-md text-sm bg-white flex items-center gap-2">
              <Printer size={16} />
              Print GRN
            </button>
          </>
        }
        bottomLeft={
          <div className="flex items-center gap-8 text-xs text-gray-500"></div>
        }
        bottomRight={
          <button
            disabled={!canPostGrn || loading}
            onClick={onPostGrn}
            className={[
              "px-4 py-2 rounded-md text-sm text-white",
              canPostGrn ? "bg-primary" : "bg-gray-300 cursor-not-allowed",
            ].join(" ")}
          >
            Post GRN
          </button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8">
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">
                  Receiving Lines ({rows.length})
                </div>
              </div>

              <CusTable columns={columns} data={rows} />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            {!activeLine ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">
                  Select a receiving line
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Click a SKU from the left table to start receiving.
                </div>
              </div>
            ) : (
              <>
                <ReceivingSkuCard
                  skuTitle={`${activeLine?.sku || "-"}: ${activeLine?.skuDesc || "-"}`}
                  partialText={
                    activeLine
                      ? `${activeLine.status}: ${
                          Number(activeLine.rcvd || 0) +
                          Number(activeLine.dmg || 0)
                        } / ${activeLine.exp}`
                      : "-"
                  }
                  pallets={pallets}
                  selectedPalletId={selectedPalletId}
                  setSelectedPalletId={setSelectedPalletId}
                  onCreatePallet={onCreatePallet}
                  palletType={palletType}
                  setPalletType={setPalletType}
                  palletLocation={palletLocation}
                  setPalletLocation={setPalletLocation}
                  batchNo={batchNo}
                  setBatchNo={setBatchNo}
                  serialNo={serialNo}
                  setSerialNo={setSerialNo}
                  expiryDate={expiryDate}
                  setExpiryDate={setExpiryDate}
                  goodQty={goodQty}
                  setGoodQty={setGoodQty}
                  damagedQty={damagedQty}
                  setDamagedQty={setDamagedQty}
                  onReceive={onReceive}
                  loading={loading}
                  receipts={lineReceipts}
                  receiptsLoading={receiptsLoading}
                  onCancel={clearSelection}
                />

                <ShortageCard
                  shortageUnits={shortageUnits}
                  reasons={SHORTAGE_REASONS}
                  value={
                    shortageMeta[activeLine?.asnLineId] || {
                      reason: "",
                      notes: "",
                    }
                  }
                  onChange={(next) =>
                    setShortageMeta((p) => ({
                      ...p,
                      [activeLine.asnLineId]: next,
                    }))
                  }
                />

                <AttachmentsDropzone
                  value={attachments}
                  onChange={setAttachments}
                />
              </>
            )}
          </div>
        </div>
      </FormPage>
      <div className="sticky bottom-[-18px] mt-6 bg-white border-t">
        <div className="px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Totals */}
            <div className="grid grid-cols-2 md:flex md:items-center gap-3 md:gap-8 text-xs text-gray-500">
              <div>
                <div className="uppercase">Total Expected</div>
                <div className="text-base font-semibold text-gray-900">
                  {totals.totalExpected}
                </div>
              </div>

              <div>
                <div className="uppercase">Received Good</div>
                <div className="text-base font-semibold text-green-600">
                  {totals.receivedGood}
                </div>
              </div>

              <div>
                <div className="uppercase">Damaged</div>
                <div className="text-base font-semibold text-red-600">
                  {totals.damaged}
                </div>
              </div>

              <div>
                <div className="uppercase">Discrepancy</div>
                <div
                  className={`text-base font-semibold ${
                    totals.discrepancy < 0 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {totals.discrepancy}
                </div>
              </div>
            </div>

            {/* Action */}
            <button
              disabled={!canPostGrn || loading}
              onClick={onPostGrn}
              className={[
                "w-full md:w-auto px-4 py-2 rounded-md text-sm text-white",
                canPostGrn ? "bg-primary" : "bg-gray-300 cursor-not-allowed",
              ].join(" ")}
            >
              Post GRN
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AsnReceiving;

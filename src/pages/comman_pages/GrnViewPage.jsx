import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";

import PageHeader from "../components/PageHeader";
import CusTable from "../components/CusTable";
import http from "../../api/http";

const GrnViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [grn, setGrn] = useState(null);

  useEffect(() => {
    fetchGrn();
  }, [id]);

  const fetchGrn = async () => {
    try {
      setLoading(true);

      const res = await http.get(`/grns/${id}`);
      setGrn(res.data?.data);
    } catch (err) {
      console.error("GRN fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const shortage = useMemo(() => {
    if (!grn?.asn) return 0;
    return grn.asn.total_expected_units - grn.total_received_qty;
  }, [grn]);

  const tableData = useMemo(() => {
    if (!grn?.lines) return [];
    return grn.lines.map((line) => ({
      pt_task_id: line.pt_task_id,
      sku: `${line.sku?.sku_code} - ${line.sku?.sku_name}`,
      batch_no: line.batch_no,
      qty: line.qty,
      pallet: line.pallet?.pallet_id,
      source: line.source_location?.location_code,
      destination: line.destination_location?.location_code,
      assignee: line.assignee?.username,
      putaway_status: line.putaway_status,
      putaway_completed_at: line.putaway_completed_at,
    }));
  }, [grn]);

  const columns = [
    { key: "pt_task_id", label: "Task ID" },
    { key: "sku", label: "SKU" },
    { key: "batch_no", label: "Batch" },
    { key: "qty", label: "Qty" },
    { key: "pallet", label: "Pallet" },
    { key: "source", label: "Source" },
    { key: "destination", label: "Destination" },
    { key: "assignee", label: "Assigned To" },
    { key: "putaway_status", label: "Status" },
    { key: "putaway_completed_at", label: "Completed At" },
  ];

  if (loading) return <div className="p-6">Loading...</div>;

  if (!grn) return <div className="p-6 text-red-500">GRN not found</div>;

  return (
    <div className="">
      <PageHeader
        title={`GRN ${grn.grn_no}`}
        subtitle={`ASN ${grn.asn?.asn_no} • ${grn.status}`}
        breadcrumbs={[
          //   { label: "Inbound", to: "/inbound" },
          //   { label: "GRNs", to: "/inbound/grns" },
          { label: grn.grn_no },
        ]}
        actions={
          <>
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-2 border rounded-md flex items-center gap-2 text-sm"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {/* <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-black text-white rounded-md flex items-center gap-2 text-sm"
            >
              <Printer size={16} />
              Print
            </button> */}
          </>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Received" value={grn.total_received_qty} />
        <SummaryCard label="Total Damaged" value={grn.total_damaged_qty} />
        <SummaryCard
          label="Expected Units"
          value={grn.asn?.total_expected_units}
        />
        <SummaryCard label="Shortage" value={shortage} />
      </div>

      {/* ASN + Warehouse */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <InfoCard title="ASN Details">
          <InfoRow label="ASN No" value={grn.asn?.asn_no} />
          <InfoRow label="Reference No" value={grn.asn?.reference_no} />
          <InfoRow label="Transporter" value={grn.asn?.transporter_name} />
          <InfoRow label="Vehicle No" value={grn.asn?.vehicle_no} />
          <InfoRow label="Driver" value={grn.asn?.driver_name} />
          <InfoRow label="Special Handling" value={grn.asn?.special_handling} />
          <InfoRow label="Notes" value={grn.asn?.notes} />
        </InfoCard>

        <InfoCard title="Warehouse Details">
          <InfoRow label="Name" value={grn.warehouse?.warehouse_name} />
          <InfoRow label="Code" value={grn.warehouse?.warehouse_code} />
          <InfoRow label="City" value={grn.warehouse?.city} />
          <InfoRow label="State" value={grn.warehouse?.state} />
          <InfoRow label="Country" value={grn.warehouse?.country} />
          <InfoRow label="Capacity" value={grn.warehouse?.capacity_sqft} />
        </InfoCard>
      </div>

      {/* Lines */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-4">Putaway Tasks</h2>

        <CusTable columns={columns} data={tableData} />
      </div>
    </div>
  );
};

export default GrnViewPage;

/* Small components */

const SummaryCard = ({ label, value }) => (
  <div className="bg-white border rounded-xl p-4">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-xl font-semibold mt-1">{value ?? 0}</p>
  </div>
);

const InfoCard = ({ title, children }) => (
  <div className="bg-white border rounded-xl p-4">
    <h3 className="font-semibold mb-4">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="text-gray-900 font-medium text-right max-w-[60%]">
      {value || "-"}
    </span>
  </div>
);

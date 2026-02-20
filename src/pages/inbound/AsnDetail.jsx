import { ArrowLeft, Printer, PlayCircle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useMemo, useEffect, useState } from "react";
import AsnMetaBar from "./components/asndetails/AsnMetaBar";
import ShipmentJourney from "./components/asndetails/ShipmentJourney";
import KeyValueCard from "./components/asndetails/KeyValueCard";
import QuantitySummary from "./components/asndetails/QuantitySummary";
import { useNavigate, useParams } from "react-router-dom";
import http from "../../api/http";
import { useToast } from "../components/toast/ToastProvider";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import { getStatusBadgeColor } from "../components/helper";

const AsnDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asnData, setAsnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const toast = useToast();

  // Fetch ASN data
  useEffect(() => {
    const fetchAsnData = async () => {
      try {
        setLoading(true);
        const response = await http.get(`/asns/${id}`);
        if (response.data.success) {
          setAsnData(response.data.data);
        } else {
          setError("Failed to fetch ASN data");
        }
      } catch (err) {
        console.error("Error fetching ASN data:", err);
        setError("Failed to load ASN details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAsnData();
    }
  }, [id]);

  const breadcrumbs = useMemo(
    () => [{ label: "Inbound", to: "/inbound" }, { label: "ASN Detail" }],
    [],
  );

  // Determine current status for journey steps
  const getJourneySteps = () => {
    if (!asnData) return [];

    const steps = [
      {
        label: "Created",
        state: "done",
        time: new Date(asnData.created_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ];

    // Add confirmed step if exists
    if (asnData.confirmed_at) {
      steps.push({
        label: "Confirmed",
        state: "done",
        time: new Date(asnData.confirmed_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }

    // Add receiving step if exists
    if (asnData.receiving_started_at) {
      steps.push({
        label: "In Receiving",
        state: asnData.status === "IN_RECEIVING" ? "active" : "done",
        time: new Date(asnData.receiving_started_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } else {
      steps.push({ label: "In Receiving", state: "todo", time: "" });
    }

    // Add posted step if exists
    if (asnData.grn_posted_at) {
      steps.push({
        label: "Posted",
        state: "done",
        time: new Date(asnData.grn_posted_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } else {
      steps.push({ label: "Posted", state: "todo", time: "" });
    }

    // Add putaway step if exists
    if (asnData.putaway_completed_at) {
      steps.push({
        label: "Putaway",
        state: "done",
        time: new Date(asnData.putaway_completed_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } else {
      steps.push({ label: "Putaway", state: "todo", time: "" });
    }

    // Add closed step if exists
    if (asnData.closed_at) {
      steps.push({
        label: "Closed",
        state: "done",
        time: new Date(asnData.closed_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } else {
      steps.push({ label: "Closed", state: "todo", time: "" });
    }

    // Update current active step based on status
    const statusSteps = {
      DRAFT: 0,
      CONFIRMED: 1,
      IN_RECEIVING: 2,
      GRN_POSTED: 3,
      PUTAWAY_COMPLETED: 4,
      CLOSED: 5,
      CANCELLED: 0, // Cancelled goes back to beginning
    };

    const currentStepIndex = statusSteps[asnData.status] || 0;

    // Reset all to done up to current step
    for (let i = 0; i < steps.length; i++) {
      if (i < currentStepIndex) {
        steps[i].state = "done";
      } else if (i === currentStepIndex) {
        steps[i].state = "active";
      } else {
        steps[i].state = "todo";
      }
    }

    return steps;
  };

  // Format ETA for display
  const formatETA = (etaString) => {
    if (!etaString) return "Not set";
    const etaDate = new Date(etaString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (etaDate.toDateString() === today.toDateString()) {
      return `Today, ${etaDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (etaDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${etaDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return etaDate.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Format progress text
  const getProgressText = () => {
    if (!asnData) return "0 / 0 Units";
    return `${asnData.total_received_units} / ${asnData.total_expected_units} Units`;
  };

  // Calculate completion percentage
  const getCompletionPercent = () => {
    if (!asnData || !asnData.total_expected_units) return 0;
    return Math.round(
      (asnData.total_received_units / asnData.total_expected_units) * 100,
    );
  };

  // Handle start receiving
  const handleStartReceiving = async () => {
    try {
      await http.post(`/asns/${id}/start-receiving`);
      // Refresh data
      const response = await http.get(`/asns/${id}`);
      if (response.data.success) {
        setAsnData(response.data.data);
      }
    } catch (err) {
      console.error("Error starting receiving:", err);
      alert("Failed to start receiving");
    }
  };

  // const handleCancelASN = async () => {
  //   if (
  //     window.confirm(
  //       "Are you sure you want to cancel this ASN? This action cannot be undone.",
  //     )
  //   ) {
  //     try {
  //       let cancelResponse;
  //       try {
  //         cancelResponse = await http.post(`/asns/${id}/cancel`);
  //       } catch (endpoint1Error) {
  //         console.log("Trying alternative cancel endpoint...");
  //         cancelResponse = await http.delete(`/asns/${id}`);
  //       }

  //       if (cancelResponse.data.success) {
  //         const response = await http.get(`/asns/${id}`);
  //         if (response.data.success) {
  //           setAsnData(response.data.data);
  //           toast.error("ASN cancelled successfully!");
  //         }
  //       } else {
  //         toast.error("Failed to cancel ASN");
  //       }
  //     } catch (err) {
  //       console.error("Error cancelling ASN:", err);
  //       toast.error("Failed to cancel ASN. Please try again.");
  //     }
  //   }
  // };

  // Handle print ASN

  const handleCancelASN = () => {
    setShowCancelModal(true);
  };

  const confirmCancelASN = async () => {
    try {
      setCancelLoading(true);

      const res = await http.delete(`/asns/${id}`);

      if (res.data?.success) {
        toast.success(res.data?.message || "ASN cancelled successfully");
        navigate("/inbound"); // since it’s deleted completely
        return;
      }

      toast.error(res.data?.message || "Failed to cancel ASN");
    } catch (err) {
      console.error("Error cancelling ASN:", err);
      toast.error("Failed to cancel ASN. Please try again.");
    } finally {
      setCancelLoading(false);
      setShowCancelModal(false);
    }
  };

  const handlePrintASN = () => {
    // You can implement print functionality here
    window.print();
  };

  // Format status for display
  const formatStatus = (status) => {
    return status.replace(/_/g, " ");
  };

  if (loading) {
    return (
      <div className="max-w-full p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading ASN details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-full p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
          <button
            onClick={() => navigate("/inbound")}
            className="mt-2 px-4 py-2 border rounded-md text-sm bg-white"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  if (!asnData) {
    return (
      <div className="max-w-full p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800">ASN not found</div>
          <button
            onClick={() => navigate("/inbound")}
            className="mt-2 px-4 py-2 border rounded-md text-sm bg-white"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={asnData.asn_no}
        actions={
          <>
            <button
              onClick={() => navigate("/inbound")}
              className="px-4 py-2 border rounded-md text-sm bg-white flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={16} /> Back to List
            </button>
            {asnData.status !== "CLOSED" &&
              asnData.status !== "CANCELLED" &&
              asnData.status !== "PUTAWAY_COMPLETED" && (
                <button
                  onClick={handleCancelASN}
                  className="px-4 py-2 border rounded-md text-sm bg-white text-red-600 border-red-200 hover:bg-red-50 transition-colors"
                >
                  Cancel ASN
                </button>
              )}
            <button
              onClick={handlePrintASN}
              className="px-4 py-2 border rounded-md text-sm bg-white flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Printer size={16} /> Print ASN
            </button>
            {asnData.status === "CONFIRMED" && (
              <button
                onClick={handleStartReceiving}
                className="px-4 py-2 rounded-md text-sm bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <PlayCircle size={16} /> Start Receiving
              </button>
            )}
            {asnData.status === "IN_RECEIVING" && (
              <button
                onClick={() =>
                  navigate(`/inbound/ASN/ASNreceive/${asnData.asn_no}`, {
                    state: { asnData: asnData },
                  })
                }
                className="px-4 py-2 rounded-md text-sm bg-green-600 text-white flex items-center gap-2 hover:bg-green-700 transition-colors"
              >
                <PlayCircle size={16} /> Resume Receiving
              </button>
            )}
          </>
        }
      />

      {/* Meta Bar */}
      <AsnMetaBar
        status={formatStatus(asnData.status)}
        client={asnData.client?.client_name || "N/A"}
        supplier={asnData.supplier?.supplier_name || "N/A"}
        eta={formatETA(asnData.eta)}
        dock={asnData.dock?.dock_name || "N/A"}
        progressText={getProgressText()}
        rightLinks={[
          // {
          //   label: "Open Receiving ↗",
          //   onClick: () =>
          //     navigate(`/ASNreceive/${asnData.asn_no}`, {
          //       state: { id: asnData.id },
          //     }),
          //   disabled: asnData.status !== "IN_RECEIVING",
          // },
          {
            label: "Putaway Tasks →",
            onClick: () => navigate("/putaway"),
            disabled: !asnData.grn_posted_at,
          },
        ]}
      />

      <div className="mt-6 space-y-6">
        {/* Shipment Journey */}
        <ShipmentJourney steps={getJourneySteps()} />

        {/* Bottom 2 cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 h-full">
            <KeyValueCard
              title="Party & Shipment Info"
              onEdit={() => console.log("edit")}
              items={[
                { label: "Client", value: asnData.client?.client_name },
                { label: "Supplier", value: asnData.supplier?.supplier_name },
                { label: "Reference No", value: asnData.reference_no },
                {
                  label: "Carrier / Vehicle",
                  value: `${asnData.transporter_name || "N/A"} / ${asnData.vehicle_no || "N/A"}`,
                },
                { label: "Driver Name", value: asnData.driver_name || "N/A" },
                { label: "Driver Phone", value: asnData.driver_phone || "N/A" },
                { label: "Dock Door", value: asnData.dock?.dock_name || "N/A" },
                {
                  label: "Special Handling",
                  value: asnData.special_handling || "None",
                },
                { label: "Notes", value: asnData.notes || "None" },
                {
                  label: "Created By",
                  value: asnData.creator?.username || "N/A",
                },
                {
                  label: "Created At",
                  value: new Date(asnData.created_at).toLocaleString(),
                },
              ]}
            />
          </div>

          <div className="lg:col-span-5 h-full">
            <QuantitySummary
              expectedUnits={asnData.total_expected_units}
              receivedUnits={asnData.total_received_units}
              damagedUnits={asnData.total_damaged_units}
              shortageUnits={Math.max(0, asnData.total_shortage_units)}
              expectedLines={asnData.total_lines}
              completionPercent={getCompletionPercent()}
            />
          </div>
        </div>

        {/* ASN Lines Table */}
        {asnData.lines && asnData.lines.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm font-semibold text-gray-900 mb-4">
              ASN Lines
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      UOM
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Expected Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Received Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Damaged Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Shortage Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {asnData.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {line.sku?.sku_code || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {line.sku?.sku_name || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {line.uom || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {line.expected_qty}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {line.received_qty}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {line.damaged_qty}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {line.shortage_qty}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeColor(line.status)}`}
                        >
                          {line.status || ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {line.remarks || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td
                      colSpan="3"
                      className="px-4 py-3 text-sm font-semibold text-gray-900 text-right"
                    >
                      Total:
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {asnData.lines.reduce(
                        (sum, line) => sum + (line.expected_qty || 0),
                        0,
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {asnData.lines.reduce(
                        (sum, line) => sum + (line.received_qty || 0),
                        0,
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {asnData.lines.reduce(
                        (sum, line) => sum + (line.damaged_qty || 0),
                        0,
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {asnData.lines.reduce(
                        (sum, line) => sum + (line.shortage_qty || 0),
                        0,
                      )}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={showCancelModal}
        title="Cancel ASN"
        message="Are you sure you want to cancel this ASN? This will delete it completely and cannot be undone."
        confirmText="Yes, Cancel ASN"
        cancelText="No, Keep ASN"
        loading={cancelLoading}
        onClose={() => !cancelLoading && setShowCancelModal(false)}
        onConfirm={confirmCancelASN}
      />
    </div>
  );
};

export default AsnDetail;

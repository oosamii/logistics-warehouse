import React from "react";
import { Package, RotateCw, Phone, Truck, MapPin } from "lucide-react";

const ShipmentOverview = ({ shipmentDetails }) => {
  // Generate timeline based on shipment status
  const generateTimeline = () => {
    const timeline = [];
    
    // Shipment Created
    timeline.push({
      id: 1,
      title: "Shipment Created",
      meta: shipmentDetails.createdAt,
      type: "done",
    });

    // Dispatched (if applicable)
    if (shipmentDetails.dispatchTime && shipmentDetails.dispatchTime !== "N/A") {
      timeline.push({
        id: 2,
        title: "Dispatched from Warehouse",
        meta: `${shipmentDetails.dispatchTime} • ${shipmentDetails.warehouse}`,
        type: shipmentDetails.rawStatus === "DISPATCHED" ? "active" : "done",
      });
    }

    // In Transit (if applicable)
    if (shipmentDetails.rawStatus === "IN_TRANSIT" || shipmentDetails.rawStatus === "DISPATCHED") {
      timeline.push({
        id: 3,
        title: "In Transit",
        meta: "Shipment is on the way",
        type: shipmentDetails.rawStatus === "IN_TRANSIT" ? "active" : "pending",
      });
    }

    // Estimated Delivery
    if (shipmentDetails.estimatedDelivery && shipmentDetails.estimatedDelivery !== "N/A") {
      timeline.push({
        id: 4,
        title: "Estimated Delivery",
        meta: shipmentDetails.estimatedDelivery,
        type: "estimate",
      });
    }

    return timeline;
  };

  const timeline = generateTimeline();

  return (
    <div className="space-y-6">
      {/* Top 3 cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <MiniCard
          title={shipmentDetails.carrier}
          rightTitle={shipmentDetails.service}
        >
          <div className="text-sm text-gray-500">Tracking Number</div>
          <div className="mt-1 text-lg font-bold text-gray-900">
            {shipmentDetails.awb}
          </div>
          {shipmentDetails.carrierDetails?.phone && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} />
              {shipmentDetails.carrierDetails.phone}
            </div>
          )}
        </MiniCard>

        <MiniCard title="Delivery Information" rightTitle="">
          <div className="text-sm text-gray-500">Ship To</div>
          <div className="mt-1 font-semibold text-gray-900">
            {shipmentDetails.shipToName}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {shipmentDetails.shipToAddress}
          </div>
          {shipmentDetails.shipToPhone && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} />
              {shipmentDetails.shipToPhone}
            </div>
          )}
        </MiniCard>

        <MiniCard title="Shipment Details" rightTitle="">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Weight</div>
              <div className="mt-1 font-bold text-gray-900">
                {shipmentDetails.totalWeight} kg
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Shipping Cost</div>
              <div className="mt-1 font-bold text-gray-900">
                ${shipmentDetails.shippingCost}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Cartons</div>
              <div className="mt-1 font-bold text-gray-900">
                {shipmentDetails.cartons}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Last Updated</div>
              <div className="mt-1 font-bold text-gray-900">
                {shipmentDetails.updatedAt}
              </div>
            </div>
          </div>
        </MiniCard>
      </div>

      {/* Status timeline card */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="text-lg font-semibold text-gray-900">
            Status Timeline
          </div>
          {/* <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2">
              <RotateCw size={14} />
              Last synced: Just now
            </span>
            <button className="font-medium text-blue-600 hover:text-blue-700">
              Sync now
            </button>
          </div> */}
        </div>

        <div className="border-t px-6 py-6">
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />

            <div className="space-y-7">
              {timeline.map((t) => (
                <div key={t.id} className="relative flex gap-4">
                  <TimelineDot type={t.type} />
                  <div className="min-w-0">
                    <div
                      className={`font-semibold ${
                        t.type === "estimate" ? "text-gray-600" : "text-gray-900"
                      }`}
                    >
                      {t.title}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">{t.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentOverview;

const MiniCard = ({ title, rightTitle, children }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6">
    <div className="flex items-start justify-between gap-3">
      <div className="font-semibold text-gray-900">{title}</div>
      {rightTitle && rightTitle !== "Standard" ? (
        <div className="font-semibold text-gray-900">{rightTitle}</div>
      ) : null}
    </div>
    <div className="mt-5">{children}</div>
  </div>
);

const TimelineDot = ({ type }) => {
  if (type === "estimate") {
    return (
      <div className="relative z-10 mt-1 h-6 w-6 rounded-full border-2 border-gray-200 bg-white" />
    );
  }
  if (type === "pending") {
    return (
      <div className="relative z-10 mt-1 h-6 w-6 rounded-full border-2 border-gray-300 bg-white" />
    );
  }
  return (
    <div className="relative z-10 mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
      <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
    </div>
  );
};
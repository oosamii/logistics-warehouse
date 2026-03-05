// DashboardQueue.jsx (updated to pass warehouseId to all queue tables)
import QueueCard from "./QueueCard";
import InboundQueueTable from "./InboundQueueTable";
import PickingQueueTable from "./PickingQueueTable";
import PackingQueueTable from "./PackingQueueTable";
import { useAccess } from "../utils/useAccess";

const DashboardQueue = ({ warehouseId = "1" }) => {
  const inboundAccess = useAccess("INBOUND");
  const pickingAccess = useAccess("PICKING");
  const packingAccess = useAccess("PACKING");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {inboundAccess.canRead && (
        <QueueCard
          title="Inbound Queue"
          viewAllPath="/inbound"
          warehouseId={warehouseId}
        >
          <InboundQueueTable warehouseId={warehouseId} />
        </QueueCard>
      )}

      {pickingAccess.canRead && (
        <QueueCard
          title="Picking Queue"
          viewAllPath="/picking"
          warehouseId={warehouseId}
        >
          <PickingQueueTable warehouseId={warehouseId} />
        </QueueCard>
      )}

      {packingAccess.canRead && (
        <QueueCard
          title="Packing Queue"
          viewAllPath="/packing"
          warehouseId={warehouseId}
        >
          <PackingQueueTable warehouseId={warehouseId} />
        </QueueCard>
      )}
    </div>
  );
};

export default DashboardQueue;

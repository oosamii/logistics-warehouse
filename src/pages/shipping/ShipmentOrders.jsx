import React from "react";
import CusTable from "../components/CusTable";

const ShipmentOrders = ({ shipmentDetails }) => {
  const salesOrder = shipmentDetails.salesOrder;
  
  if (!salesOrder) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">No order information available</p>
      </div>
    );
  }

  // Prepare data for CusTable (as an array with one item)
  const tableData = [{
    id: salesOrder.id,
    order_no: salesOrder.order_no,
    customer_name: salesOrder.customer_name,
    cartons: shipmentDetails.cartons,
    status: salesOrder.status,
    order_type: salesOrder.order_type || 'STANDARD',
    // Add any other fields you might need
  }];

  // Define columns for CusTable
  const columns = [
    { 
      key: "order_no", 
      title: "Order No",
      render: (row) => (
        <button className="font-semibold text-blue-600 hover:text-blue-700">
          {row.order_no}
        </button>
      )
    },
    { 
      key: "customer_name", 
      title: "Customer" 
    },
    { 
      key: "cartons", 
      title: "Cartons" 
    },
    { 
      key: "status", 
      title: "Status",
      render: (row) => {
        const statusColors = {
          SHIPPED: 'bg-green-100 text-green-700',
          PACKED: 'bg-blue-100 text-blue-700',
          CREATED: 'bg-gray-100 text-gray-700',
          PROCESSING: 'bg-yellow-100 text-yellow-700',
          CANCELLED: 'bg-red-100 text-red-700',
        };
        return (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            statusColors[row.status] || 'bg-gray-100 text-gray-700'
          }`}>
            {row.status}
          </span>
        );
      }
    },
    { 
      key: "order_type", 
      title: "Order Type" 
    },
    // { 
    //   key: "actions", 
    //   title: "Actions",
    //   render: () => (
    //     <div className="flex justify-end">
    //       {/* Actions can be added here when needed */}
    //       <span className="text-gray-400 text-xs">—</span>
    //     </div>
    //   )
    // }
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="text-lg font-semibold text-gray-900">
          Order in Shipment
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
          1 Order
        </span>
      </div>

      <div className="border-t">
        <CusTable columns={columns} data={tableData} />
      </div>
    </div>
  );
};

export default ShipmentOrders;
import React from "react";
import { Eye, Printer } from "lucide-react";
import CusTable from "../components/CusTable";

const ShipmentCartons = ({ shipmentDetails }) => {
  const cartons = shipmentDetails.cartonsData || [];
  
  // Format carton data for display
  const formattedCartons = cartons.map(carton => ({
    id: carton.id,
    cartonId: carton.carton_no || `CTN-${carton.id}`,
    orderNo: shipmentDetails.salesOrder?.order_no || "N/A",
    itemsCount: `${carton.items?.length || 0} SKUs`,
    qty: carton.total_items || carton.items?.reduce((sum, item) => sum + item.qty, 0) || 0,
    weight: `${carton.gross_weight || carton.net_weight || '0'} kg`,
    label: carton.status === 'SHIPPED' ? 'Printed' : 'Pending',
    items: carton.items || [],
    status: carton.status,
  }));

  // Define columns for CusTable
  const columns = [
    { 
      key: "cartonId", 
      title: "Carton ID",
      render: (row) => (
        <span className="font-semibold text-gray-900">
          {row.cartonId}
        </span>
      )
    },
    { 
      key: "orderNo", 
      title: "Order No",
      render: (row) => (
        <span className="font-semibold text-gray-900">
          {row.orderNo}
        </span>
      )
    },
    { 
      key: "itemsCount", 
      title: "Items Count" 
    },
    { 
      key: "qty", 
      title: "Total Qty" 
    },
    { 
      key: "weight", 
      title: "Weight" 
    },
    { 
      key: "label", 
      title: "Label Status",
      render: (row) => <StatusPill value={row.label} />
    },
    { 
      key: "status", 
      title: "Carton Status",
      render: (row) => {
        const statusColors = {
          SHIPPED: 'bg-green-100 text-green-700',
          PACKED: 'bg-blue-100 text-blue-700',
          CREATED: 'bg-gray-100 text-gray-700',
          PROCESSING: 'bg-yellow-100 text-yellow-700',
        };
        
        const formattedStatus = row.status
          ? row.status.charAt(0) + row.status.slice(1).toLowerCase()
          : 'Unknown';
        
        return (
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            statusColors[row.status] || 'bg-gray-100 text-gray-700'
          }`}>
            {formattedStatus}
          </span>
        );
      }
    },
    // { 
    //   key: "actions", 
    //   title: "Actions",
    //   render: (row) => (
    //     <div className="flex justify-end gap-2">
    //       <IconBtn 
    //         title="View Items"
    //         onClick={() => {
    //           // Handle view items
    //           console.log("View items for carton:", row.cartonId, row.items);
    //           // You can open a modal or navigate to carton details
    //         }}
    //       >
    //         <Eye size={16} />
    //       </IconBtn>
    //       <IconBtn 
    //         title="Print Label"
    //         onClick={() => {
    //           // Handle print label
    //           console.log("Print label for carton:", row.cartonId);
    //           // Implement print functionality
    //         }}
    //       >
    //         <Printer size={16} />
    //       </IconBtn>
    //     </div>
    //   )
    // }
  ];

  if (formattedCartons.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">No carton information available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="text-lg font-semibold text-gray-900">
          Cartons ({formattedCartons.length})
        </div>

        <button 
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
          onClick={() => {
            // Handle print all labels
            console.log("Print all labels");
            // Implement bulk print functionality
          }}
        >
          <Printer size={16} />
          Print All Labels
        </button>
      </div>

      <div className="border-t">
        <CusTable columns={columns} data={formattedCartons} />
      </div>
    </div>
  );
};

export default ShipmentCartons;

const StatusPill = ({ value }) => {
  const isPrinted = value === "Printed";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        isPrinted
          ? "bg-green-100 text-green-700"
          : "bg-orange-100 text-orange-700"
      }`}
    >
      {value}
    </span>
  );
};

const IconBtn = ({ children, title, onClick }) => (
  <button
    title={title}
    onClick={onClick}
    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
  >
    {children}
  </button>
);
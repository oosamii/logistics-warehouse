// packing/PackOrderDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { X, Loader } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../../api/http";

import ItemsToPack from "./components/ItemsToPack";
import CurrentCarton from "./components/CurrentCarton";
import CreateCartonModal from "./components/CreateCartonModal";
import PageHeader from "../components/PageHeader";
import { useToast } from "../components/toast/ToastProvider";

const PackOrderDetail = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [cartons, setCartons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [finalizing, setFinalizing] = useState(false);

  const fetchOrder = async () => {
    try {
      const numericId = orderId.toString().replace(/\D/g, "");
      const res = await http.get(`/sales-orders/${numericId}`);

      setOrder(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message);
      setError("Failed to load order.");
    }
  };

  const fetchCartons = async () => {
    try {
      const res = await http.get(`/packing/${orderId}/cartons`);
      setCartons(res.data?.data?.cartons || []);
    } catch (err) {
      toast.error(err?.response?.data?.message);
    }
  };

  const fetchItems = async () => {
    try {
      const numericId = orderId.toString().replace(/\D/g, "");
      const res = await http.get(`/sales-orders/${numericId}`);

      const updatedOrder = res.data;
      setOrder(updatedOrder);

      if (selectedItem) {
        const updatedLine = updatedOrder.lines?.find(
          (line) => line.id === selectedItem.id,
        );

        setSelectedItem(updatedLine || null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchOrder();
      await fetchCartons();
      setLoading(false);
    };
    init();
  }, [orderId]);

  const handleFinalize = async () => {
    try {
      setFinalizing(true);

      const res = await http.post(`/packing/${orderId}/finalize`);

      if (res?.data?.success) {
        toast.success(res?.data?.message);
      }

      navigate("/packing");
    } catch (err) {
      toast.error(err?.response?.data?.message);
    } finally {
      setFinalizing(false);
    }
  };

  const orderInfo = useMemo(() => {
    if (!order) return null;

    return {
      orderNo: order.order_no,
      client: order.client?.client_name,
      lines: order.total_lines,
      units: Number(order.total_ordered_units),
      packed: Number(order.total_packed_units),
      status: order.status,
      items: order.lines || [],
    };
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (error || !orderInfo) {
    return (
      <div className="p-6">
        <p>{error || "Order not found"}</p>
      </div>
    );
  }

  const allCartonsClosed =
    cartons.length > 0 && cartons.every((carton) => carton.status === "CLOSED");

  return (
    <div className="min-h-screen bg-[#F3F7FE] p-6 space-y-4">
      <PageHeader
        title={`Pack Order ${orderInfo.orderNo}`}
        subtitle={orderInfo.client}
        breadcrumbs={[
          { label: "Packing", to: "/packing?tab=progress" },
          { label: "Pack Order - " + orderInfo.orderNo },
        ]}
        actions={
          <>
            <button
              onClick={() => setOpenModal(true)}
              className="border border-gray-200 bg-white p-2 rounded-md text-sm hover:bg-gray-50"
            >
              + Create Carton
            </button>

            {allCartonsClosed && (
              <button
                onClick={handleFinalize}
                disabled={finalizing}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {finalizing && <Loader className="h-4 w-4 animate-spin" />}
                {finalizing ? "Finalizing..." : "Finalize Packing"}
              </button>
            )}

            <button
              onClick={() => navigate(-1)}
              className="border border-gray-200 bg-white p-2 rounded-md hover:bg-gray-50"
            >
              Go ack
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <ItemsToPack
            items={orderInfo?.items}
            selectedItemId={selectedItem?.id}
            onSelectItem={setSelectedItem}
          />
        </div>

        <div className="lg:col-span-4">
          <CurrentCarton
            orderId={orderId}
            cartons={cartons}
            refreshCartons={fetchCartons}
            refreshItems={fetchItems}
            selectedItem={selectedItem}
            setSelectedItem={() => setSelectedItem(null)}
          />
        </div>
      </div>
      <CreateCartonModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        orderId={orderId}
        onSuccess={fetchCartons}
      />
    </div>
  );
};

export default PackOrderDetail;

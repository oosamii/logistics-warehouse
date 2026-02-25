export const getAsnActionLabel = (row, canUpdate) => {
  if (row.status === "DRAFT" && canUpdate) return "Edit";
  if (row.status === "IN_RECEIVING") return "Resume";
  if (row.status === "POSTED") return "View GRN";
  return "View";
};

export const getOrderActionLabel = (status, canUpdate = true) => {
  const statusMap = {
    DRAFT: canUpdate ? "Edit" : "",
    CONFIRMED: "Allocate",
    ALLOCATED: "Pick",
    PICKED: "Pack",
    PACKED: "Ship",
    IN_RECEIVING: "Resume",
    POSTED: "View GRN",
  };

  return statusMap[status] || "View";
};

export const handleAsnNavigation = (row, navigate) => {
  if (row.status === "DRAFT") {
    navigate(`/createASN/${row.id}`, {
      state: { asn: row },
    });
  } else if (row.status === "IN_RECEIVING") {
    navigate(`/inbound/ASN/ASNreceive/${row.asn_no}`, {
      state: { asnData: row },
    });
  } else if (row.status === "POSTED") {
    navigate(`/grn/${row.id}`);
  } else {
    navigate(`/inbound/ASNdetails/${row.id}`);
  }
};

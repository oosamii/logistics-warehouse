// src/pages/inbound/utils/asnReceiving.js

export const normalizeAsn = (res) => {
  // supports either {success:true,data:{...}} OR direct {...}
  return res?.data?.data || res?.data || res;
};

export const ReceivingRows = (lines = []) => {
  return (lines || []).map((l, idx) => {
    const expected = Number(l.expected_qty || 0);
    const received = Number(l.received_qty || 0);
    const damaged = Number(l.damaged_qty || 0);

    // Prefer backend status, fallback to computed
    const uiStatus = l.status
      ? String(l.status).toLowerCase() === "partial"
        ? "Partial"
        : String(l.status).toLowerCase() === "completed"
          ? "Completed"
          : String(l.status)
      : received + damaged >= expected && expected > 0
        ? "Completed"
        : received + damaged > 0
          ? "Partial"
          : "Pending";

    return {
      id: l.id ?? idx + 1,
      asnLineId: l.id,

      sku: l.sku?.sku_code || "-",
      skuDesc: l.sku?.sku_name || "",
      uom: l.uom || l.sku?.uom || "-",

      exp: expected,

      // 👇 these are what your table columns are using
      total_received_units: received,
      dmg: damaged,

      // 👇 these are what your right panel partialText is using
      total_damaged_units: damaged,

      status: uiStatus,
      raw: l, // keep original for shortage calc
    };
  });
};

export const calcShortage = (line) => {
  const exp = Number(line?.expected_qty || 0);
  const good = Number(line?.received_qty || 0);
  const dmg = Number(line?.damaged_qty || 0);
  const total = good + dmg;
  return Math.max(0, exp - total);
};

export const calcTotals = (asn) => {
  const lines = asn?.lines || [];

  const expectedFromLines = lines.reduce(
    (s, l) => s + Number(l.expected_qty || 0),
    0,
  );
  const receivedFromLines = lines.reduce(
    (s, l) => s + Number(l.received_qty || 0),
    0,
  );
  const damagedFromLines = lines.reduce(
    (s, l) => s + Number(l.damaged_qty || 0),
    0,
  );

  const totalExpected = Number(asn?.total_expected_units ?? expectedFromLines);
  const receivedGood = Number(asn?.total_received_units ?? receivedFromLines);
  const damaged = Number(asn?.total_damaged_units ?? damagedFromLines);

  return {
    totalExpected,
    receivedGood,
    damaged,
    discrepancy: totalExpected - (receivedGood + damaged),
  };
};

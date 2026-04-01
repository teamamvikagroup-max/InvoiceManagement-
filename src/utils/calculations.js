import { TAX_TYPES } from "./constants";

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateItemTotal(item) {
  return toNumber(item.quantity) * toNumber(item.rate);
}

export function calculateTotals(items, taxType, paymentMade = 0, type = "invoice") {
  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const cgst = taxType === TAX_TYPES.CGST_SGST ? subtotal * 0.09 : 0;
  const sgst = taxType === TAX_TYPES.CGST_SGST ? subtotal * 0.09 : 0;
  const igst = taxType === TAX_TYPES.IGST ? subtotal * 0.18 : 0;
  const totalAmount = subtotal + cgst + sgst + igst;
  const paid = type === "invoice" ? toNumber(paymentMade) : 0;
  return { subtotal, cgst, sgst, igst, totalAmount, paymentMade: paid, balanceAmount: type === "invoice" ? totalAmount - paid : totalAmount };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(toNumber(amount));
}

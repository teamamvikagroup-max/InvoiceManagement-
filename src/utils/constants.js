export const TAX_TYPES = {
  CGST_SGST: "cgst_sgst",
  IGST: "igst",
};

export const DEFAULT_TERMS = `1. Payment is due by the specified due date.
2. Goods once sold will not be taken back without prior approval.
3. Please verify all item descriptions and quantities before confirmation.`;

export const DEFAULT_NOTES = "Thank you for your business.";

export const EMPTY_CUSTOMER = {
  name: "",
  address: "",
  phone: "",
  email: "",
  zipCode: "",
  placeOfSupply: "",
  gstin: "",
};

export function createEmptyItem() {
  const itemId = globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    itemId,
    description: "",
    hsnCode: "",
    quantity: 1,
    rate: 0,
  };
}

export const DASHBOARD_LINKS = [
  { title: "Create Invoice", description: "Build tax-ready invoices and upload polished PDFs to Firebase.", path: "/invoice/create" },
  { title: "Create Quotation", description: "Prepare branded quotations from the same reusable workflow.", path: "/quotation/create" },
  { title: "Invoice History", description: "Review invoices, download PDFs, and track totals over time.", path: "/invoices" },
  { title: "Quotation History", description: "Keep quotation records organized with real-time history.", path: "/quotations" },
  { title: "Company Profile", description: "Manage multiple companies, addresses, GSTIN, and logos.", path: "/company-profile" },
];
export function getFinancialYear(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}-${endYearShort}`;
}

export function getNextInvoiceNumber(sequence, dateInput = new Date()) {
  const financialYear = getFinancialYear(dateInput);
  return `INV/${financialYear}/${String(sequence).padStart(3, "0")}`;
}

export function getFinancialYearFromInvoiceNumber(invoiceNumber = "") {
  const match = /^INV\/(\d{4}-\d{2})\/(\d{3,})$/.exec(invoiceNumber);
  return match?.[1] ?? "";
}

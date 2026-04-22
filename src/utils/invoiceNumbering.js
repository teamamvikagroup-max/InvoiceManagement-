export function getFinancialYear(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}-${endYearShort}`;
}

export function getNextDocumentNumber(prefix, sequence, dateInput = new Date()) {
  const financialYear = getFinancialYear(dateInput);
  return `${prefix}/${financialYear}/${String(sequence).padStart(3, "0")}`;
}

export function getNextInvoiceNumber(sequence, dateInput = new Date()) {
  return getNextDocumentNumber("INV", sequence, dateInput);
}

export function getNextQuotationNumber(sequence, dateInput = new Date()) {
  return getNextDocumentNumber("QTN", sequence, dateInput);
}

export function getFinancialYearFromDocumentNumber(documentNumber = "") {
  const match = /^(INV|QTN)\/(\d{4}-\d{2})\/(\d{3,})$/.exec(documentNumber);
  return match?.[2] ?? "";
}

export function getFinancialYearFromInvoiceNumber(invoiceNumber = "") {
  return getFinancialYearFromDocumentNumber(invoiceNumber);
}

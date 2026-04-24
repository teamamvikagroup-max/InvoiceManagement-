import { jsPDF } from "jspdf";
import { formatCurrency } from "./calculations";
import { formatAmountInWordsEnglish, formatDate, formatWebsite } from "./formatters";

const FOOTER_TEXT = "\u00A9 2026 Amvika Group. All rights reserved.";
const LEGAL_TEXT = "This is a system-generated electronic invoice and does not require a physical signature.";
const PAGE_MARGIN = 28;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const FOOTER_HEIGHT = 44;
const CONTENT_BOTTOM = PAGE_HEIGHT - FOOTER_HEIGHT - 16;
const TABLE_COLUMNS = [
  { key: "description", label: "Description", width: 190 },
  { key: "hsnCode", label: "HSN Code", width: 92 },
  { key: "quantity", label: "Qty", width: 46 },
  { key: "rate", label: "Rate", width: 88 },
  { key: "total", label: "Amount", width: 95 },
];

function createPdf() {
  return new jsPDF({ unit: "pt", format: "a4", compress: true });
}

function safeValue(value, fallback = "-") {
  return value ? String(value) : fallback;
}

function drawRoundedCard(pdf, x, y, width, height, options = {}) {
  const {
    fillColor = null,
    strokeColor = [226, 232, 240],
    radius = 16,
    lineWidth = 1,
  } = options;

  pdf.setLineWidth(lineWidth);
  pdf.setDrawColor(...strokeColor);
  if (fillColor) {
    pdf.setFillColor(...fillColor);
    pdf.roundedRect(x, y, width, height, radius, radius, "FD");
    return;
  }

  pdf.roundedRect(x, y, width, height, radius, radius, "S");
}

function ensurePageSpace(pdf, currentY, requiredHeight, redrawTableHeader) {
  if (currentY + requiredHeight <= CONTENT_BOTTOM) {
    return currentY;
  }

  pdf.addPage();
  const nextY = PAGE_MARGIN;
  if (typeof redrawTableHeader === "function") {
    return redrawTableHeader(nextY);
  }
  return nextY;
}

function splitLines(pdf, text, width, fontSize = 10) {
  pdf.setFontSize(fontSize);
  return pdf.splitTextToSize(String(text || "-"), width);
}

function formatPdfCurrency(value) {
  const formatted = formatCurrency(value);
  return /^[^0-9-]+/.test(formatted) ? formatted.replace(/^[^0-9-]+\s*/, "Rs. ") : `Rs. ${formatted}`;
}

function getImageFormat(dataUrl) {
  if (dataUrl?.startsWith("data:image/jpeg") || dataUrl?.startsWith("data:image/jpg")) {
    return "JPEG";
  }
  return "PNG";
}

function drawFooter(pdf) {
  const pageCount = pdf.getNumberOfPages();

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    pdf.setPage(pageNumber);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(8);
    pdf.text(FOOTER_TEXT, PAGE_WIDTH / 2, PAGE_HEIGHT - 22, { align: "center" });
    pdf.setFontSize(7.3);
    pdf.text(LEGAL_TEXT, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: "center", maxWidth: PAGE_WIDTH - 120 });
    pdf.setFontSize(8);
    pdf.text(`Page ${pageNumber} of ${pageCount}`, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 22, { align: "right" });
  }
}

function drawHeader(pdf, payload) {
  const { type, invoiceNumber, dueDate, company, taxType, logoDataUrl } = payload;
  const leftX = PAGE_MARGIN;
  const rightBoxWidth = 194;
  const rightX = PAGE_WIDTH - PAGE_MARGIN - rightBoxWidth;
  const companyMaxWidth = rightX - leftX - 22;
  let companyY = PAGE_MARGIN;

  const companyNameLines = splitLines(pdf, safeValue(company?.name, "Company Name"), companyMaxWidth, 22);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(15, 23, 42);
  pdf.text(companyNameLines, leftX, companyY);
  companyY += companyNameLines.length * 24;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);

  const addressLines = splitLines(pdf, safeValue(company?.address), companyMaxWidth, 10);
  pdf.text(addressLines, leftX, companyY);
  companyY += Math.max(addressLines.length, 1) * 14;

  const companyMeta = [
    `GSTIN: ${safeValue(company?.gstin)}`,
    `Phone: ${safeValue(company?.phone)}`,
    `Email: ${safeValue(company?.email)}`,
    `Website: ${company?.website ? formatWebsite(company.website) : "-"}`,
  ];

  companyMeta.forEach((line) => {
    const lines = splitLines(pdf, line, companyMaxWidth, 10);
    pdf.text(lines, leftX, companyY);
    companyY += lines.length * 12;
  });

  const logoBoxX = PAGE_WIDTH - PAGE_MARGIN - 110;
  const logoBoxY = PAGE_MARGIN - 2;
  const logoBoxWidth = 94;
  const logoBoxHeight = 66;

  if (logoDataUrl) {
    try {
      const imageProperties = pdf.getImageProperties(logoDataUrl);
      const ratio = (imageProperties.width || 1) / (imageProperties.height || 1);
      const maxWidth = logoBoxWidth;
      const maxHeight = logoBoxHeight;
      let renderWidth = maxWidth;
      let renderHeight = renderWidth / ratio;
      if (renderHeight > maxHeight) {
        renderHeight = maxHeight;
        renderWidth = renderHeight * ratio;
      }
      const renderX = logoBoxX + (logoBoxWidth - renderWidth) / 2;
      const renderY = logoBoxY + (logoBoxHeight - renderHeight) / 2;
      pdf.addImage(logoDataUrl, getImageFormat(logoDataUrl), renderX, renderY, renderWidth, renderHeight, undefined, "FAST");
    } catch {
      // ignore logo rendering errors for speed/reliability
    }
  }

  const dividerY = Math.max(companyY, logoBoxY + logoBoxHeight) + 10;
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(1);
  pdf.line(PAGE_MARGIN, dividerY, PAGE_WIDTH - PAGE_MARGIN, dividerY);

  const billToY = dividerY + 24;
  return { billToY, rightX, rightBoxWidth };
}

function drawBillToAndSummary(pdf, payload, layout) {
  const { type, invoiceNumber, financialYear, dueDate, customer, taxType } = payload;
  const { billToY, rightX, rightBoxWidth } = layout;
  const billWidth = rightX - PAGE_MARGIN - 24;
  let leftY = billToY;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text("BILL TO", PAGE_MARGIN, leftY);
  leftY += 18;

  const customerNameLines = splitLines(pdf, safeValue(customer?.name), billWidth, 16);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(15, 23, 42);
  pdf.text(customerNameLines, PAGE_MARGIN, leftY);
  leftY += customerNameLines.length * 18;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);

  const customerDetails = [
    safeValue(customer?.address),
    `Phone: ${safeValue(customer?.phone)}`,
    `Email: ${safeValue(customer?.email)}`,
    `Zip Code: ${safeValue(customer?.zipCode)}`,
    `Place of Supply: ${safeValue(customer?.placeOfSupply)}`,
    `GSTIN: ${safeValue(customer?.gstin)}`,
  ];

  customerDetails.forEach((line) => {
    const lines = splitLines(pdf, line, billWidth, 10);
    pdf.text(lines, PAGE_MARGIN, leftY);
    leftY += lines.length * 12;
  });

  const boxY = billToY;
  const boxHeight = 108;
  drawRoundedCard(pdf, rightX, boxY, rightBoxWidth, boxHeight, {
    fillColor: [238, 242, 255],
    strokeColor: [224, 231, 255],
  });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(67, 56, 202);
  pdf.text(type === "invoice" ? "TAX INVOICE" : "QUOTATION", rightX + 14, boxY + 20);

  pdf.setFontSize(18);
  pdf.setTextColor(15, 23, 42);
  pdf.text(invoiceNumber, rightX + 14, boxY + 46, { maxWidth: rightBoxWidth - 28 });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(51, 65, 85);
  let infoY = boxY + 68;
  if (financialYear) {
    pdf.text(`FY: ${financialYear}`, rightX + 14, infoY);
    infoY += 14;
  }
  pdf.text(`Due Date: ${formatDate(dueDate)}`, rightX + 14, infoY);
  infoY += 14;
  pdf.text(`Tax Mode: ${taxType === "igst" ? "IGST 18%" : "CGST 9% + SGST 9%"}`, rightX + 14, infoY);

  return Math.max(leftY, boxY + boxHeight);
}

function drawTableHeader(pdf, startY) {
  let x = PAGE_MARGIN;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(1);
  pdf.roundedRect(PAGE_MARGIN, startY, TABLE_COLUMNS.reduce((sum, column) => sum + column.width, 0), 28, 12, 12, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  TABLE_COLUMNS.forEach((column) => {
    pdf.text(column.label, x + 10, startY + 18);
    x += column.width;
  });
  return startY + 28;
}

function drawItemsTable(pdf, payload, startY) {
  let y = drawTableHeader(pdf, startY);
  const rowWidth = TABLE_COLUMNS.reduce((sum, column) => sum + column.width, 0);

  payload.items.forEach((item) => {
    const cells = {
      description: splitLines(pdf, safeValue(item.description), TABLE_COLUMNS[0].width - 18, 10),
      hsnCode: splitLines(pdf, safeValue(item.hsnCode), TABLE_COLUMNS[1].width - 18, 10),
      quantity: [String(item.quantity ?? 0)],
      rate: [formatPdfCurrency(item.rate)],
      total: [formatPdfCurrency(item.total)],
    };

    const contentHeights = Object.values(cells).map((lines) => Math.max(lines.length, 1) * 12);
    const rowHeight = Math.max(26, ...contentHeights) + 8;

    y = ensurePageSpace(pdf, y, rowHeight + 6, drawTableHeader.bind(null, pdf));

    let x = PAGE_MARGIN;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.8);
    pdf.rect(PAGE_MARGIN, y, rowWidth, rowHeight);

    TABLE_COLUMNS.forEach((column, index) => {
      if (index > 0) {
        pdf.line(x, y, x, y + rowHeight);
      }
      const valueLines = cells[column.key] ?? ["-"];
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      pdf.text(valueLines, x + 8, y + 16);
      x += column.width;
    });

    y += rowHeight;
  });

  return y;
}

function drawSummarySection(pdf, payload, startY) {
  const gap = 18;
  const rightWidth = 248;
  const leftWidth = PAGE_WIDTH - PAGE_MARGIN * 2 - rightWidth - gap;
  const leftX = PAGE_MARGIN;
  const rightX = leftX + leftWidth + gap;

  const wordsLines = splitLines(pdf, formatAmountInWordsEnglish(payload.totals.totalAmount), leftWidth - 24, 11);
  const termsLines = splitLines(pdf, safeValue(payload.terms), leftWidth - 24, 10);
  const leftHeight = Math.max(120, 24 + wordsLines.length * 14 + 26 + 18 + termsLines.length * 12 + 16);
  const totalsRows = payload.type === "invoice" ? 7 : 5;
  const rightHeight = totalsRows * 28 + 24;
  const sectionHeight = Math.max(leftHeight, rightHeight);
  const y = ensurePageSpace(pdf, startY, sectionHeight + 18);

  drawRoundedCard(pdf, leftX, y, leftWidth, leftHeight);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text("TOTAL IN WORDS", leftX + 14, y + 18);

  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text(wordsLines, leftX + 14, y + 36);

  const dividerY = y + 48 + wordsLines.length * 14;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(leftX + 14, dividerY, leftX + leftWidth - 14, dividerY);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text("TERMS & CONDITIONS", leftX + 14, dividerY + 18);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  pdf.text(termsLines, leftX + 14, dividerY + 36);

  drawRoundedCard(pdf, rightX, y, rightWidth, rightHeight, { fillColor: [248, 250, 252] });
  const rows = [
    ["Subtotal", formatPdfCurrency(payload.totals.subtotal)],
    ["CGST", formatPdfCurrency(payload.totals.cgst)],
    ["SGST", formatPdfCurrency(payload.totals.sgst)],
    ["IGST", formatPdfCurrency(payload.totals.igst)],
    ["Total", formatPdfCurrency(payload.totals.totalAmount)],
  ];
  if (payload.type === "invoice") {
    rows.push(["Payment Made", formatPdfCurrency(payload.totals.paymentMade)]);
    rows.push(["Balance Amount", formatPdfCurrency(payload.totals.balanceAmount)]);
  }

  let rowY = y + 12;
  rows.forEach(([label, value], index) => {
    if (index > 0) {
      pdf.setDrawColor(226, 232, 240);
      pdf.line(rightX, rowY - 8, rightX + rightWidth, rowY - 8);
    }
    const isHighlight = label === "Total" || label === "Balance Amount";
    pdf.setFont("helvetica", isHighlight ? "bold" : "normal");
    pdf.setFontSize(isHighlight ? 11 : 10);
    pdf.setTextColor(label === "Balance Amount" ? 67 : 51, label === "Balance Amount" ? 56 : 65, label === "Balance Amount" ? 202 : 85);
    pdf.text(label, rightX + 14, rowY + 8);
    pdf.text(value, rightX + rightWidth - 14, rowY + 8, { align: "right" });
    rowY += 28;
  });

  return y + sectionHeight;
}

function drawNotesSection(pdf, payload, startY) {
  const gap = 18;
  const boxWidth = (PAGE_WIDTH - PAGE_MARGIN * 2 - gap) / 2;
  const lines = splitLines(pdf, safeValue(payload.notes), boxWidth - 24, 10);
  const boxHeight = Math.max(96, 32 + lines.length * 12);
  const y = ensurePageSpace(pdf, startY, boxHeight + 12);

  drawRoundedCard(pdf, PAGE_MARGIN, y, boxWidth, boxHeight);
  drawRoundedCard(pdf, PAGE_MARGIN + boxWidth + gap, y, boxWidth, boxHeight, { fillColor: [248, 250, 252] });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text("NOTES", PAGE_MARGIN + 14, y + 18);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  pdf.text(lines, PAGE_MARGIN + 14, y + 36);

  return y + boxHeight;
}

export function downloadPdfBlob(blob, filename) {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

export function generatePdfBlob(payload, filename) {
  const pdf = createPdf();
  const enrichedPayload = {
    ...payload,
    logoDataUrl: payload.company?.logoBase64 || payload.company?.logoUrl || "",
  };

  const headerLayout = drawHeader(pdf, enrichedPayload);
  let y = drawBillToAndSummary(pdf, enrichedPayload, headerLayout);
  y = drawItemsTable(pdf, enrichedPayload, y + 18);
  y = drawSummarySection(pdf, enrichedPayload, y + 18);
  drawNotesSection(pdf, enrichedPayload, y + 18);
  drawFooter(pdf);

  return pdf.output("blob");
}







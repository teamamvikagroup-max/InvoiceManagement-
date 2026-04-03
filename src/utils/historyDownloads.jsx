import dayjs from "dayjs";
import { renderToStaticMarkup } from "react-dom/server";
import PdfDocument from "../components/PdfDocument";
import { generatePdfBlob } from "./pdf";

function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function createPdfContainer(record, type) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-200vw";
  container.style.top = "0";
  container.style.opacity = "0";
  container.innerHTML = renderToStaticMarkup(
    <PdfDocument
      type={type}
      invoiceNumber={record.invoiceNumber}
      dueDate={record.dueDate}
      company={record.companySnapshot}
      customer={record.customer}
      items={record.items ?? []}
      totals={{
        subtotal: Number(record.subtotal ?? 0),
        cgst: Number(record.cgst ?? 0),
        sgst: Number(record.sgst ?? 0),
        igst: Number(record.igst ?? 0),
        totalAmount: Number(record.totalAmount ?? 0),
        paymentMade: Number(record.paymentMade ?? 0),
        balanceAmount: Number(record.balanceAmount ?? 0),
      }}
      notes={record.notes}
      terms={record.terms}
      taxType={record.taxType}
    />,
  );

  document.body.appendChild(container);
  return container;
}

export async function createHistoryPdfBlob(record, type) {
  const container = createPdfContainer(record, type);

  try {
    return await generatePdfBlob(container.firstElementChild ?? container, `${record.invoiceNumber}.pdf`);
  } finally {
    container.remove();
  }
}

export async function downloadHistoryPdf(record, type) {
  const pdfBlob = await createHistoryPdfBlob(record, type);
  downloadBlob(pdfBlob, `${record.invoiceNumber}.pdf`);
}

function buildZipFilename(type, label) {
  const safeLabel = label.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return `${type}s-${safeLabel || "records"}.zip`;
}

export async function downloadHistoryZip(records, type, label, onProgress) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    onProgress?.({ current: index + 1, total: records.length, record });
    const pdfBlob = await createHistoryPdfBlob(record, type);
    zip.file(`${record.invoiceNumber || `${type}-${index + 1}`}.pdf`, pdfBlob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipBlob, buildZipFilename(type, label));
}

export function buildRangeLabel(fromDate, toDate) {
  if (fromDate && toDate) {
    return `${dayjs(fromDate).format("DD-MMM-YYYY")}-to-${dayjs(toDate).format("DD-MMM-YYYY")}`;
  }

  if (fromDate) {
    return `from-${dayjs(fromDate).format("DD-MMM-YYYY")}`;
  }

  if (toDate) {
    return `until-${dayjs(toDate).format("DD-MMM-YYYY")}`;
  }

  return "all-records";
}
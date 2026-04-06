export function openPdfUrl(url) {
  if (!url) {
    throw new Error("PDF URL is not available for this record.");
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

export function downloadPdfUrl(url, filename) {
  if (!url) {
    throw new Error("PDF URL is not available for this record.");
  }

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.download = filename || "document.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function buildZipFilename(type, label) {
  const safeLabel = label.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return `${type}s-${safeLabel || "records"}.zip`;
}

export async function downloadHistoryZip(records, type, label, onProgress) {
  const validRecords = records.filter((record) => record.pdfUrl);
  if (!validRecords.length) {
    throw new Error("No PDF URLs are available for the selected records.");
  }

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  for (let index = 0; index < validRecords.length; index += 1) {
    const record = validRecords[index];
    onProgress?.({ current: index + 1, total: validRecords.length, record });
    const response = await fetch(record.pdfUrl);

    if (!response.ok) {
      throw new Error(`Unable to fetch ${record.invoiceNumber || `${type}-${index + 1}`}.pdf from Firebase Storage.`);
    }

    const pdfBlob = await response.blob();
    zip.file(`${record.invoiceNumber || `${type}-${index + 1}`}.pdf`, pdfBlob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const objectUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = buildZipFilename(type, label);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function buildRangeLabel(fromDate, toDate) {
  if (fromDate && toDate) {
    return `${fromDate}-to-${toDate}`;
  }

  if (fromDate) {
    return `from-${fromDate}`;
  }

  if (toDate) {
    return `until-${toDate}`;
  }

  return "all-records";
}
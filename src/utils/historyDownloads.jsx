export function openPdfUrl(url) {
  if (!url) {
    throw new Error("PDF URL is not available for this record.");
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

export async function downloadPdfUrl(url, filename) {
  if (!url) {
    throw new Error("PDF URL is not available for this record.");
  }

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`Unable to fetch PDF. Status: ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename || "document.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return;
  } catch (error) {
    console.warn("Falling back to direct PDF URL download", error);
  }

  const fallbackLink = document.createElement("a");
  fallbackLink.href = url;
  fallbackLink.target = "_blank";
  fallbackLink.rel = "noreferrer noopener";
  fallbackLink.download = filename || "document.pdf";
  document.body.appendChild(fallbackLink);
  fallbackLink.click();
  fallbackLink.remove();
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

  validRecords.forEach((record, index) => {
    onProgress?.({ current: index + 1, total: validRecords.length, record });
  });

  const response = await fetch("/api/history-zip", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type,
      label,
      records: validRecords.map((record) => ({
        invoiceNumber: record.invoiceNumber,
        pdfUrl: record.pdfUrl,
      })),
    }),
  });

  if (!response.ok) {
    let message = `Unable to download ${type} ZIP right now.`;
    try {
      const payload = await response.json();
      message = payload?.error || message;
    } catch {
      // ignore JSON parse failures and fall back to the default message
    }
    throw new Error(message);
  }

  const zipBlob = await response.blob();
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

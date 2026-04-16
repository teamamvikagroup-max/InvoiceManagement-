import JSZip from "jszip";

function sanitizeFilename(value, fallback) {
  const cleaned = String(value || fallback)
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || fallback;
}

function buildZipFilename(type, label) {
  const safeLabel = String(label || "records")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${type}s-${safeLabel || "records"}.zip`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const type = body?.type === "invoice" ? "invoice" : "quotation";
    const label = body?.label || "records";
    const records = Array.isArray(body?.records) ? body.records.filter((record) => record?.pdfUrl) : [];

    if (!records.length) {
      return res.status(400).json({ error: "No PDF URLs are available for the selected records." });
    }

    const zip = new JSZip();

    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const response = await fetch(record.pdfUrl);

      if (!response.ok) {
        return res.status(502).json({ error: `Unable to fetch ${record.invoiceNumber || `${type}-${index + 1}`}.pdf from Firebase Storage.` });
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileName = sanitizeFilename(record.invoiceNumber || `${type}-${index + 1}`, `${type}-${index + 1}`);
      zip.file(`${fileName}.pdf`, arrayBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${buildZipFilename(type, label)}"`);
    return res.status(200).send(zipBuffer);
  } catch (error) {
    console.error("History ZIP API failed", error);
    return res.status(500).json({ error: "Unable to generate ZIP right now." });
  }
}

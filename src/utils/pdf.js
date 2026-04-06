const FOOTER_TEXT = "\u00A9 2026 Amvika Group. All rights reserved.";

export async function generatePdfBlob(element, filename) {
  const { default: html2pdf } = await import("html2pdf.js");

  const worker = html2pdf()
    .set({
      filename,
      margin: [0.24, 0.2, 0.5, 0.2],
      image: { type: "png", quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
        compress: false,
      },
      pagebreak: {
        mode: ["css", "legacy"],
      },
    })
    .from(element)
    .toPdf();

  const pdf = await worker.get("pdf");
  const pageCount = pdf.internal.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    pdf.setPage(pageNumber);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(FOOTER_TEXT, pageWidth / 2, pageHeight - 0.22, { align: "center" });
    pdf.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - 0.2, pageHeight - 0.22, { align: "right" });
  }

  return pdf.output("blob");
}
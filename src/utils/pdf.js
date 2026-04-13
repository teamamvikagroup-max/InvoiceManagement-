import html2pdf from "html2pdf.js";

const FOOTER_TEXT = "© 2026 Amvika Group. All rights reserved.";
const LEGAL_TEXT = "This is a system-generated electronic invoice and does not require a physical signature.";

export async function generatePdfBlob(element, filename) {
  const worker = html2pdf()
    .set({
      filename,
      margin: [0.24, 0.2, 0.72, 0.2],
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
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(FOOTER_TEXT, pageWidth / 2, pageHeight - 0.34, { align: "center" });
    pdf.setFontSize(7.4);
    pdf.text(LEGAL_TEXT, pageWidth / 2, pageHeight - 0.2, { align: "center", maxWidth: pageWidth - 1.4 });
    pdf.setFontSize(8);
    pdf.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - 0.2, pageHeight - 0.34, { align: "right" });
  }

  return pdf.output("blob");
}
export async function generatePdfBlob(element, filename) {
  const { default: html2pdf } = await import("html2pdf.js");

  const worker = html2pdf()
    .set({
      filename,
      margin: 0.2,
      image: { type: "jpeg", quality: 0.82 },
      html2canvas: {
        scale: 1,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
        compress: true,
      },
      pagebreak: {
        mode: ["css", "legacy"],
      },
    })
    .from(element)
    .toPdf();

  return worker.output("blob");
}
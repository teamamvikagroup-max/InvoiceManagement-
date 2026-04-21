import html2pdf from "html2pdf.js";

const FOOTER_TEXT = "\u00A9 2026 Amvika Group. All rights reserved.";
const LEGAL_TEXT = "This is a system-generated electronic invoice and does not require a physical signature.";

function createExportClone(element) {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-pdf-export-clone", "true");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.style.opacity = "1";
  wrapper.style.pointerEvents = "none";
  wrapper.style.zIndex = "-1";
  wrapper.style.background = "#ffffff";

  const clone = element.cloneNode(true);
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  return { wrapper, clone };
}

async function waitForCloneImages(container) {
  const images = Array.from(container.querySelectorAll("img"));
  if (!images.length) {
    return;
  }

  await Promise.all(
    images.map(
      (image) =>
        new Promise((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          let timer = null;

          const cleanup = () => {
            if (timer) {
              window.clearTimeout(timer);
            }
            image.removeEventListener("load", handleDone);
            image.removeEventListener("error", handleDone);
          };

          const handleDone = () => {
            cleanup();
            resolve();
          };

          timer = window.setTimeout(handleDone, 1200);
          image.addEventListener("load", handleDone, { once: true });
          image.addEventListener("error", handleDone, { once: true });
        }),
    ),
  );
}

async function imageToDataUrl(url) {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) {
    throw new Error("Unable to load logo image for PDF.");
  }

  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result || "");
    reader.onerror = () => reject(new Error("Unable to convert logo image for PDF."));
    reader.readAsDataURL(blob);
  });
}

async function getLogoForPdf(element, container) {
  const explicitLogoSrc = element?.dataset?.pdfLogoSrc || "";
  if (explicitLogoSrc) {
    if (explicitLogoSrc.startsWith("data:image/")) {
      return explicitLogoSrc;
    }

    try {
      return await imageToDataUrl(explicitLogoSrc);
    } catch (error) {
      console.warn("[PDF Export] explicit logo extraction failed", error);
    }
  }

  const logoImage = container.querySelector("img");
  if (!logoImage?.src) {
    return null;
  }

  if (logoImage.src.startsWith("data:image/")) {
    return logoImage.src;
  }

  try {
    return await imageToDataUrl(logoImage.src);
  } catch (error) {
    console.warn("[PDF Export] direct logo extraction failed", error);
    return null;
  }
}

function getImageFormat(dataUrl) {
  if (dataUrl?.startsWith("data:image/jpeg") || dataUrl?.startsWith("data:image/jpg")) {
    return "JPEG";
  }
  return "PNG";
}

async function getImageDimensions(dataUrl) {
  return await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
    image.onerror = () => reject(new Error("Unable to measure logo image for PDF."));
    image.src = dataUrl;
  });
}

async function addLogoToPdf(pdf, logoDataUrl) {
  if (!logoDataUrl) {
    return;
  }

  const pageWidth = pdf.internal.pageSize.getWidth();
  const frameX = pageWidth - 1.98;
  const frameY = 0.38;
  const frameWidth = 1.42;
  const frameHeight = 0.98;
  const padding = 0.10;

  try {
    const { width, height } = await getImageDimensions(logoDataUrl);
    const usableWidth = frameWidth - padding * 2;
    const usableHeight = frameHeight - padding * 2;
    const imageRatio = width / height;
    const frameRatio = usableWidth / usableHeight;

    let renderWidth = usableWidth;
    let renderHeight = usableHeight;

    if (imageRatio > frameRatio) {
      renderHeight = usableWidth / imageRatio;
    } else {
      renderWidth = usableHeight * imageRatio;
    }

    const renderX = frameX + (frameWidth - renderWidth) / 2;
    const renderY = frameY + (frameHeight - renderHeight) / 2;

    pdf.setPage(1);
    pdf.addImage(logoDataUrl, getImageFormat(logoDataUrl), renderX, renderY, renderWidth, renderHeight, undefined, "FAST");
  } catch (error) {
    console.warn("[PDF Export] direct logo placement failed", error);
  }
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

export async function generatePdfBlob(element, filename) {
  const { wrapper, clone } = createExportClone(element);

  try {
    await waitForCloneImages(clone);
    const logoDataUrl = await getLogoForPdf(element, clone);

    const worker = html2pdf()
      .set({
        filename,
        margin: [0.24, 0.2, 0.9, 0.2],
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: {
          scale: 1.35,
          useCORS: true,
          allowTaint: false,
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
      .from(clone)
      .toPdf();

    const pdf = await worker.get("pdf");
    await addLogoToPdf(pdf, logoDataUrl);

    const pageCount = pdf.internal.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      pdf.setPage(pageNumber);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(FOOTER_TEXT, pageWidth / 2, pageHeight - 0.48, { align: "center" });
      pdf.setFontSize(7.3);
      pdf.text(LEGAL_TEXT, pageWidth / 2, pageHeight - 0.3, { align: "center", maxWidth: pageWidth - 1.5 });
      pdf.setFontSize(8);
      pdf.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - 0.2, pageHeight - 0.48, { align: "right" });
    }

    return pdf.output("blob");
  } finally {
    wrapper.remove();
  }
}

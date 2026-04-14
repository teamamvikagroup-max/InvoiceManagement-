import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { hasStorageBucket } from "../firebase/config";
import {
  buildCompanySnapshot,
  peekNextDocumentNumber,
  reserveDocumentNumber,
  saveInvoiceRecord,
  uploadDocumentPdf,
} from "../firebase/services";
import { createEmptyItem, DEFAULT_NOTES, DEFAULT_TERMS, EMPTY_CUSTOMER, TAX_TYPES } from "../utils/constants";
import { calculateItemTotal, calculateTotals, formatCurrency } from "../utils/calculations";
import { generatePdfBlob } from "../utils/pdf";
import DocumentPreview from "./DocumentPreview";
import EmptyState from "./EmptyState";
import ItemsTable from "./ItemsTable";
import PdfDocument from "./PdfDocument";
import StatusAlert from "./StatusAlert";

async function imageUrlToDataUrl(url) {
  if (!url) {
    return "";
  }

  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) {
    throw new Error("Unable to load company logo for PDF rendering.");
  }

  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result || "");
    reader.onerror = () => reject(new Error("Unable to convert company logo for PDF rendering."));
    reader.readAsDataURL(blob);
  });
}

async function waitForImages(container) {
  if (!container) {
    return;
  }

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

          timer = window.setTimeout(() => {
            console.warn("[PDF Export] image wait timed out", image.currentSrc || image.src);
            handleDone();
          }, 2500);

          image.addEventListener("load", handleDone, { once: true });
          image.addEventListener("error", handleDone, { once: true });
        }),
    ),
  );
}
async function prepareCompanyForPdf(company) {
  if (!company) {
    return null;
  }

  console.info("[PDF Export] prepareCompanyForPdf", {
    companyName: company.name,
    logoUrl: company.logoUrl,
  });

  if (!company.logoUrl) {
    return { ...company, logoUrl: company.logoUrl };
  }

  try {
    const dataUrl = await imageUrlToDataUrl(company.logoUrl);
    return { ...company, logoUrl: dataUrl || company.logoUrl };
  } catch (error) {
    console.warn("[PDF Export] logo preload failed", error);
    return { ...company, logoUrl: company.logoUrl };
  }
}

function createInitialFormData() {
  return {
    companyId: "",
    dueDate: dayjs().add(7, "day").format("YYYY-MM-DD"),
    customer: { ...EMPTY_CUSTOMER },
    items: [createEmptyItem()],
    taxType: TAX_TYPES.CGST_SGST,
    paymentMade: 0,
    notes: DEFAULT_NOTES,
    terms: DEFAULT_TERMS,
  };
}

export default function DocumentForm({ type, companies }) {
  const pdfRenderRef = useRef(null);
  const [nextNumber, setNextNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [formData, setFormData] = useState(createInitialFormData);
  const [pdfCompany, setPdfCompany] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const value = await peekNextDocumentNumber(type);
        if (mounted) {
          setNextNumber(value);
        }
      } catch {
        if (mounted) {
          setStatus({ type: "error", message: "Unable to load the next document number." });
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [type]);

  const selectedCompany = companies.find((company) => company.id === formData.companyId || company.firebaseId === formData.companyId) ?? null;
  const preparedItems = useMemo(
    () => formData.items.map((item) => ({ ...item, quantity: Number(item.quantity), rate: Number(item.rate), total: calculateItemTotal(item) })),
    [formData.items],
  );
  const totals = useMemo(
    () => calculateTotals(preparedItems, formData.taxType, formData.paymentMade, type),
    [preparedItems, formData.taxType, formData.paymentMade, type],
  );

  const exportCompany = pdfCompany ?? selectedCompany;
  const exportLogoSrc = exportCompany?.logoBase64 || exportCompany?.logoUrl || "";

  const rootChange = (field, value) => setFormData((current) => ({ ...current, [field]: value }));
  const customerChange = (field, value) => setFormData((current) => ({ ...current, customer: { ...current.customer, [field]: value } }));

  const validate = () => {
    if (!formData.companyId) return "Please select a company profile.";
    if (!formData.dueDate) return "Please choose a due date.";
    if (!formData.customer.name.trim() || !formData.customer.address.trim()) return "Customer name and address are required.";
    if (!preparedItems.length || preparedItems.some((item) => !item.description.trim() || item.quantity <= 0 || item.rate <= 0 || item.total <= 0)) {
      return "Add at least one valid item with description, quantity, and amount greater than zero.";
    }
    if (totals.subtotal <= 0 || totals.totalAmount <= 0) return "Total amount must be greater than zero before generating the PDF.";
    if (type === "invoice" && totals.paymentMade < 0) return "Payment made cannot be negative.";
    if (type === "invoice" && totals.paymentMade > totals.totalAmount) return "Payment made cannot exceed the total amount.";
    if (!hasStorageBucket) return "Firebase Storage is required to save PDFs. Configure Storage and try again.";
    return null;
  };

  const resetForm = async () => {
    setFormData(createInitialFormData());
    setPdfCompany(null);
    setNextNumber(await peekNextDocumentNumber(type));
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus(null);
    const error = validate();
    if (error) return setStatus({ type: "error", message: error });
    if (!selectedCompany || !pdfRenderRef.current) return setStatus({ type: "error", message: "Company details or PDF preview are not ready yet." });

    setIsSaving(true);
    try {
      const preparedCompanyForPdf = await prepareCompanyForPdf(selectedCompany);
      setPdfCompany(preparedCompanyForPdf);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await waitForImages(pdfRenderRef.current);

      const invoiceNumber = await reserveDocumentNumber(type);
      const filename = `${invoiceNumber}.pdf`;

      console.info("[PDF Export] using template", {
        template: pdfRenderRef.current?.dataset?.pdfTemplate,
        type,
        invoiceNumber,
      });

      const pdfBlob = await generatePdfBlob(pdfRenderRef.current, filename);
      const { pdfUrl, pdfPath } = await uploadDocumentPdf(type, invoiceNumber, pdfBlob);

      await saveInvoiceRecord({
        invoiceNumber,
        type,
        companyId: selectedCompany.id,
        companySnapshot: buildCompanySnapshot(selectedCompany),
        customer: formData.customer,
        items: preparedItems,
        dueDate: formData.dueDate,
        subtotal: totals.subtotal,
        taxType: formData.taxType,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        totalAmount: totals.totalAmount,
        paymentMade: type === "invoice" ? totals.paymentMade : 0,
        balanceAmount: totals.balanceAmount,
        notes: formData.notes,
        terms: formData.terms,
        pdfUrl,
        pdfPath,
        pdfStatus: "uploaded",
      });

      setStatus({
        type: "success",
        message: `${type === "invoice" ? "Invoice" : "Quotation"} ${invoiceNumber} saved successfully. The PDF is now stored in Firebase Storage and available from history.`,
      });

      await resetForm();
    } catch (saveError) {
      console.error("Document save failed", saveError);
      setStatus({ type: "error", message: saveError?.message || "Unable to generate and save the document." });
    } finally {
      setIsSaving(false);
    }
  };

  if (!companies.length) {
    return <EmptyState title="Add a company before creating documents" description="Invoices and quotations pull branding and GST details from the company profile section. Create at least one company to continue." />;
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <form className="glass-card p-4 md:p-6" onSubmit={submit}>
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">{type === "invoice" ? "Invoice Builder" : "Quotation Builder"}</p><h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl lg:text-4xl">{type === "invoice" ? "Create a new invoice" : "Create a new quotation"}</h2></div><div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">Next number: <span className="font-semibold text-slate-900">{nextNumber || "Loading..."}</span></div></div>
          <div className="mt-6 space-y-8">
            {status ? <StatusAlert type={status.type} message={status.message} /> : null}
            <section><h3 className="section-title">Document Details</h3><div className="mt-4 grid gap-5 md:grid-cols-2"><div><label className="field-label">Select Company</label><select required value={formData.companyId} onChange={(event) => rootChange("companyId", event.target.value)} className="input-field"><option value="">Choose a company</option>{companies.map((company) => <option key={company.firebaseId ?? company.id} value={company.id}>{company.name}</option>)}</select></div><div><label className="field-label">Due Date</label><input required type="date" value={formData.dueDate} onChange={(event) => rootChange("dueDate", event.target.value)} className="input-field" /></div></div></section>
            <section><h3 className="section-title">Customer Details</h3><div className="mt-4 grid gap-5 md:grid-cols-2">{[["name","Customer Name","text",true],["phone","Phone","text",false],["email","Email","email",false],["zipCode","Zip Code","text",false],["placeOfSupply","Place of Supply","text",false],["gstin","GSTIN","text",false]].map(([field,label,inputType,required]) => <div key={field}><label className="field-label">{label}</label><input type={inputType} required={required} value={formData.customer[field]} onChange={(event) => customerChange(field, event.target.value)} className="input-field" /></div>)}<div className="md:col-span-2"><label className="field-label">Address</label><textarea required rows="3" value={formData.customer.address} onChange={(event) => customerChange("address", event.target.value)} className="input-field" /></div></div></section>
            <section><div className="flex items-center justify-between gap-4"><h3 className="section-title">Items</h3><p className="text-sm text-slate-500">Add as many line items as you need.</p></div><div className="mt-4"><ItemsTable items={formData.items} onChange={(items) => rootChange("items", items)} onAddItem={() => rootChange("items", [...formData.items, createEmptyItem()])} onRemoveItem={(index) => rootChange("items", formData.items.filter((_, itemIndex) => itemIndex !== index))} /></div></section>
            <section><h3 className="section-title">Tax & Payment</h3><div className="mt-4 grid gap-5 lg:grid-cols-[1fr_320px]"><div className="space-y-5"><div><label className="field-label">GST Type</label><select value={formData.taxType} onChange={(event) => rootChange("taxType", event.target.value)} className="input-field"><option value={TAX_TYPES.CGST_SGST}>CGST 9% + SGST 9%</option><option value={TAX_TYPES.IGST}>IGST 18%</option></select></div>{type === "invoice" ? <div><label className="field-label">Payment Made</label><input type="number" min="0" step="0.01" value={formData.paymentMade} onChange={(event) => rootChange("paymentMade", Number(event.target.value))} className="input-field" /></div> : null}<div><label className="field-label">Notes</label><textarea rows="4" value={formData.notes} onChange={(event) => rootChange("notes", event.target.value)} className="input-field" /></div><div><label className="field-label">Terms & Conditions</label><textarea rows="5" value={formData.terms} onChange={(event) => rootChange("terms", event.target.value)} className="input-field" /></div></div><div className="rounded-3xl bg-slate-950 p-6 text-white"><h4 className="text-lg font-semibold">Summary</h4><div className="mt-5 space-y-3 text-sm text-slate-200"><div className="flex justify-between gap-4"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div><div className="flex justify-between gap-4"><span>CGST</span><span>{formatCurrency(totals.cgst)}</span></div><div className="flex justify-between gap-4"><span>SGST</span><span>{formatCurrency(totals.sgst)}</span></div><div className="flex justify-between gap-4"><span>IGST</span><span>{formatCurrency(totals.igst)}</span></div><div className="flex justify-between gap-4 border-t border-white/10 pt-3 text-base font-semibold text-white"><span>Total Amount</span><span>{formatCurrency(totals.totalAmount)}</span></div>{type === "invoice" ? <><div className="flex justify-between gap-4"><span>Payment Made</span><span>{formatCurrency(totals.paymentMade)}</span></div><div className="flex justify-between gap-4 text-base font-semibold text-brand-200"><span>Balance Amount</span><span>{formatCurrency(totals.balanceAmount)}</span></div></> : null}</div><button type="submit" className="btn-primary mt-6 w-full" disabled={isSaving}>{isSaving ? `Uploading ${type === "invoice" ? "invoice" : "quotation"}...` : type === "invoice" ? "Generate Invoice PDF" : "Generate Quotation PDF"}</button></div></div></section>
          </div>
        </form>
        <div className="glass-card p-4 md:p-6"><div className="mb-4"><h3 className="text-lg font-semibold text-slate-900 md:text-xl">Live PDF Preview</h3><p className="mt-1 text-sm text-slate-600 md:text-base">The generated PDF will use this template and current form values.</p></div><div className="max-h-[calc(100vh-14rem)] overflow-auto rounded-3xl border border-slate-200 bg-slate-100 p-4"><div className="mx-auto w-fit"><DocumentPreview type={type} invoiceNumber={nextNumber || "Preview"} dueDate={formData.dueDate} company={selectedCompany} customer={formData.customer} items={preparedItems} totals={totals} notes={formData.notes} terms={formData.terms} taxType={formData.taxType} /></div></div></div>
      </div>
      <div className="pointer-events-none fixed -left-[200vw] top-0 opacity-0">
        <div ref={pdfRenderRef} data-pdf-template="PdfDocumentExportV3" data-pdf-logo-src={exportLogoSrc}>
          <PdfDocument
            type={type}
            invoiceNumber={nextNumber || "Preview"}
            dueDate={formData.dueDate}
            company={exportCompany}
            customer={formData.customer}
            items={preparedItems}
            totals={totals}
            notes={formData.notes}
            terms={formData.terms}
            taxType={formData.taxType}
          />
        </div>
      </div>
    </>
  );
}






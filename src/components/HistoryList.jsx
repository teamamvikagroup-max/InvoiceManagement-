import { useState } from "react";
import { formatCurrency } from "../utils/calculations";
import { formatDate, formatTimestamp } from "../utils/formatters";
import { downloadPdfUrl } from "../utils/historyDownloads";
import EmptyState from "./EmptyState";

const STALLED_UPLOAD_MS = 60000;

function HistoryAction({ type, record, uploadLooksStalled, isDownloading, onDownload }) {
  if (record.pdfUrl) {
    return (
      <div className="flex w-full flex-col gap-3 sm:flex-row xl:justify-end">
        <button type="button" onClick={onDownload} disabled={isDownloading} className="btn-primary w-full sm:w-auto">
          {isDownloading ? "Preparing..." : type === "invoice" ? "Download Invoice" : "Download Quotation"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 xl:items-end">
      <button type="button" disabled className="btn-secondary w-full cursor-not-allowed opacity-60 sm:w-auto">
        PDF unavailable
      </button>
      {uploadLooksStalled ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">Upload stalled. PDF URL is not available yet.</div> : record.pdfStatus === "uploading" ? <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">PDF uploading...</div> : <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">No PDF URL found for this record.</div>}
    </div>
  );
}

export default function HistoryList({ type, records, isLoading }) {
  const [downloadingId, setDownloadingId] = useState("");

  if (isLoading) return <div className="glass-card p-6"><p className="text-sm font-medium text-slate-600">Loading {type} history...</p></div>;
  if (!records.length) return <EmptyState title={`No ${type}s yet`} description={`Once you create a ${type}, it will appear here with its stored PDF link and saved totals.`} />;

  const handleDownload = async (record) => {
    try {
      setDownloadingId(record.id);
      downloadPdfUrl(record.pdfUrl, `${record.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Unable to download PDF from history record", error);
      window.alert("Unable to download the PDF right now. Please try again.");
    } finally {
      setDownloadingId("");
    }
  };

  return (
    <div className="grid gap-4">
      {records.map((record) => {
        const uploadLooksStalled = record.pdfStatus === "uploading" && record.createdAt && Date.now() - record.createdAt > STALLED_UPLOAD_MS;

        return (
          <article key={record.id} className="glass-card p-4 md:p-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-center">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 xl:gap-6">
                <div className="rounded-2xl bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{type === "invoice" ? "Invoice No." : "Quotation No."}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{record.invoiceNumber}</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Customer</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{record.customer?.name || "-"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Company</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{record.companySnapshot?.name || "-"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Created</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{formatTimestamp(record.createdAt)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Due Date</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(record.dueDate)}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 md:p-5 xl:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Amount</p>
                <p className="mt-2 text-2xl font-semibold text-brand-700">{formatCurrency(record.totalAmount)}</p>
                <div className="mt-4 flex xl:justify-end">
                  <HistoryAction
                    type={type}
                    record={record}
                    uploadLooksStalled={uploadLooksStalled}
                    isDownloading={downloadingId === record.id}
                    onDownload={() => handleDownload(record)}
                  />
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
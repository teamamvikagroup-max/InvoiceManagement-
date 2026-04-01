import { formatCurrency } from "../utils/calculations";
import { formatDate, formatTimestamp } from "../utils/formatters";
import EmptyState from "./EmptyState";

const STALLED_UPLOAD_MS = 60000;

export default function HistoryList({ type, records, isLoading }) {
  if (isLoading) return <div className="glass-card p-8"><p className="text-sm font-medium text-slate-600">Loading {type} history...</p></div>;
  if (!records.length) return <EmptyState title={`No ${type}s yet`} description={`Once you create a ${type}, it will appear here with its stored PDF link and saved totals.`} />;
  return (
    <div className="grid gap-4">
      {records.map((record) => {
        const uploadLooksStalled = record.pdfStatus === "uploading" && record.createdAt && Date.now() - record.createdAt > STALLED_UPLOAD_MS;

        return (
          <div key={record.id} className="glass-card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 xl:gap-8">
                <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{type === "invoice" ? "Invoice No." : "Quotation No."}</p><p className="mt-2 text-base font-semibold text-slate-900">{record.invoiceNumber}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Customer</p><p className="mt-2 text-base font-semibold text-slate-900">{record.customer?.name || "-"}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Company</p><p className="mt-2 text-base font-semibold text-slate-900">{record.companySnapshot?.name || "-"}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Created</p><p className="mt-2 text-base font-semibold text-slate-900">{formatTimestamp(record.createdAt)}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Due Date</p><p className="mt-2 text-base font-semibold text-slate-900">{formatDate(record.dueDate)}</p></div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="text-right"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Amount</p><p className="mt-2 text-xl font-semibold text-brand-700">{formatCurrency(record.totalAmount)}</p></div>{record.pdfUrl ? <a href={record.pdfUrl} target="_blank" rel="noreferrer" className="btn-primary">Open PDF</a> : uploadLooksStalled ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">Upload stalled. Use local PDF copy.</div> : record.pdfStatus === "uploading" ? <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">PDF uploading...</div> : <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">Local download only</div>}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
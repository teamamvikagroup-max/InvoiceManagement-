import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import HistoryList from "../components/HistoryList";
import StatusAlert from "../components/StatusAlert";
import { firebaseDatabaseUrl } from "../firebase/config";
import { subscribeToDocuments } from "../firebase/services";
import { buildRangeLabel, downloadHistoryZip } from "../utils/historyDownloads";

const LOAD_TIMEOUT_MS = 8000;

function buildRealtimeDbTimeoutMessage(type) {
  const configuredUrl = firebaseDatabaseUrl || "missing";
  return `${type === "invoice" ? "Invoice" : "Quotation"} history is taking too long to load. Check that Firebase Realtime Database is created, your rules allow read access, and VITE_FIREBASE_DATABASE_URL matches the exact Database URL from Firebase Console. Current value: ${configuredUrl}`;
}

function isWithinSelectedRange(record, fromDate, toDate) {
  const recordDate = dayjs(Number(record.createdAt ?? 0));
  if (!recordDate.isValid()) {
    return false;
  }

  if (fromDate && recordDate.isBefore(dayjs(fromDate), "day")) {
    return false;
  }

  if (toDate && recordDate.isAfter(dayjs(toDate), "day")) {
    return false;
  }

  return true;
}

export default function HistoryPage({ type }) {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [isDownloadingRange, setIsDownloadingRange] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setError((current) => current || buildRealtimeDbTimeoutMessage(type));
      setIsLoading(false);
    }, LOAD_TIMEOUT_MS);

    const unsubscribe = subscribeToDocuments(
      type,
      (data) => {
        window.clearTimeout(timer);
        setRecords(data);
        setError("");
        setIsLoading(false);
      },
      (loadError) => {
        window.clearTimeout(timer);
        setError(loadError.message || "Unable to load document history.");
        setIsLoading(false);
      },
    );

    return () => {
      window.clearTimeout(timer);
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [type]);

  const filteredRecords = useMemo(() => records.filter((record) => isWithinSelectedRange(record, fromDate, toDate)), [records, fromDate, toDate]);
  const downloadableRangeRecords = useMemo(() => filteredRecords.filter((record) => record.pdfUrl), [filteredRecords]);
  const downloadableAllRecords = useMemo(() => records.filter((record) => record.pdfUrl), [records]);

  const rangeError = useMemo(() => {
    if (fromDate && toDate && dayjs(fromDate).isAfter(dayjs(toDate), "day")) {
      return "From date cannot be later than To date.";
    }

    return "";
  }, [fromDate, toDate]);

  const handleZipDownload = async (recordsToDownload, mode) => {
    if (!recordsToDownload.length) {
      setDownloadStatus({ type: "error", message: `No ${type} PDFs with Firebase Storage URLs are available for this download.` });
      return;
    }

    if (rangeError) {
      setDownloadStatus({ type: "error", message: rangeError });
      return;
    }

    const setLoading = mode === "range" ? setIsDownloadingRange : setIsDownloadingAll;
    const label = mode === "range" ? buildRangeLabel(fromDate, toDate) : "all-records";

    try {
      setLoading(true);
      setDownloadStatus({ type: "info", message: `Preparing ${recordsToDownload.length} ${type} PDF${recordsToDownload.length > 1 ? "s" : ""} for ZIP download...` });
      await downloadHistoryZip(recordsToDownload, type, label, ({ current, total }) => {
        setDownloadStatus({ type: "info", message: `Preparing ZIP ${current} of ${total}...` });
      });
      setDownloadStatus({ type: "success", message: `${type === "invoice" ? "Invoice" : "Quotation"} ZIP download is ready.` });
    } catch (downloadError) {
      console.error("ZIP download failed", downloadError);
      setDownloadStatus({ type: "error", message: `Unable to download ${type} ZIP right now. Please try again.` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-card p-4 md:p-6"><p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">{type === "invoice" ? "Invoice History" : "Quotation History"}</p><h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl lg:text-4xl">{type === "invoice" ? "All saved invoices in one real-time feed." : "All saved quotations, ready to reopen."}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">Review customer records, due dates, company names, total amounts, and jump straight to the stored PDF.</p></section>

      <section className="glass-card p-4 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">Download Center</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 md:text-2xl">Download by date range or export everything.</h3>
            <p className="mt-2 text-sm text-slate-600 md:text-base">Select a start and end date to export only the matching {type}s, or download the full history in one ZIP.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredRecords.length}</span> of <span className="font-semibold text-slate-900">{records.length}</span> {type}s
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] lg:items-end">
          <div>
            <label className="field-label">From Date</label>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="input-field" />
          </div>
          <div>
            <label className="field-label">To Date</label>
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="input-field" />
          </div>
          <button type="button" className="btn-secondary w-full lg:w-auto" onClick={() => { setFromDate(""); setToDate(""); setDownloadStatus(null); }}>
            Clear Filter
          </button>
          <button type="button" className="btn-primary w-full lg:w-auto" onClick={() => handleZipDownload(downloadableRangeRecords, "range")} disabled={isDownloadingRange || isDownloadingAll || !downloadableRangeRecords.length}>
            {isDownloadingRange ? "Preparing ZIP..." : "Download Range ZIP"}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Need everything at once? Export the full {type} history in one ZIP file.</p>
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => handleZipDownload(downloadableAllRecords, "all")} disabled={isDownloadingRange || isDownloadingAll || !downloadableAllRecords.length}>
            {isDownloadingAll ? "Preparing All..." : "Download All ZIP"}
          </button>
        </div>
      </section>

      {error ? <StatusAlert type="error" message={error} /> : null}
      {rangeError ? <StatusAlert type="error" message={rangeError} /> : null}
      {downloadStatus ? <StatusAlert type={downloadStatus.type} message={downloadStatus.message} /> : null}
      <HistoryList type={type} records={filteredRecords} isLoading={isLoading} />
    </div>
  );
}
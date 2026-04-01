import { useEffect, useState } from "react";
import HistoryList from "../components/HistoryList";
import StatusAlert from "../components/StatusAlert";
import { firebaseDatabaseUrl } from "../firebase/config";
import { subscribeToDocuments } from "../firebase/services";

const LOAD_TIMEOUT_MS = 8000;

function buildRealtimeDbTimeoutMessage(type) {
  const configuredUrl = firebaseDatabaseUrl || "missing";
  return `${type === "invoice" ? "Invoice" : "Quotation"} history is taking too long to load. Check that Firebase Realtime Database is created, your rules allow read access, and VITE_FIREBASE_DATABASE_URL matches the exact Database URL from Firebase Console. Current value: ${configuredUrl}`;
}

export default function HistoryPage({ type }) {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="space-y-6">
      <section className="glass-card p-4 md:p-6"><p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">{type === "invoice" ? "Invoice History" : "Quotation History"}</p><h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl lg:text-4xl">{type === "invoice" ? "All saved invoices in one real-time feed." : "All saved quotations, ready to reopen."}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">Review customer records, due dates, company names, total amounts, and jump straight to the stored PDF.</p></section>
      {error ? <StatusAlert type="error" message={error} /> : null}
      <HistoryList type={type} records={records} isLoading={isLoading} />
    </div>
  );
}
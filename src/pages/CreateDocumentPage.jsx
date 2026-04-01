import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DocumentForm from "../components/DocumentForm";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusAlert from "../components/StatusAlert";
import { firebaseDatabaseUrl } from "../firebase/config";
import { subscribeToCompanies } from "../firebase/services";

const LOAD_TIMEOUT_MS = 8000;

function buildRealtimeDbTimeoutMessage() {
  const configuredUrl = firebaseDatabaseUrl || "missing";
  return `Company profiles are taking too long to load. Check that Firebase Realtime Database is created, your rules allow read access, and VITE_FIREBASE_DATABASE_URL matches the exact Database URL from Firebase Console. Current value: ${configuredUrl}`;
}

export default function CreateDocumentPage({ type }) {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setError((current) => current || buildRealtimeDbTimeoutMessage());
      setIsLoading(false);
    }, LOAD_TIMEOUT_MS);

    const unsubscribe = subscribeToCompanies(
      (data) => {
        window.clearTimeout(timer);
        setCompanies(data);
        setError("");
        setIsLoading(false);
      },
      (loadError) => {
        window.clearTimeout(timer);
        setError(loadError.message || "Unable to load companies.");
        setIsLoading(false);
      },
    );

    return () => {
      window.clearTimeout(timer);
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const title = type === "invoice" ? "Create Invoice" : "Create Quotation";
  return (
    <div className="space-y-6">
      <section className="glass-card p-4 md:p-6"><p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">{title}</p><h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl lg:text-4xl">{type === "invoice" ? "Generate polished invoices in minutes." : "Create professional quotations with the same flow."}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">Select a company, enter customer details, add line items, calculate GST automatically, and save the final PDF directly to Firebase Storage.</p></section>
      {error ? <StatusAlert type="error" message={error} /> : null}
      {isLoading ? <div className="glass-card p-6"><LoadingSpinner label="Loading company profiles..." /></div> : companies.length ? <DocumentForm type={type} companies={companies} /> : <EmptyState title="Create a company first" description="Documents need a company profile for logo, GSTIN, contact details, and address." action={<Link to="/company-profile" className="btn-primary">Open Company Profile</Link>} />}
    </div>
  );
}
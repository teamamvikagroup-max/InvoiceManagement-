import { useEffect, useState } from "react";
import CompanyFormModal from "../components/CompanyFormModal";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusAlert from "../components/StatusAlert";
import { firebaseDatabaseUrl } from "../firebase/config";
import { createCompany, deleteCompany, deleteStorageFile, subscribeToCompanies, updateCompany, uploadCompanyLogo } from "../firebase/services";
import { formatWebsite } from "../utils/formatters";

const LOAD_TIMEOUT_MS = 8000;

function buildRealtimeDbTimeoutMessage() {
  const configuredUrl = firebaseDatabaseUrl || "missing";
  return `Company profiles are taking too long to load. Check that Firebase Realtime Database is created, your rules allow read access, and VITE_FIREBASE_DATABASE_URL matches the exact Database URL from Firebase Console. Current value: ${configuredUrl}`;
}

function getCompanyErrorMessage(error, hasLogoFile = false) {
  const code = error?.code ?? "";
  const message = error?.message ?? "";

  if (code.toLowerCase().includes("permission") || message.toLowerCase().includes("permission")) {
    return "Firebase permissions are blocking this action. Check Realtime Database and Storage rules in Firebase Console, then try again.";
  }

  if (code.includes("storage/unauthorized") || code.includes("storage/unauthenticated")) {
    return "Firebase Storage permissions are blocking logo upload. Allow Storage reads/writes for development and try again.";
  }

  if (code.includes("storage/bucket-not-found") || message.includes("No default bucket found")) {
    return "Firebase Storage is not fully set up for this project. Enable Storage in Firebase Console and verify VITE_FIREBASE_STORAGE_BUCKET in your .env file.";
  }

  if (hasLogoFile && message.toLowerCase().includes("logo")) {
    return message;
  }

  if (message.includes("Realtime Database")) {
    return message;
  }

  return message || "Unable to save company details.";
}

export default function CompanyProfilePage() {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStatus((current) => current || { type: "error", message: buildRealtimeDbTimeoutMessage() });
      setIsLoading(false);
    }, LOAD_TIMEOUT_MS);

    const unsubscribe = subscribeToCompanies(
      (data) => {
        window.clearTimeout(timer);
        setCompanies(Array.isArray(data) ? data : []);
        setIsLoading(false);
      },
      (error) => {
        window.clearTimeout(timer);
        setStatus({ type: "error", message: getCompanyErrorMessage(error) });
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

  const openCreate = () => {
    setSelectedCompany(null);
    setIsModalOpen(true);
  };

  const submit = async (values, logoFile) => {
    setIsSubmitting(true);
    setStatus(null);

    const activeCompany = selectedCompany;
    let uploadedLogoPath = "";

    try {
      if (activeCompany) {
        let nextPayload = {
          ...values,
          logoUrl: activeCompany.logoUrl ?? activeCompany.logoBase64 ?? "",
          logoPath: activeCompany.logoPath ?? "",
        };

        if (logoFile) {
          const uploadedLogo = await uploadCompanyLogo(activeCompany.firebaseId ?? activeCompany.id, logoFile);
          uploadedLogoPath = uploadedLogo.logoPath ?? "";
          nextPayload = {
            ...nextPayload,
            logoUrl: uploadedLogo.logoUrl ?? nextPayload.logoUrl,
            logoPath: uploadedLogo.logoPath ?? nextPayload.logoPath,
          };
        }

        await updateCompany(activeCompany.firebaseId ?? activeCompany.id, nextPayload);

        setCompanies((current) =>
          current.map((company) =>
            (company.firebaseId ?? company.id) === (activeCompany.firebaseId ?? activeCompany.id)
              ? {
                  ...company,
                  ...nextPayload,
                  updatedAt: Date.now(),
                }
              : company,
          ),
        );

        if (logoFile && activeCompany.logoPath && activeCompany.logoPath !== nextPayload.logoPath) {
          void deleteStorageFile(activeCompany.logoPath);
        }
      } else {
        const createdCompany = await createCompany({
          ...values,
          logoUrl: "",
          logoPath: "",
        });

        let nextCompany = {
          firebaseId: createdCompany.firebaseId,
          id: createdCompany.id,
          ...values,
          logoUrl: "",
          logoPath: "",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        if (logoFile) {
          const uploadedLogo = await uploadCompanyLogo(createdCompany.firebaseId, logoFile);
          uploadedLogoPath = uploadedLogo.logoPath ?? "";
          await updateCompany(createdCompany.firebaseId, {
            ...values,
            logoUrl: uploadedLogo.logoUrl ?? "",
            logoPath: uploadedLogo.logoPath ?? "",
          });

          nextCompany = {
            ...nextCompany,
            logoUrl: uploadedLogo.logoUrl ?? "",
            logoPath: uploadedLogo.logoPath ?? "",
          };
        }

        setCompanies((current) => [nextCompany, ...current]);
      }

      setStatus({ type: "success", message: activeCompany ? "Company updated successfully." : "Company created successfully." });
      setIsModalOpen(false);
      setSelectedCompany(null);
    } catch (error) {
      console.error("Company save failed", {
        error,
        companyId: activeCompany?.firebaseId ?? activeCompany?.id ?? "new-company",
        companyName: values.name,
        hasLogoFile: Boolean(logoFile),
        uploadedLogoPath,
      });

      if (uploadedLogoPath) {
        void deleteStorageFile(uploadedLogoPath);
      }

      setStatus({ type: "error", message: getCompanyErrorMessage(error, Boolean(logoFile)) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (company) => {
    if (!window.confirm(`Delete ${company.name}? This action cannot be undone.`)) return;
    try {
      await deleteCompany(company);
      setCompanies((current) => current.filter((item) => (item.firebaseId ?? item.id) !== (company.firebaseId ?? company.id)));
      setStatus({ type: "success", message: "Company deleted successfully." });
    } catch (error) {
      console.error("Company delete failed", error);
      setStatus({ type: "error", message: getCompanyErrorMessage(error) });
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-card p-4 md:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">Company Profile</p><h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl lg:text-4xl">Manage every company identity in one place.</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">Add logos, GSTIN, contact details, and websites for each company. These profiles power invoice and quotation generation throughout the app.</p></div><button type="button" className="btn-primary" onClick={openCreate}>Add Company</button></div>{status ? <div className="mt-6"><StatusAlert type={status.type} message={status.message} /></div> : null}</section>
      <section>{isLoading ? <div className="glass-card p-6"><LoadingSpinner label="Loading company profiles..." /></div> : companies.length ? <div className="grid gap-5 xl:grid-cols-2">{companies.map((company) => <article key={company.firebaseId ?? company.id} className="glass-card p-4 md:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-slate-100">{company.logoUrl || company.logoBase64 ? <img src={company.logoUrl || company.logoBase64} alt={company.name} className="h-full w-full rounded-3xl object-cover" /> : <span className="text-2xl font-semibold text-slate-500">{company.name?.[0] || "C"}</span>}</div><div><h3 className="text-xl font-semibold text-slate-900">{company.name || "Untitled Company"}</h3><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600 md:text-base">{company.address || "-"}</p></div></div><div className="flex gap-3"><button type="button" className="btn-secondary px-4 py-2" onClick={() => { setSelectedCompany(company); setIsModalOpen(true); }}>Edit</button><button type="button" className="btn-danger" onClick={() => remove(company)}>Delete</button></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">GSTIN</p><p className="mt-2 text-sm font-medium text-slate-800 md:text-base">{company.gstin || "-"}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Phone</p><p className="mt-2 text-sm font-medium text-slate-800 md:text-base">{company.phone || "-"}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</p><p className="mt-2 text-sm font-medium text-slate-800 md:text-base">{company.email || "-"}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Website</p>{company.website ? <a href={formatWebsite(company.website)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline md:text-base">{company.website}</a> : <p className="mt-2 text-sm font-medium text-slate-800 md:text-base">-</p>}</div></div></article>)}</div> : <EmptyState title="No companies yet" description="Create your first company profile to unlock invoices, quotations, and branded PDF generation." action={<button type="button" className="btn-primary" onClick={openCreate}>Add Your First Company</button>} />}</section>
      <CompanyFormModal isOpen={isModalOpen} company={selectedCompany} onClose={() => { setIsModalOpen(false); setSelectedCompany(null); }} onSubmit={submit} isSubmitting={isSubmitting} />
    </div>
  );
}
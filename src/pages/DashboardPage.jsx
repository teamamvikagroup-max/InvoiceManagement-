import DashboardCard from "../components/DashboardCard";
import { DASHBOARD_LINKS } from "../utils/constants";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="glass-card p-4 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">Dashboard</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl lg:text-4xl">Everything needed to run billing in one place.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">Create invoices and quotations with the same workflow, manage multiple companies, keep GST-ready calculations consistent, and open PDFs directly from real-time history.</p>
          </div>
          <div className="rounded-3xl bg-brand-50 px-4 py-3 text-sm text-brand-800 md:px-5 md:py-4"><p className="font-semibold">Quick start</p><p className="mt-1">Begin with Company Profile if this is your first time setting up the workspace.</p></div>
        </div>
      </section>
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{DASHBOARD_LINKS.map((link) => <DashboardCard key={link.path} {...link} />)}</section>
    </div>
  );
}
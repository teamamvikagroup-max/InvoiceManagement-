import { Link } from "react-router-dom";

export default function DashboardCard({ title, description, path }) {
  return (
    <Link to={path} className="group glass-card relative overflow-hidden p-4 md:p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-glow">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-cyan-400 to-emerald-400" />
      <p className="mb-4 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Workspace</p>
      <h2 className="text-lg font-semibold text-slate-900 transition group-hover:text-brand-700 md:text-xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">{description}</p>
      <div className="mt-6 text-sm font-semibold text-brand-700">Open section</div>
    </Link>
  );
}
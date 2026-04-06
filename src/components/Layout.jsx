import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Create Invoice", path: "/invoice/create" },
  { label: "Create Quotation", path: "/quotation/create" },
  { label: "Invoices", path: "/invoices" },
  { label: "Quotations", path: "/quotations" },
  { label: "Companies", path: "/company-profile" },
];

export default function Layout() {
  const { currentUser, logoutUser } = useAuth();

  return (
    <div className="min-h-screen w-full">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 md:py-6">
        <header className="glass-card mb-6 overflow-hidden">
          <div className="flex flex-col gap-4 bg-gradient-to-r from-slate-950 via-brand-900 to-slate-900 px-4 py-6 text-white md:px-6 md:py-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.24em] text-brand-200">Invoice & Quotation Management</p>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Amvika business documents, organized end to end.</h1>
              <p className="mt-3 max-w-xl text-sm text-slate-200 md:text-base">Manage companies, create branded invoices and quotations, generate PDFs, and keep every record synced to Firebase.</p>
            </div>
            <div className="flex flex-col gap-4 lg:items-end">
              <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100 backdrop-blur md:px-5 md:py-4">
                <p className="font-semibold text-white">Production-ready workflow</p>
                <p className="mt-1 text-slate-200">Multi-company support, GST calculations, PDF history.</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100 backdrop-blur">
                <div>
                  <p className="font-medium text-white">{currentUser?.displayName || currentUser?.email || currentUser?.phoneNumber || "Signed in"}</p>
                  <p className="text-xs text-slate-200">{currentUser?.email || currentUser?.phoneNumber || "Authenticated session"}</p>
                </div>
                <button type="button" className="rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10" onClick={() => logoutUser()}>
                  Logout
                </button>
              </div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-3 px-4 py-4 sm:px-6">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) => ["rounded-2xl px-4 py-2 text-sm font-medium transition", isActive ? "bg-brand-600 text-white shadow-lg shadow-brand-200" : "bg-white text-slate-600 hover:bg-brand-50 hover:text-brand-700"].join(" ")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="flex-1 w-full"><Outlet /></main>
      </div>
    </div>
  );
}
export default function StatusAlert({ type = "success", message }) {
  const tone = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-brand-200 bg-brand-50 text-brand-700",
  };
  return <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${tone[type] ?? tone.info}`}>{message}</div>;
}

import { formatCurrency } from "../utils/calculations";
import { formatAmountInWordsEnglish, formatAmountInWordsHindi, formatDate, formatWebsite } from "../utils/formatters";

export default function DocumentPreview({ type, invoiceNumber, dueDate, company, customer, items, totals, notes, terms, taxType }) {
  const englishAmountInWords = formatAmountInWordsEnglish(totals.totalAmount);
  const hindiAmountInWords = formatAmountInWordsHindi(totals.totalAmount);

  return (
    <div className="w-[794px] bg-white px-9 pb-14 pt-8 text-slate-900">
      <div className="flex items-start justify-between border-b border-slate-200 pb-7">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold">{company?.name || "Company Name"}</h1>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{company?.address || "-"}</p>
          <div className="mt-4 space-y-1 text-sm text-slate-600">
            <p>GSTIN: {company?.gstin || "-"}</p>
            <p>Phone: {company?.phone || "-"}</p>
            <p>Email: {company?.email || "-"}</p>
            <p>Website: {company?.website ? formatWebsite(company.website) : "-"}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {company?.logoUrl ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <img src={company.logoUrl} alt={company.name} className="h-16 w-16 object-contain" />
            </div>
          ) : null}
          <div className="min-w-[236px] rounded-[26px] border border-indigo-100 bg-gradient-to-b from-indigo-50 to-indigo-100/80 px-6 py-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">{type === "invoice" ? "Tax Invoice" : "Quotation"}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{invoiceNumber}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>Due Date: {formatDate(dueDate)}</p>
              <p>Tax Mode: {taxType === "igst" ? "IGST 18%" : "CGST 9% + SGST 9%"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bill To</p>
        <h2 className="mt-3 text-xl font-semibold">{customer.name || "-"}</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{customer.address || "-"}</p>
        <div className="mt-4 space-y-1 text-sm text-slate-600">
          <p>Phone: {customer.phone || "-"}</p>
          <p>Email: {customer.email || "-"}</p>
          <p>Zip Code: {customer.zipCode || "-"}</p>
          <p>Place of Supply: {customer.placeOfSupply || "-"}</p>
          <p>GSTIN: {customer.gstin || "-"}</p>
        </div>
      </div>

      <div className="mt-7 overflow-hidden rounded-3xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <th className="px-4 py-4">Description</th>
              <th className="px-4 py-4">HSN Code</th>
              <th className="w-20 px-4 py-4">Qty</th>
              <th className="w-28 px-4 py-4">Rate</th>
              <th className="w-32 px-4 py-4">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.itemId ?? `${item.description}-${item.hsnCode}`} className="text-sm text-slate-700">
                <td className="px-4 py-4">{item.description}</td>
                <td className="px-4 py-4">{item.hsnCode || "-"}</td>
                <td className="px-4 py-4">{item.quantity}</td>
                <td className="px-4 py-4">{formatCurrency(item.rate)}</td>
                <td className="px-4 py-4">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-7 flex justify-end">
        <div className="w-full max-w-[340px] overflow-hidden rounded-3xl border border-indigo-100 bg-slate-50">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm text-slate-600"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm text-slate-600"><span>CGST</span><span>{formatCurrency(totals.cgst)}</span></div>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm text-slate-600"><span>SGST</span><span>{formatCurrency(totals.sgst)}</span></div>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm text-slate-600"><span>IGST</span><span>{formatCurrency(totals.igst)}</span></div>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-base font-semibold text-slate-900"><span>Total</span><span>{formatCurrency(totals.totalAmount)}</span></div>
          {type === "invoice" ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm text-slate-600"><span>Payment Made</span><span>{formatCurrency(totals.paymentMade)}</span></div>
              <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-brand-700"><span>Balance Amount</span><span>{formatCurrency(totals.balanceAmount)}</span></div>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total In Words</p>
        <p className="mt-3 text-sm font-semibold text-slate-900">{englishAmountInWords}</p>
        <p className="mt-2 text-sm text-slate-600">{hindiAmountInWords}</p>
        <div className="mt-4 h-24 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Notes</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{notes || "-"}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Terms & Conditions</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{terms || "-"}</p>
        </div>
      </div>
    </div>
  );
}

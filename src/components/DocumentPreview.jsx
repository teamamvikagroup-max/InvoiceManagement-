import { formatCurrency } from "../utils/calculations";
import { formatAmountInWordsEnglish, formatAmountInWordsHindi, formatDate, formatWebsite } from "../utils/formatters";

function headingClass(value, baseClass, compactClass) {
  return `${value && value.length > 28 ? compactClass : baseClass} break-words`;
}

export default function DocumentPreview({ type, invoiceNumber, dueDate, company, customer, items, totals, notes, terms, taxType }) {
  const englishAmountInWords = formatAmountInWordsEnglish(totals.totalAmount);
  const hindiAmountInWords = formatAmountInWordsHindi(totals.totalAmount);
  const logoSrc = company?.logoUrl || company?.logoBase64 || "";

  return (
    <div className="w-[794px] bg-white px-9 pb-20 pt-8 font-['Noto_Sans','Noto_Sans_Devanagari','Segoe_UI_Symbol','Arial_Unicode_MS','Arial',sans-serif] text-slate-900">
      <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
        <div className="max-w-[450px] min-w-0">
          <h1 className={headingClass(company?.name, "text-3xl font-bold", "text-[1.65rem] font-bold")}>{company?.name || "Company Name"}</h1>
          <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{company?.address || "-"}</p>
          <div className="mt-4 space-y-1 break-words text-sm text-slate-600">
            <p>GSTIN: {company?.gstin || "-"}</p>
            <p>Phone: {company?.phone || "-"}</p>
            <p>Email: {company?.email || "-"}</p>
            <p>Website: {company?.website ? formatWebsite(company.website) : "-"}</p>
          </div>
        </div>

        <div className="flex w-[268px] flex-shrink-0 justify-end">
          <div className="flex min-h-[98px] w-full items-start justify-end">
            {logoSrc ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
                <img src={logoSrc} alt={company?.name || "Company logo"} className="block h-[68px] w-auto max-w-[170px] object-contain" />
              </div>
            ) : (
              <div className="text-right text-base font-bold text-slate-900">{company?.name || "Company"}</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bill To</p>
          <h2 className={headingClass(customer?.name, "mt-3 text-xl font-semibold", "mt-3 text-[1.05rem] font-semibold")}>{customer.name || "-"}</h2>
          <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{customer.address || "-"}</p>
          <div className="mt-4 space-y-1 break-words text-sm text-slate-600">
            <p>Phone: {customer.phone || "-"}</p>
            <p>Email: {customer.email || "-"}</p>
            <p>Zip Code: {customer.zipCode || "-"}</p>
            <p>Place of Supply: {customer.placeOfSupply || "-"}</p>
            <p>GSTIN: {customer.gstin || "-"}</p>
          </div>
        </div>

        <div className="w-[268px] flex-shrink-0">
          <div className="mt-1 rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50 to-indigo-100/80 px-6 py-5 shadow-[0_14px_28px_rgba(99,102,241,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">{type === "invoice" ? "Tax Invoice" : "Quotation"}</p>
            <p className="mt-3 break-words text-2xl font-semibold text-slate-900">{invoiceNumber}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>Due Date: {formatDate(dueDate)}</p>
              <p>Tax Mode: {taxType === "igst" ? "IGST 18%" : "CGST 9% + SGST 9%"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
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
                <td className="break-words px-4 py-4">{item.description}</td>
                <td className="px-4 py-4">{item.hsnCode || "-"}</td>
                <td className="px-4 py-4">{item.quantity}</td>
                <td className="px-4 py-4">{formatCurrency(item.rate)}</td>
                <td className="px-4 py-4">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total In Words</p>
          <p className="mt-3 break-words text-sm font-semibold text-slate-900">{englishAmountInWords}</p>
          <p className="mt-2 break-words text-sm text-slate-700 [font-family:'Noto_Sans_Devanagari','Noto_Sans',sans-serif]">{hindiAmountInWords}</p>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Terms & Conditions</p>
            <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{terms || "-"}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-slate-50">
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

      <div className="mt-6 flex items-start justify-between gap-5">
        <div className="w-[68%] rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Notes</p>
          <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{notes || "-"}</p>
        </div>
        <div className="w-[32%] rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reference</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">Reserved for internal remarks, stamp, or future metadata.</p>
        </div>
      </div>
    </div>
  );
}
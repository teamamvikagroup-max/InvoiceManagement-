import { calculateItemTotal, formatCurrency } from "../utils/calculations";

export default function ItemsTable({ items, onChange, onAddItem, onRemoveItem }) {
  const itemChange = (index, field, value) => {
    const nextItems = items.map((item, currentIndex) =>
      currentIndex === index
        ? {
            ...item,
            [field]: field === "description" || field === "hsnCode" ? value : value === "" ? "" : Number(value),
          }
        : item,
    );

    onChange(nextItems);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="space-y-4 p-4 md:hidden">
        {items.map((item, index) => (
          <div key={item.itemId} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4">
              <div>
                <label className="field-label">Description</label>
                <input
                  required
                  value={item.description}
                  onChange={(event) => itemChange(index, "description", event.target.value)}
                  className="input-field"
                  placeholder="Product or service description"
                />
              </div>
              <div>
                <label className="field-label">HSN Code</label>
                <input
                  value={item.hsnCode}
                  onChange={(event) => itemChange(index, "hsnCode", event.target.value)}
                  className="input-field"
                  placeholder="HSN/SAC (Optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Qty</label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(event) => itemChange(index, "quantity", event.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="field-label">Rate</label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.rate}
                    onChange={(event) => itemChange(index, "rate", event.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                <span className="text-sm font-medium text-slate-500">Total</span>
                <span className="text-sm font-semibold text-slate-700">{formatCurrency(calculateItemTotal(item))}</span>
              </div>
              <button type="button" className="btn-danger w-full justify-center" onClick={() => onRemoveItem(index)} disabled={items.length === 1}>
                Remove Item
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <th className="px-4 py-4">Description</th>
              <th className="px-4 py-4">HSN Code</th>
              <th className="px-4 py-4">Qty</th>
              <th className="px-4 py-4">Rate</th>
              <th className="px-4 py-4">Total</th>
              <th className="px-4 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={item.itemId}>
                <td className="px-4 py-4">
                  <input
                    required
                    value={item.description}
                    onChange={(event) => itemChange(index, "description", event.target.value)}
                    className="input-field"
                    placeholder="Product or service description"
                  />
                </td>
                <td className="px-4 py-4">
                  <input
                    value={item.hsnCode}
                    onChange={(event) => itemChange(index, "hsnCode", event.target.value)}
                    className="input-field"
                    placeholder="HSN/SAC (Optional)"
                  />
                </td>
                <td className="px-4 py-4">
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(event) => itemChange(index, "quantity", event.target.value)}
                    className="input-field min-w-24"
                  />
                </td>
                <td className="px-4 py-4">
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.rate}
                    onChange={(event) => itemChange(index, "rate", event.target.value)}
                    className="input-field min-w-28"
                  />
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">{formatCurrency(calculateItemTotal(item))}</td>
                <td className="px-4 py-4">
                  <button type="button" className="btn-danger" onClick={() => onRemoveItem(index)} disabled={items.length === 1}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-4">
        <button type="button" className="btn-secondary w-full justify-center md:w-auto" onClick={onAddItem}>
          Add Item
        </button>
      </div>
    </div>
  );
}

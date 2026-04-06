import { useEffect, useState } from "react";

const initialFormState = { name: "", address: "", gstin: "", phone: "", email: "", website: "" };

export default function CompanyFormModal({ isOpen, company, onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState(initialFormState);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(company ? { name: company.name ?? "", address: company.address ?? "", gstin: company.gstin ?? "", phone: company.phone ?? "", email: company.email ?? "", website: company.website ?? "" } : initialFormState);
    setLogoFile(null);
  }, [company, isOpen]);

  if (!isOpen) return null;

  const change = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); await onSubmit({ ...formData }, logoFile); };
  const currentLogo = company?.logoBase64 || company?.logoUrl || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-3xl p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{company ? "Edit Company Profile" : "Add Company Profile"}</h2>
            <p className="mt-2 text-sm text-slate-600">Save branding, GST details, contact information, and a reusable company logo.</p>
          </div>
          <button type="button" className="btn-secondary px-4 py-2" onClick={onClose}>Close</button>
        </div>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={submit}>
          <div className="md:col-span-2"><label className="field-label">Company Name</label><input required name="name" value={formData.name} onChange={change} className="input-field" /></div>
          <div className="md:col-span-2"><label className="field-label">Address</label><textarea required name="address" rows="3" value={formData.address} onChange={change} className="input-field" /></div>
          <div><label className="field-label">GSTIN</label><input name="gstin" value={formData.gstin} onChange={change} className="input-field" /></div>
          <div><label className="field-label">Phone</label><input name="phone" value={formData.phone} onChange={change} className="input-field" /></div>
          <div><label className="field-label">Email</label><input type="email" name="email" value={formData.email} onChange={change} className="input-field" /></div>
          <div><label className="field-label">Website</label><input name="website" value={formData.website} onChange={change} className="input-field" /></div>
          <div className="md:col-span-2">
            <label className="field-label">Logo</label>
            <input type="file" accept="image/*" className="input-field file:mr-4 file:rounded-xl file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-700" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
            {currentLogo ? <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><img src={currentLogo} alt={company?.name || "Company logo"} className="h-16 w-16 rounded-2xl object-cover" /><p className="text-sm text-slate-600">Current logo will remain until you upload a replacement.</p></div> : null}
          </div>
          <div className="md:col-span-2 flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? "Saving..." : company ? "Update & Close" : "Save Company"}</button></div>
        </form>
      </div>
    </div>
  );
}
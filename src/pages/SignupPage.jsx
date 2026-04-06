import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import StatusAlert from "../components/StatusAlert";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUpWithEmail, getAuthErrorMessage } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      await signUpWithEmail(formData.name, formData.email, formData.password);
      setStatus({ type: "success", message: "Account created successfully. Redirecting..." });
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Signup failed", error);
      setStatus({ type: "error", message: getAuthErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="glass-card w-full max-w-xl p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">Create Account</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Start your billing workspace</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">Register with email and password. Your profile will be saved securely in Firebase.</p>

        {status ? <div className="mt-5"><StatusAlert type={status.type} message={status.message} /></div> : null}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="field-label">Full Name</label>
            <input className="input-field" required value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input type="email" className="input-field" required value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input type="password" className="input-field" required minLength="6" value={formData.password} onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))} />
          </div>
          <div>
            <label className="field-label">Confirm Password</label>
            <input type="password" className="input-field" required minLength="6" value={formData.confirmPassword} onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-600">
          Already have an account? <Link to="/login" className="font-medium text-brand-700 hover:underline">Login here</Link>
        </div>
      </div>
    </div>
  );
}
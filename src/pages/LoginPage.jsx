import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import StatusAlert from "../components/StatusAlert";
import { useAuth } from "../context/AuthContext";

const RESET_ELIGIBLE_CODES = new Set([
  "auth/wrong-password",
  "auth/invalid-credential",
  "auth/user-not-found",
]);

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithEmail, sendResetPasswordEmail, getAuthErrorMessage } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [lastLoginErrorCode, setLastLoginErrorCode] = useState("");

  const redirectTo = location.state?.from || "/";

  const canShowForgotPassword = useMemo(
    () => Boolean(formData.email.trim()) && RESET_ELIGIBLE_CODES.has(lastLoginErrorCode),
    [formData.email, lastLoginErrorCode],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);
    setLastLoginErrorCode("");

    try {
      await loginWithEmail(formData.email, formData.password);
      setStatus({ type: "success", message: "Login successful. Redirecting..." });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error("Email login failed", error);
      setLastLoginErrorCode(error?.code ?? "");
      setStatus({ type: "error", message: getAuthErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setStatus({ type: "error", message: "Enter your email address first, then use Forgot Password." });
      return;
    }

    setIsResettingPassword(true);
    setStatus(null);

    try {
      await sendResetPasswordEmail(formData.email);
      setStatus({ type: "success", message: `Password reset link sent to ${formData.email.trim()}. Please check your inbox.` });
    } catch (error) {
      console.error("Password reset failed", error);
      setStatus({ type: "error", message: getAuthErrorMessage(error) });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="glass-card w-full max-w-xl p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">Welcome Back</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Login to your workspace</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">Access dashboards, create invoices, manage companies, and keep all records synced securely.</p>

        {status ? <div className="mt-5"><StatusAlert type={status.type} message={status.message} /></div> : null}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="field-label">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={formData.email}
              onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
            />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input
              type="password"
              required
              className="input-field"
              value={formData.password}
              onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
            />
          </div>
          {canShowForgotPassword ? (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm font-medium text-brand-700 transition hover:text-brand-800 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleForgotPassword}
                disabled={isResettingPassword || isSubmitting}
              >
                {isResettingPassword ? "Sending reset link..." : "Forgot Password?"}
              </button>
            </div>
          ) : null}
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting || isResettingPassword}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

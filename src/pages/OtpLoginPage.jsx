import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import StatusAlert from "../components/StatusAlert";
import { useAuth } from "../context/AuthContext";
import { createPhoneRecaptcha } from "../firebase/auth";

function normalizePhoneNumber(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

export default function OtpLoginPage() {
  const navigate = useNavigate();
  const { sendPhoneOtp, verifyPhoneOtp, getAuthErrorMessage } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [status, setStatus] = useState(null);
  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);

  const ensureRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = createPhoneRecaptcha("phone-recaptcha-container");
    }

    return recaptchaVerifierRef.current;
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setIsSendingOtp(true);
    setStatus(null);

    try {
      const verifier = ensureRecaptcha();
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const nextConfirmationResult = await sendPhoneOtp(normalizedPhone, verifier);
      setConfirmationResult(nextConfirmationResult);
      setStatus({ type: "success", message: `OTP sent to ${normalizedPhone}.` });
    } catch (error) {
      console.error("Phone OTP request failed", error);
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      setStatus({ type: "error", message: getAuthErrorMessage(error) });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setIsVerifyingOtp(true);
    setStatus(null);

    try {
      await verifyPhoneOtp(confirmationResult, otpCode);
      setStatus({ type: "success", message: "OTP verified. Redirecting..." });
      navigate("/", { replace: true });
    } catch (error) {
      console.error("OTP verification failed", error);
      setStatus({ type: "error", message: getAuthErrorMessage(error) });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="glass-card w-full max-w-xl p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">Phone Login</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Sign in with OTP</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">Use your phone number with country code. Example: +919876543210 or just enter a 10-digit Indian mobile number.</p>

        {status ? <div className="mt-5"><StatusAlert type={status.type} message={status.message} /></div> : null}

        {!confirmationResult ? (
          <form className="mt-6 space-y-5" onSubmit={handleSendOtp}>
            <div>
              <label className="field-label">Phone Number</label>
              <input className="input-field" required value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+919876543210" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={isSendingOtp}>
              {isSendingOtp ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleVerifyOtp}>
            <div>
              <label className="field-label">Enter OTP</label>
              <input className="input-field" required value={otpCode} onChange={(event) => setOtpCode(event.target.value)} placeholder="6-digit code" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={isVerifyingOtp}>
              {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
            </button>
            <button type="button" className="btn-secondary w-full" onClick={() => { setConfirmationResult(null); setOtpCode(""); setStatus(null); }}>
              Change phone number
            </button>
          </form>
        )}

        <div id="phone-recaptcha-container" />

        <div className="mt-6 grid gap-2 text-sm text-slate-600">
          <Link to="/login" className="font-medium text-brand-700 hover:underline">Login with email and password</Link>
          <Link to="/signup" className="font-medium text-brand-700 hover:underline">Create a new account</Link>
        </div>
      </div>
    </div>
  );
}
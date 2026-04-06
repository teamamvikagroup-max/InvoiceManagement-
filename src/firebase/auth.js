import {
  RecaptchaVerifier,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  updateProfile,
} from "firebase/auth";
import { get, ref as databaseRef, set, update } from "firebase/database";
import { auth, assertDatabaseConfigured } from "./config";

let persistencePromise;

export async function ensureAuthPersistence() {
  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence);
  }

  return persistencePromise;
}

export function subscribeToAuthChanges(callback, onError) {
  return onAuthStateChanged(auth, callback, onError);
}

export async function upsertUserProfile(user, overrides = {}) {
  if (!user?.uid) {
    return null;
  }

  const rtdb = assertDatabaseConfigured();
  const userReference = databaseRef(rtdb, `users/${user.uid}`);
  const snapshot = await get(userReference);
  const existing = snapshot.val() ?? {};
  const payload = {
    uid: user.uid,
    name: overrides.name ?? user.displayName ?? existing.name ?? "",
    email: overrides.email ?? user.email ?? existing.email ?? "",
    phone: overrides.phone ?? user.phoneNumber ?? existing.phone ?? "",
    updatedAt: Date.now(),
    createdAt: existing.createdAt ?? Date.now(),
  };

  if (snapshot.exists()) {
    await update(userReference, payload);
  } else {
    await set(userReference, payload);
  }

  return payload;
}

export async function signUpWithEmail(name, email, password) {
  await ensureAuthPersistence();
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (name) {
    await updateProfile(credential.user, { displayName: name });
  }

  await upsertUserProfile(credential.user, { name, email });
  return credential.user;
}

export async function loginWithEmail(email, password) {
  await ensureAuthPersistence();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await upsertUserProfile(credential.user);
  return credential.user;
}

export function createPhoneRecaptcha(containerId) {
  return new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
  });
}

export async function sendPhoneOtp(phoneNumber, recaptchaVerifier) {
  await ensureAuthPersistence();
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

export async function verifyPhoneOtp(confirmationResult, otpCode) {
  const result = await confirmationResult.confirm(otpCode);
  await upsertUserProfile(result.user, { phone: result.user.phoneNumber ?? "" });
  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function getAuthErrorMessage(error) {
  const code = error?.code ?? "";

  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please log in instead.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/invalid-phone-number":
      return "Enter a valid phone number with country code, for example +91XXXXXXXXXX.";
    case "auth/invalid-verification-code":
      return "The OTP you entered is invalid.";
    case "auth/code-expired":
      return "This OTP has expired. Please request a new one.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    default:
      return error?.message || "Authentication failed. Please try again.";
  }
}
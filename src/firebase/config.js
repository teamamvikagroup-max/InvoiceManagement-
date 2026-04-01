import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

export const firebaseDatabaseUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL?.trim() || "";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
  databaseURL: firebaseDatabaseUrl,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value && key !== "databaseURL")
  .map(([key]) => key);

if (missingKeys.length) {
  console.warn(`Firebase config is incomplete. Missing: ${missingKeys.join(", ")}`);
}

if (!firebaseDatabaseUrl) {
  console.warn("Firebase Realtime Database URL is missing. Set VITE_FIREBASE_DATABASE_URL to the exact URL from Firebase Console -> Realtime Database -> Data.");
}

function normalizeStorageBucket(bucket) {
  if (!bucket) {
    return "";
  }

  if (bucket.startsWith("gs://") || bucket.startsWith("http://") || bucket.startsWith("https://")) {
    return bucket;
  }

  return `gs://${bucket}`;
}

const app = initializeApp(firebaseConfig);
const normalizedStorageBucket = normalizeStorageBucket(firebaseConfig.storageBucket);

export const rtdb = firebaseDatabaseUrl ? getDatabase(app) : null;
export const storage = normalizedStorageBucket ? getStorage(app, normalizedStorageBucket) : null;
export const hasStorageBucket = Boolean(normalizedStorageBucket);
export const hasDatabaseUrl = Boolean(firebaseDatabaseUrl);
export const firebaseSetupIssues = missingKeys;

export function assertDatabaseConfigured() {
  if (rtdb) {
    return rtdb;
  }

  throw new Error(
    "Firebase Realtime Database is not configured. Set VITE_FIREBASE_DATABASE_URL in your .env file to the exact Realtime Database URL from Firebase console.",
  );
}

export function assertStorageConfigured() {
  if (storage) {
    return storage;
  }

  throw new Error(
    "Firebase Storage is not configured. Set VITE_FIREBASE_STORAGE_BUCKET in your .env file to the exact bucket value from Firebase, for example your-project-id.firebasestorage.app or gs://your-project-id.firebasestorage.app.",
  );
}

export default app;
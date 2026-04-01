# Amvika Invoice & Quotation Web App

React + Vite invoice and quotation system backed by Firebase Realtime Database and Firebase Storage.

## Local run

1. Install Node.js.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Paste your Firebase web app config values into `.env`.
5. Run `npm run dev`.

## Exact Firebase setup required

### 1. Create the Firebase project

1. Open the Firebase console.
2. Create a project or use an existing one.
3. In Project settings, add a Web app.
4. Copy the Firebase web config values into `.env`.

Your `.env` file must contain:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Notes:
- Use the exact `databaseURL` from Realtime Database in Firebase console.
- Use the exact `storageBucket` value shown in the Firebase web app config.
- This app accepts either `your-project.firebasestorage.app` or `gs://your-project.firebasestorage.app`.
- If your project still uses an older `*.appspot.com` bucket, use that exact value instead.

### 2. Enable Firebase Realtime Database

1. In Firebase console, open Realtime Database.
2. Click Create Database.
3. For development, start in test mode or use the open rules in `database.rules.json`.
4. Choose your preferred region.
5. Copy the exact database URL into `VITE_FIREBASE_DATABASE_URL`.

This app stores data in this structure:
- `companies/{companyId}`
- `companies/{companyId}/clients`
- `companies/{companyId}/products`
- `companies/{companyId}/quotations`
- `companies/{companyId}/invoices`
- `companies/{companyId}/payments`
- `meta/counters/invoice`
- `meta/counters/quotation`

You do not need to pre-create records. The app creates companies, nested invoices and quotations, and sequential counters automatically.

### 3. Enable Firebase Storage

1. In Firebase console, open Storage.
2. Click Get started.
3. Choose the same or a nearby region.
4. Confirm the bucket is created.
5. Copy the bucket value into `VITE_FIREBASE_STORAGE_BUCKET`.

This app stores files at:
- `company-logos/...`
- `invoices/{invoiceNumber}.pdf`

If Storage is unavailable, the app still saves invoices and quotations and falls back to local PDF download.

### 4. Development rules

Realtime Database rules in this repo:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Storage rules in this repo:

```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

Deploy them with Firebase CLI if needed, or copy the same rules into the Firebase console.

## Common setup issues

### Error: `Firebase Storage: No default bucket found`

This means `VITE_FIREBASE_STORAGE_BUCKET` is missing or incorrect in `.env`.

Fix it by:
1. Opening Firebase console -> Project settings -> Your apps -> Web app config.
2. Copying the `storageBucket` value exactly.
3. Pasting it into `.env`.
4. Restarting the dev server.

### Error: Missing or insufficient permissions

This means your Realtime Database or Storage rules are blocking the app.

For development, make sure:
- Realtime Database rules allow read and write.
- Storage rules allow read and write.

### Important pricing note for older buckets

Firebase documents note that default `*.appspot.com` buckets require the Blaze plan starting February 2, 2026. If your project uses an older `*.appspot.com` bucket and Storage access fails, check your Firebase plan and bucket setup.

## Useful Firebase console checklist

Before using the app end to end, confirm all of these are true:
- A Firebase Web app exists.
- `.env` contains all `VITE_FIREBASE_*` values, including `VITE_FIREBASE_DATABASE_URL`.
- Realtime Database is enabled.
- Firebase Storage is enabled.
- Your Realtime Database URL is copied exactly into `VITE_FIREBASE_DATABASE_URL`.
- Your Storage bucket value is copied exactly into `VITE_FIREBASE_STORAGE_BUCKET`.
- Development rules are deployed or pasted into the console.
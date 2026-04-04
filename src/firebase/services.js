import {
  get,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  set,
  update,
} from "firebase/database";
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytesResumable } from "firebase/storage";
import { assertDatabaseConfigured, assertStorageConfigured } from "./config";

const DEFAULT_OWNER_ID = "userId1";

function databaseRef(path) {
  return ref(assertDatabaseConfigured(), path);
}

function snapshotToCompanies(value) {
  return Object.entries(value ?? {}).map(([companyKey, company]) => ({
    companyKey,
    id: company.id ?? companyKey,
    ...company,
  }));
}

function mapItemsArrayToObject(items) {
  return items.reduce((result, item, index) => {
    result[`item${index + 1}`] = {
      itemId: item.itemId,
      name: item.description,
      description: item.description,
      hsnCode: item.hsnCode ?? "",
      qty: Number(item.quantity),
      price: Number(item.rate),
      gst: item.gst ?? 18,
      total: Number(item.total),
    };
    return result;
  }, {});
}

function mapItemsObjectToArray(itemsObject) {
  return Object.values(itemsObject ?? {}).map((item, index) => ({
    itemId: item.itemId ?? `item-${index + 1}`,
    description: item.description ?? item.name ?? "",
    hsnCode: item.hsnCode ?? "",
    quantity: Number(item.qty ?? item.quantity ?? 0),
    rate: Number(item.price ?? item.rate ?? 0),
    total: Number(item.total ?? 0),
    gst: Number(item.gst ?? 0),
  }));
}

function normalizeDocument(type, company, documentKey, documentValue) {
  const items = Array.isArray(documentValue.items)
    ? documentValue.items
    : mapItemsObjectToArray(documentValue.items);

  return {
    id: documentKey,
    type,
    companyId: company.id ?? company.companyKey,
    companySnapshot: {
      name: company.name,
      address: company.address,
      gstin: company.gstin,
      phone: company.phone,
      email: company.email,
      website: company.website,
      logoUrl: company.logoUrl ?? "",
    },
    customer: documentValue.customer ?? {
      name: documentValue.clientName ?? "",
      address: documentValue.clientAddress ?? "",
      phone: documentValue.clientPhone ?? "",
      email: documentValue.clientEmail ?? "",
      zipCode: documentValue.clientZipCode ?? "",
      placeOfSupply: documentValue.placeOfSupply ?? "",
      gstin: documentValue.clientGstin ?? "",
    },
    invoiceNumber: documentValue.invoiceNumber ?? documentValue.quotationNumber ?? "",
    dueDate: documentValue.dueDate ?? "",
    items,
    subtotal: Number(documentValue.subtotal ?? 0),
    taxType: documentValue.taxType ?? "cgst_sgst",
    cgst: Number(documentValue.cgst ?? 0),
    sgst: Number(documentValue.sgst ?? 0),
    igst: Number(documentValue.igst ?? 0),
    gstTotal: Number(documentValue.gstTotal ?? 0),
    totalAmount: Number(documentValue.totalAmount ?? documentValue.grandTotal ?? 0),
    paymentMade: Number(documentValue.paymentMade ?? 0),
    balanceAmount: Number(documentValue.balanceAmount ?? documentValue.grandTotal ?? 0),
    notes: documentValue.notes ?? "",
    terms: documentValue.terms ?? "",
    pdfUrl: documentValue.pdfUrl ?? "",
    pdfPath: documentValue.pdfPath ?? "",
    pdfStatus: documentValue.pdfStatus ?? (documentValue.pdfUrl ? "uploaded" : "local_only"),
    createdAt: Number(documentValue.createdAt ?? 0),
  };
}

export function subscribeToCompanies(onData, onError) {
  try {
    const companiesReference = databaseRef("companies");
    console.info("Subscribing to companies from Realtime Database", companiesReference.toString());

    return onValue(
      companiesReference,
      (snapshot) => {
        const companies = snapshotToCompanies(snapshot.val()).sort(
          (a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0),
        );
        console.info("Companies loaded from Realtime Database", companies.length);
        onData(companies);
      },
      (error) => {
        console.error("Failed to load companies from Realtime Database", error);
        onError?.(error);
      },
    );
  } catch (error) {
    console.error("Realtime Database company subscription setup failed", error);
    onError?.(error);
    return () => {};
  }
}

export async function uploadCompanyLogo(file, companyName) {
  if (!file) {
    throw new Error("No logo file was provided for upload.");
  }

  const storage = assertStorageConfigured();
  const safeName = (companyName || "company")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "company";
  const extension = file.name?.includes(".") ? file.name.split(".").pop() : "png";
  const logoPath = `company-logos/${safeName}-${Date.now()}.${extension}`;
  const logoReference = storageRef(storage, logoPath);

  console.info("Starting company logo upload", {
    companyName,
    fileName: file.name,
    fileSize: file.size,
    logoPath,
  });

  await uploadBlobResumable(
    logoReference,
    file,
    { contentType: file.type || "application/octet-stream" },
    LOGO_UPLOAD_TIMEOUT_MS,
    {
      timeoutMessage: "Logo upload timed out. Please try again.",
      progressLabel: "Company logo upload progress",
    },
  );

  const logoUrl = await withTimeout(
    getDownloadURL(logoReference),
    PDF_URL_TIMEOUT_MS,
    "Logo URL generation timed out after upload.",
  );

  console.info("Company logo upload completed", { logoPath });

  return { logoPath, logoUrl };
}

export async function deleteStorageFile(path) {
  if (!path) {
    return;
  }

  try {
    const storage = assertStorageConfigured();
    await deleteObject(storageRef(storage, path));
  } catch (error) {
    console.warn("Storage cleanup failed", error);
  }
}

export async function createCompany(payload) {
  const companiesReference = databaseRef("companies");
  const companyReference = push(companiesReference);
  const companyId = companyReference.key;
  await set(companyReference, {
    id: companyId,
    ownerId: payload.ownerId ?? DEFAULT_OWNER_ID,
    name: payload.name,
    email: payload.email ?? "",
    phone: payload.phone ?? "",
    gstin: payload.gstin ?? "",
    address: payload.address ?? "",
    website: payload.website ?? "",
    logoUrl: payload.logoUrl ?? "",
    logoPath: payload.logoPath ?? "",
    clients: payload.clients ?? {},
    products: payload.products ?? {},
    quotations: payload.quotations ?? {},
    invoices: payload.invoices ?? {},
    payments: payload.payments ?? {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return { id: companyId };
}

export async function updateCompany(companyId, payload) {
  await update(databaseRef(`companies/${companyId}`), {
    ...payload,
    updatedAt: Date.now(),
  });
}

export async function deleteCompany(company) {
  await remove(databaseRef(`companies/${company.id}`));
  await deleteStorageFile(company.logoPath);
}

function counterPath(type) {
  return `meta/counters/${type === "invoice" ? "invoice" : "quotation"}`;
}

export async function peekNextDocumentNumber(type) {
  const snapshot = await get(databaseRef(counterPath(type)));
  const value = snapshot.exists() ? Number(snapshot.val() ?? 0) : 0;
  const prefix = type === "invoice" ? "INV" : "QTN";
  return `${prefix}-${String(value + 1).padStart(6, "0")}`;
}

export async function reserveDocumentNumber(type) {
  const snapshot = await runTransaction(databaseRef(counterPath(type)), (currentValue) => Number(currentValue ?? 0) + 1);
  const next = Number(snapshot.snapshot.val() ?? 1);
  const prefix = type === "invoice" ? "INV" : "QTN";
  return `${prefix}-${String(next).padStart(6, "0")}`;
}

const PDF_UPLOAD_TIMEOUT_MS = 90000;
const PDF_URL_TIMEOUT_MS = 20000;
const LOGO_UPLOAD_TIMEOUT_MS = 30000;

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function uploadBlobResumable(fileRef, blob, metadata, timeoutMs, options = {}) {
  const {
    timeoutMessage = "Upload timed out.",
    progressLabel = "Upload progress",
  } = options;

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, blob, metadata);
    const timer = setTimeout(() => {
      uploadTask.cancel();
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
        console.info(progressLabel, progress);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
      () => {
        clearTimeout(timer);
        resolve();
      },
    );
  });
}

export async function uploadDocumentPdf(invoiceNumber, blob) {
  const storage = assertStorageConfigured();
  const pdfPath = `invoices/${invoiceNumber}.pdf`;
  const pdfReference = storageRef(storage, pdfPath);

  await uploadBlobResumable(pdfReference, blob, { contentType: "application/pdf" }, PDF_UPLOAD_TIMEOUT_MS, {
    timeoutMessage: "PDF upload timed out. Falling back to local download.",
    progressLabel: "PDF upload progress",
  });

  const pdfUrl = await withTimeout(
    getDownloadURL(pdfReference),
    PDF_URL_TIMEOUT_MS,
    "PDF URL generation timed out. Falling back to local download.",
  );

  return { pdfPath, pdfUrl };
}

export async function saveInvoiceRecord(payload) {
  const typeKey = payload.type === "invoice" ? "invoices" : "quotations";
  const documentsReference = databaseRef(`companies/${payload.companyId}/${typeKey}`);
  const documentReference = push(documentsReference);
  const documentId = documentReference.key;
  const gstTotal = Number(payload.cgst ?? 0) + Number(payload.sgst ?? 0) + Number(payload.igst ?? 0);

  const documentData = {
    clientId: payload.clientId ?? "",
    customer: payload.customer,
    items: mapItemsArrayToObject(payload.items ?? []),
    subtotal: Number(payload.subtotal ?? 0),
    taxType: payload.taxType ?? "cgst_sgst",
    cgst: Number(payload.cgst ?? 0),
    sgst: Number(payload.sgst ?? 0),
    igst: Number(payload.igst ?? 0),
    gstTotal,
    grandTotal: Number(payload.totalAmount ?? 0),
    totalAmount: Number(payload.totalAmount ?? 0),
    paymentMade: Number(payload.paymentMade ?? 0),
    balanceAmount: Number(payload.balanceAmount ?? 0),
    dueDate: payload.dueDate ?? "",
    notes: payload.notes ?? "",
    terms: payload.terms ?? "",
    pdfUrl: payload.pdfUrl ?? "",
    pdfPath: payload.pdfPath ?? "",
    pdfStatus: payload.pdfStatus ?? "local_only",
    createdAt: Date.now(),
  };

  if (payload.type === "invoice") {
    documentData.invoiceNumber = payload.invoiceNumber;
    documentData.paymentStatus = Number(payload.balanceAmount ?? 0) > 0 ? "unpaid" : "paid";
  } else {
    documentData.quotationNumber = payload.invoiceNumber;
    documentData.status = payload.status ?? "pending";
  }

  await set(documentReference, documentData);

  return { id: documentId, companyId: payload.companyId, type: payload.type };
}

export async function updateInvoiceRecordPdf(companyId, type, documentId, payload) {
  const typeKey = type === "invoice" ? "invoices" : "quotations";
  await update(databaseRef(`companies/${companyId}/${typeKey}/${documentId}`), payload);
}

export function subscribeToDocuments(type, onData, onError) {
  try {
    const companiesReference = databaseRef("companies");
    console.info(`Subscribing to ${type} history from Realtime Database`, companiesReference.toString());

    return onValue(
      companiesReference,
      (snapshot) => {
        const companies = snapshotToCompanies(snapshot.val());
        const nestedKey = type === "invoice" ? "invoices" : "quotations";
        const records = companies
          .flatMap((company) =>
            Object.entries(company[nestedKey] ?? {}).map(([documentKey, documentValue]) =>
              normalizeDocument(type, company, documentKey, documentValue),
            ),
          )
          .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0));

        console.info(`${type} history loaded from Realtime Database`, records.length);
        onData(records);
      },
      (error) => {
        console.error(`Failed to load ${type} history from Realtime Database`, error);
        onError?.(error);
      },
    );
  } catch (error) {
    console.error("Realtime Database history subscription setup failed", error);
    onError?.(error);
    return () => {};
  }
}

export function buildCompanySnapshot(company) {
  return {
    name: company.name,
    address: company.address,
    gstin: company.gstin,
    phone: company.phone,
    email: company.email,
    website: company.website,
    logoUrl: company.logoUrl ?? "",
  };
}
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
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { assertDatabaseConfigured, assertStorageConfigured } from "./config";

const PDF_UPLOAD_TIMEOUT_MS = 90000;
const DATABASE_WRITE_TIMEOUT_MS = 20000;
const FILE_URL_TIMEOUT_MS = 20000;
const LOGO_UPLOAD_TIMEOUT_MS = 30000;

function databaseRef(path) {
  return ref(assertDatabaseConfigured(), path);
}

function snapshotToCompanies(value) {
  return Object.entries(value ?? {}).map(([firebaseId, company]) => ({
    firebaseId,
    id: company?.id ?? firebaseId,
    ...company,
    logoUrl: company?.logoUrl ?? company?.logoBase64 ?? "",
    logoBase64: company?.logoBase64 ?? "",
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
    companyId: company.id ?? company.firebaseId,
    companySnapshot: {
      name: company.name ?? "",
      address: company.address ?? "",
      gstin: company.gstin ?? "",
      phone: company.phone ?? "",
      email: company.email ?? "",
      website: company.website ?? "",
      logoUrl: company.logoUrl ?? company.logoBase64 ?? "",
      logoBase64: company.logoBase64 ?? "",
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
    pdfStatus: documentValue.pdfStatus ?? (documentValue.pdfUrl ? "uploaded" : "missing"),
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
          (a, b) => Number(b.updatedAt ?? b.createdAt ?? 0) - Number(a.updatedAt ?? a.createdAt ?? 0),
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

async function uploadBlob(fileRef, blob, metadata, timeoutMs, options = {}) {
  const {
    timeoutMessage = "Upload timed out.",
    progressLabel = "Upload progress",
  } = options;

  console.info(progressLabel, "started");
  await withTimeout(uploadBytes(fileRef, blob, metadata), timeoutMs, timeoutMessage);
  console.info(progressLabel, "completed");
}

async function fileToDataUrl(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result || "");
    reader.onerror = () => reject(new Error("Unable to prepare company logo for PDF rendering."));
    reader.readAsDataURL(file);
  });
}
export async function uploadCompanyLogo(companyId, file) {
  if (!file) {
    return { logoUrl: "", logoPath: "" };
  }

  if (!companyId) {
    throw new Error("Company ID is required before uploading a logo.");
  }

  if (!file.type?.startsWith("image/")) {
    throw new Error("Please select a valid image file for the company logo.");
  }

  const storage = assertStorageConfigured();
  const safeFilename = (file.name || "logo.png").replace(/[^a-zA-Z0-9._-]+/g, "-");
  const logoPath = `company-logos/${companyId}/${safeFilename}`;
  const logoReference = storageRef(storage, logoPath);

  await uploadBlob(
    logoReference,
    file,
    { contentType: file.type || "application/octet-stream" },
    LOGO_UPLOAD_TIMEOUT_MS,
    {
      timeoutMessage: "Logo upload timed out. Please try again.",
      progressLabel: "Company logo upload progress",
    },
  );

  const logoBase64 = await fileToDataUrl(file);

  const logoUrl = await withTimeout(
    getDownloadURL(logoReference),
    FILE_URL_TIMEOUT_MS,
    "Logo URL generation timed out after upload.",
  );

  return { logoUrl, logoPath, logoBase64 };
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
  const companyData = {
    id: companyId,
    name: payload.name ?? "",
    address: payload.address ?? "",
    email: payload.email ?? "",
    gstin: payload.gstin ?? "",
    phone: payload.phone ?? "",
    website: payload.website ?? "",
    logoUrl: payload.logoUrl ?? "",
    logoPath: payload.logoPath ?? "",
    logoBase64: payload.logoBase64 ?? "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await withTimeout(set(companyReference, companyData), DATABASE_WRITE_TIMEOUT_MS, "Saving company data timed out.");
  return { id: companyId, firebaseId: companyId };
}

export async function updateCompany(companyId, payload) {
  await withTimeout(
    update(databaseRef(`companies/${companyId}`), {
      name: payload.name ?? "",
      address: payload.address ?? "",
      email: payload.email ?? "",
      gstin: payload.gstin ?? "",
      phone: payload.phone ?? "",
      website: payload.website ?? "",
      logoUrl: payload.logoUrl ?? "",
      logoPath: payload.logoPath ?? "",
      logoBase64: payload.logoBase64 ?? "",
      updatedAt: Date.now(),
    }),
    DATABASE_WRITE_TIMEOUT_MS,
    "Updating company data timed out.",
  );
}

export async function deleteCompany(company) {
  await remove(databaseRef(`companies/${company.firebaseId ?? company.id}`));
  if (company.logoPath) {
    await deleteStorageFile(company.logoPath);
  }
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

export async function uploadDocumentPdf(type, documentNumber, blob) {
  const storage = assertStorageConfigured();
  const folder = type === "invoice" ? "invoices" : "quotations";
  const timestamp = Date.now();
  const pdfPath = `${folder}/${documentNumber}_${timestamp}.pdf`;
  const pdfReference = storageRef(storage, pdfPath);

  await uploadBlob(pdfReference, blob, { contentType: "application/pdf" }, PDF_UPLOAD_TIMEOUT_MS, {
    timeoutMessage: `${type === "invoice" ? "Invoice" : "Quotation"} PDF upload timed out.`,
    progressLabel: `${type === "invoice" ? "Invoice" : "Quotation"} PDF upload progress`,
  });

  const pdfUrl = await withTimeout(
    getDownloadURL(pdfReference),
    FILE_URL_TIMEOUT_MS,
    `${type === "invoice" ? "Invoice" : "Quotation"} PDF URL generation timed out.`,
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
    pdfStatus: payload.pdfUrl ? "uploaded" : payload.pdfStatus ?? "missing",
    createdAt: Date.now(),
  };

  if (payload.type === "invoice") {
    documentData.invoiceNumber = payload.invoiceNumber;
    documentData.paymentStatus = Number(payload.balanceAmount ?? 0) > 0 ? "unpaid" : "paid";
  } else {
    documentData.quotationNumber = payload.invoiceNumber;
    documentData.status = payload.status ?? "pending";
  }

  await withTimeout(
    set(documentReference, documentData),
    DATABASE_WRITE_TIMEOUT_MS,
    `Saving ${payload.type === "invoice" ? "invoice" : "quotation"} data timed out.`,
  );

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
    name: company.name ?? "",
    address: company.address ?? "",
    gstin: company.gstin ?? "",
    phone: company.phone ?? "",
    email: company.email ?? "",
    website: company.website ?? "",
    logoUrl: company.logoUrl ?? company.logoBase64 ?? "",
    logoBase64: company.logoBase64 ?? "",
  };
}


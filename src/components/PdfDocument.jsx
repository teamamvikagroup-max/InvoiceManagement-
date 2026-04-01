import { formatCurrency } from "../utils/calculations";
import { formatDate, formatWebsite } from "../utils/formatters";

const styles = {
  page: {
    width: "794px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    lineHeight: 1.35,
    padding: "28px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
  },
  section: {
    marginTop: "20px",
  },
  titleBox: {
    border: "1px solid #dbe4ff",
    backgroundColor: "#eef2ff",
    borderRadius: "12px",
    padding: "14px 16px",
    minWidth: "220px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },
  cell: {
    border: "1px solid #dbe4ff",
    padding: "8px 10px",
    textAlign: "left",
    verticalAlign: "top",
  },
  head: {
    backgroundColor: "#f8fafc",
    fontWeight: 700,
  },
  totals: {
    width: "320px",
    marginLeft: "auto",
    marginTop: "18px",
    border: "1px solid #dbe4ff",
    borderRadius: "12px",
    overflow: "hidden",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderBottom: "1px solid #e2e8f0",
  },
};

export default function PdfDocument({ type, invoiceNumber, dueDate, company, customer, items, totals, notes, terms, taxType }) {
  return (
    <div style={styles.page}>
      <div style={{ ...styles.row, borderBottom: "1px solid #cbd5e1", paddingBottom: "18px" }}>
        <div style={{ maxWidth: "420px" }}>
          {company?.logoUrl ? <img src={company.logoUrl} alt={company.name} style={{ height: "54px", width: "54px", objectFit: "contain", marginBottom: "10px" }} crossOrigin="anonymous" /> : null}
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{company?.name || "Company Name"}</div>
          <div style={{ marginTop: "8px", whiteSpace: "pre-line", color: "#475569" }}>{company?.address || "-"}</div>
          <div style={{ marginTop: "8px", color: "#475569" }}>GSTIN: {company?.gstin || "-"}</div>
          <div style={{ color: "#475569" }}>Phone: {company?.phone || "-"}</div>
          <div style={{ color: "#475569" }}>Email: {company?.email || "-"}</div>
          <div style={{ color: "#475569" }}>Website: {company?.website ? formatWebsite(company.website) : "-"}</div>
        </div>
        <div style={styles.titleBox}>
          <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#4338ca", fontWeight: 700 }}>
            {type === "invoice" ? "Tax Invoice" : "Quotation"}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "8px" }}>{invoiceNumber}</div>
          <div style={{ marginTop: "10px", color: "#334155" }}>Due Date: {formatDate(dueDate)}</div>
          <div style={{ color: "#334155" }}>Tax Mode: {taxType === "igst" ? "IGST 18%" : "CGST 9% + SGST 9%"}</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Bill To</div>
        <div style={{ fontSize: "20px", fontWeight: 700, marginTop: "8px" }}>{customer.name || "-"}</div>
        <div style={{ marginTop: "6px", whiteSpace: "pre-line", color: "#475569" }}>{customer.address || "-"}</div>
        <div style={{ marginTop: "8px", color: "#475569" }}>Phone: {customer.phone || "-"}</div>
        <div style={{ color: "#475569" }}>Email: {customer.email || "-"}</div>
        <div style={{ color: "#475569" }}>Zip Code: {customer.zipCode || "-"}</div>
        <div style={{ color: "#475569" }}>Place of Supply: {customer.placeOfSupply || "-"}</div>
        <div style={{ color: "#475569" }}>GSTIN: {customer.gstin || "-"}</div>
      </div>

      <div style={styles.section}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.cell, ...styles.head }}>Description</th>
              <th style={{ ...styles.cell, ...styles.head }}>HSN Code</th>
              <th style={{ ...styles.cell, ...styles.head }}>Qty</th>
              <th style={{ ...styles.cell, ...styles.head }}>Rate</th>
              <th style={{ ...styles.cell, ...styles.head }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.itemId ?? `${item.description}-${item.hsnCode}`}>
                <td style={styles.cell}>{item.description}</td>
                <td style={styles.cell}>{item.hsnCode || "-"}</td>
                <td style={styles.cell}>{item.quantity}</td>
                <td style={styles.cell}>{formatCurrency(item.rate)}</td>
                <td style={styles.cell}>{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.totals}>
        <div style={styles.totalRow}><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
        <div style={styles.totalRow}><span>CGST</span><span>{formatCurrency(totals.cgst)}</span></div>
        <div style={styles.totalRow}><span>SGST</span><span>{formatCurrency(totals.sgst)}</span></div>
        <div style={styles.totalRow}><span>IGST</span><span>{formatCurrency(totals.igst)}</span></div>
        <div style={{ ...styles.totalRow, fontWeight: 700, fontSize: "14px" }}><span>Total</span><span>{formatCurrency(totals.totalAmount)}</span></div>
        {type === "invoice" ? (
          <>
            <div style={styles.totalRow}><span>Payment Made</span><span>{formatCurrency(totals.paymentMade)}</span></div>
            <div style={{ ...styles.totalRow, borderBottom: "none", fontWeight: 700, color: "#4338ca" }}><span>Balance Amount</span><span>{formatCurrency(totals.balanceAmount)}</span></div>
          </>
        ) : null}
      </div>

      <div style={{ ...styles.row, marginTop: "22px", alignItems: "stretch" }}>
        <div style={{ width: "48%" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Notes</div>
          <div style={{ marginTop: "8px", whiteSpace: "pre-line", color: "#475569" }}>{notes || "-"}</div>
        </div>
        <div style={{ width: "48%" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Terms & Conditions</div>
          <div style={{ marginTop: "8px", whiteSpace: "pre-line", color: "#475569" }}>{terms || "-"}</div>
        </div>
      </div>
    </div>
  );
}
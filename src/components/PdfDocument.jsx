import { formatCurrency } from "../utils/calculations";
import { formatAmountInWordsEnglish, formatAmountInWordsHindi, formatDate, formatWebsite } from "../utils/formatters";

const avoidBreak = {
  breakInside: "avoid",
  pageBreakInside: "avoid",
};

const styles = {
  page: {
    width: "794px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontFamily: '"Noto Sans", "Noto Sans Devanagari", "Segoe UI Symbol", "Arial Unicode MS", Arial, sans-serif',
    fontSize: "12px",
    lineHeight: 1.42,
    padding: "24px 28px 62px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    borderBottom: "1px solid #cbd5e1",
    paddingBottom: "16px",
  },
  rightColumn: {
    width: "248px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  logoArea: {
    width: "100%",
    minHeight: "78px",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  logoFrame: {
    border: "1px solid #dbe4ff",
    borderRadius: "14px",
    padding: "8px 10px",
    backgroundColor: "#ffffff",
  },
  billSummaryRow: {
    ...avoidBreak,
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    marginTop: "16px",
  },
  billColumn: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: "11px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#64748b",
    fontWeight: 700,
  },
  titleBox: {
    border: "1px solid #dbe4ff",
    background: "linear-gradient(180deg, #eef2ff 0%, #e0e7ff 100%)",
    borderRadius: "16px",
    padding: "14px 16px",
    width: "100%",
    boxShadow: "0 12px 28px rgba(99, 102, 241, 0.12)",
  },
  section: {
    marginTop: "18px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
    borderRadius: "16px",
    overflow: "hidden",
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
    color: "#334155",
  },
  summaryRow: {
    ...avoidBreak,
    display: "flex",
    gap: "18px",
    alignItems: "flex-start",
    marginTop: "18px",
  },
  leftColumn: {
    ...avoidBreak,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  wordsBox: {
    ...avoidBreak,
    border: "1px solid #dbe4ff",
    borderRadius: "16px",
    padding: "14px 16px",
    backgroundColor: "#ffffff",
  },
  divider: {
    marginTop: "12px",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "12px",
  },
  totals: {
    ...avoidBreak,
    width: "340px",
    border: "1px solid #dbe4ff",
    borderRadius: "16px",
    overflow: "hidden",
    backgroundColor: "#f8fafc",
    flexShrink: 0,
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "9px 14px",
    borderBottom: "1px solid #e2e8f0",
  },
  notesRow: {
    ...avoidBreak,
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginTop: "18px",
  },
  notesCard: {
    ...avoidBreak,
    width: "68%",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px 16px",
    backgroundColor: "#ffffff",
  },
  secondaryCard: {
    ...avoidBreak,
    width: "32%",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px 16px",
    backgroundColor: "#f8fafc",
    minHeight: "88px",
  },
};

export default function PdfDocument({ type, invoiceNumber, dueDate, company, customer, items, totals, notes, terms, taxType }) {
  const englishAmountInWords = formatAmountInWordsEnglish(totals.totalAmount);
  const hindiAmountInWords = formatAmountInWordsHindi(totals.totalAmount);
  const logoSrc = company?.logoUrl || "";

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div style={{ maxWidth: "430px" }}>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{company?.name || "Company Name"}</div>
          <div style={{ marginTop: "8px", whiteSpace: "pre-line", color: "#475569" }}>{company?.address || "-"}</div>
          <div style={{ marginTop: "10px", color: "#475569" }}>GSTIN: {company?.gstin || "-"}</div>
          <div style={{ color: "#475569" }}>Phone: {company?.phone || "-"}</div>
          <div style={{ color: "#475569" }}>Email: {company?.email || "-"}</div>
          <div style={{ color: "#475569" }}>Website: {company?.website ? formatWebsite(company.website) : "-"}</div>
        </div>

        <div style={{ ...styles.rightColumn, ...avoidBreak }}>
          <div style={styles.logoArea}>
            {logoSrc ? (
              <div style={styles.logoFrame}>
                <img src={logoSrc} alt={company?.name || "Company logo"} style={{ height: "60px", width: "auto", maxWidth: "150px", objectFit: "contain", display: "block" }} crossOrigin="anonymous" />
              </div>
            ) : (
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>{company?.name || "Company"}</div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.billSummaryRow}>
        <div style={styles.billColumn}>
          <div style={styles.label}>Bill To</div>
          <div style={{ fontSize: "20px", fontWeight: 700, marginTop: "8px" }}>{customer.name || "-"}</div>
          <div style={{ marginTop: "6px", whiteSpace: "pre-line", color: "#475569" }}>{customer.address || "-"}</div>
          <div style={{ marginTop: "8px", color: "#475569" }}>Phone: {customer.phone || "-"}</div>
          <div style={{ color: "#475569" }}>Email: {customer.email || "-"}</div>
          <div style={{ color: "#475569" }}>Zip Code: {customer.zipCode || "-"}</div>
          <div style={{ color: "#475569" }}>Place of Supply: {customer.placeOfSupply || "-"}</div>
          <div style={{ color: "#475569" }}>GSTIN: {customer.gstin || "-"}</div>
        </div>

        <div style={styles.rightColumn}>
          <div style={styles.titleBox}>
            <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#4338ca", fontWeight: 700 }}>
              {type === "invoice" ? "Tax Invoice" : "Quotation"}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "8px" }}>{invoiceNumber}</div>
            <div style={{ marginTop: "10px", color: "#334155" }}>Due Date: {formatDate(dueDate)}</div>
            <div style={{ color: "#334155" }}>Tax Mode: {taxType === "igst" ? "IGST 18%" : "CGST 9% + SGST 9%"}</div>
          </div>
        </div>
      </div>

      <div style={{ ...styles.section, ...avoidBreak }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.cell, ...styles.head }}>Description</th>
              <th style={{ ...styles.cell, ...styles.head }}>HSN Code</th>
              <th style={{ ...styles.cell, ...styles.head, width: "68px" }}>Qty</th>
              <th style={{ ...styles.cell, ...styles.head, width: "100px" }}>Rate</th>
              <th style={{ ...styles.cell, ...styles.head, width: "118px" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.itemId ?? `${item.description}-${item.hsnCode}`} style={avoidBreak}>
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

      <div style={styles.summaryRow}>
        <div style={styles.leftColumn}>
          <div style={styles.wordsBox}>
            <div style={styles.label}>Total In Words</div>
            <div style={{ marginTop: "10px", fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{englishAmountInWords}</div>
            <div style={{ marginTop: "6px", fontSize: "13px", color: "#334155", fontFamily: '"Noto Sans Devanagari", "Noto Sans", sans-serif' }}>{hindiAmountInWords}</div>
            <div style={styles.divider}>
              <div style={styles.label}>Terms & Conditions</div>
              <div style={{ marginTop: "8px", whiteSpace: "pre-line", color: "#475569" }}>{terms || "-"}</div>
            </div>
          </div>
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
      </div>

      <div style={styles.notesRow}>
        <div style={styles.notesCard}>
          <div style={styles.label}>Notes</div>
          <div style={{ marginTop: "8px", whiteSpace: "pre-line", color: "#475569" }}>{notes || "-"}</div>
        </div>
        <div style={styles.secondaryCard}>
          <div style={styles.label}>Reference</div>
          <div style={{ marginTop: "8px", color: "#64748b" }}>Reserved for internal remarks, stamp, or future metadata.</div>
        </div>
      </div>
    </div>
  );
}
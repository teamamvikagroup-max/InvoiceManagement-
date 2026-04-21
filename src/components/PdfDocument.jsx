import { formatCurrency } from "../utils/calculations";
import { formatAmountInWordsEnglish, formatDate, formatWebsite } from "../utils/formatters";

const avoidBreak = {
  breakInside: "avoid",
  pageBreakInside: "avoid",
};

function getHeadingStyle(value, baseSize, compactSize) {
  return {
    fontSize: value && value.length > 28 ? compactSize : baseSize,
    fontWeight: 700,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  };
}

const styles = {
  page: {
    width: "794px",
    backgroundColor: "rgba(255,255,255,0.98)",
    color: "#0f172a",
    fontFamily: '"Noto Sans", "Noto Sans Devanagari", "Segoe UI Symbol", "Arial Unicode MS", Arial, sans-serif',
    fontSize: "12px",
    lineHeight: 1.42,
    padding: "24px 28px 86px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "32px",
    alignItems: "flex-start",
    borderBottom: "1px solid #cbd5e1",
    paddingBottom: "20px",
  },
  detailsColumn: {
    maxWidth: "450px",
    minWidth: 0,
  },
  rightColumn: {
    width: "236px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  logoArea: {
    width: "100%",
    minHeight: "110px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  logoFrame: {
    border: "none",
    borderRadius: "20px",
    padding: "14px 18px",
    backgroundColor: "rgba(255,255,255,0.98)",
    boxShadow: "0 14px 28px rgba(15, 23, 42, 0.08)",
  },
  billSummaryRow: {
    ...avoidBreak,
    display: "flex",
    justifyContent: "space-between",
    gap: "32px",
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
    border: "none",
    background: "linear-gradient(180deg, #eef2ff 0%, #e0e7ff 100%)",
    borderRadius: "20px",
    padding: "14px 16px",
    width: "100%",
    marginTop: "14px",
    boxShadow: "0 14px 28px rgba(99, 102, 241, 0.12)",
  },
  section: {
    marginTop: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
    borderRadius: "20px",
    overflow: "hidden",
  },
  cell: {
    border: "none",
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
    marginTop: "14px",
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
    border: "none",
    borderRadius: "20px",
    padding: "14px 16px",
    backgroundColor: "rgba(255,255,255,0.98)",
  },
  divider: {
    marginTop: "12px",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "12px",
  },
  totals: {
    ...avoidBreak,
    width: "340px",
    border: "none",
    borderRadius: "20px",
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
    marginTop: "14px",
  },
  notesCard: {
    ...avoidBreak,
    width: "68%",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "12px 14px",
    backgroundColor: "rgba(255,255,255,0.98)",
  },
  secondaryCard: {
    ...avoidBreak,
    width: "32%",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "12px 14px",
    backgroundColor: "#f8fafc",
    minHeight: "84px",
  },
};

export default function PdfDocument({ type, invoiceNumber, financialYear, dueDate, company, customer, items, totals, notes, terms, taxType }) {
  const englishAmountInWords = formatAmountInWordsEnglish(totals.totalAmount);
  const logoSrc = company?.logoUrl || company?.logoBase64 || "";

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div style={styles.detailsColumn}>
          <div style={getHeadingStyle(company?.name, "28px", "24px")}>{company?.name || "Company Name"}</div>
          <div style={{ marginTop: "8px", whiteSpace: "pre-line", color: "#475569", overflowWrap: "anywhere" }}>{company?.address || "-"}</div>
          <div style={{ marginTop: "10px", color: "#475569", overflowWrap: "anywhere" }}>GSTIN: {company?.gstin || "-"}</div>
          <div style={{ color: "#475569", overflowWrap: "anywhere" }}>Phone: {company?.phone || "-"}</div>
          <div style={{ color: "#475569", overflowWrap: "anywhere" }}>Email: {company?.email || "-"}</div>
          <div style={{ color: "#475569", overflowWrap: "anywhere" }}>Website: {company?.website ? formatWebsite(company.website) : "-"}</div>
        </div>

        <div style={{ ...styles.rightColumn, ...avoidBreak }}>
          <div style={styles.logoArea}>
            {logoSrc ? (
              <div style={styles.logoFrame}>
                <img src={logoSrc} alt={company?.name || "Company logo"} style={{ height: "84px", width: "auto", maxWidth: "182px", objectFit: "contain", display: "block", margin: "0 auto" }} crossOrigin="anonymous" />
              </div>
             ) : (<div style={{ width: "182px", height: "84px" }} />)}
          </div>
        </div>
      </div>

      <div style={styles.billSummaryRow}>
        <div style={styles.billColumn}>
          <div style={styles.label}>Bill To</div>
          <div style={getHeadingStyle(customer?.name, "20px", "18px")}>{customer.name || "-"}</div>
          <div style={{ marginTop: "6px", whiteSpace: "pre-line", color: "#475569", overflowWrap: "anywhere" }}>{customer.address || "-"}</div>
          <div style={{ marginTop: "8px", color: "#475569", overflowWrap: "anywhere" }}>Phone: {customer.phone || "-"}</div>
          <div style={{ color: "#475569", overflowWrap: "anywhere" }}>Email: {customer.email || "-"}</div>
          <div style={{ color: "#475569", overflowWrap: "anywhere" }}>Zip Code: {customer.zipCode || "-"}</div>
          <div style={{ color: "#475569", overflowWrap: "anywhere" }}>Place of Supply: {customer.placeOfSupply || "-"}</div>
          <div style={{ color: "#475569", overflowWrap: "anywhere" }}>GSTIN: {customer.gstin || "-"}</div>
        </div>

        <div style={styles.rightColumn}>
          <div style={styles.titleBox}>
            <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#4338ca", fontWeight: 700 }}>
              {type === "invoice" ? "Tax Invoice" : "Quotation"}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "8px", overflowWrap: "anywhere" }}>{invoiceNumber}</div>
            {type === "invoice" && financialYear ? <div style={{ marginTop: "10px", color: "#334155" }}>FY: {financialYear}</div> : <div style={{ marginTop: "10px", color: "#334155" }}>Due Date: {formatDate(dueDate)}</div>}
            {type === "invoice" && financialYear ? <div style={{ color: "#334155" }}>Due Date: {formatDate(dueDate)}</div> : null}
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
                <td style={{ ...styles.cell, overflowWrap: "anywhere" }}>{item.description}</td>
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
            <div style={{ marginTop: "10px", fontSize: "14px", fontWeight: 700, color: "#0f172a", overflowWrap: "anywhere" }}>{englishAmountInWords}</div>
            <div style={styles.divider}>
              <div style={styles.label}>Terms & Conditions</div>
              <div style={{ marginTop: "8px", whiteSpace: "pre-line", color: "#475569", overflowWrap: "anywhere" }}>{terms || "-"}</div>
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
        <div style={{ ...styles.notesCard, width: "50%", minHeight: "96px" }}>
          <div style={styles.label}>Notes</div>
          <div style={{ marginTop: "8px", whiteSpace: "pre-line", color: "#475569", overflowWrap: "anywhere" }}>{notes || "-"}</div>
        </div>
        <div style={{ ...styles.secondaryCard, width: "50%", minHeight: "96px" }}>
          <div style={styles.label}>Reference</div>
        </div>
      </div>
    </div>
  );
}






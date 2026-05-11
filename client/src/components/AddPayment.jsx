import { useState } from "react";
import API from "../api";

function AddPayment({ onPaymentAdded }) {
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount]       = useState("");
  const [datePaid, setDatePaid]   = useState("");
  const [duration, setDuration]   = useState("");
  const [receipt, setReceipt]     = useState(null);
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/payments", {
        student_id: studentId,
        amount,
        date_paid:  datePaid,
        duration,
      });

      setReceipt({
        receiptNo:   res.data.renewal_no,
        studentName: res.data.student_name,
        studentId:   res.data.student_id,
        amount:      res.data.amount,
        datePaid:    res.data.date_paid,
        duration:    res.data.duration,
        dueDate:     res.data.due_date,
        issuedAt:    new Date().toLocaleString(),
      });

      if (onPaymentAdded) onPaymentAdded();

      setStudentId("");
      setAmount("");
      setDatePaid("");
      setDuration("");
    } catch (err) {
      alert("Payment failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getReceiptHTML = () => `
    <html>
      <head>
        <title>Receipt ${receipt.receiptNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', Arial, sans-serif;
            padding: 36px 32px;
            color: #18181b;
            background: #fff;
            width: 380px;
          }
          .header {
            text-align: center;
            padding-bottom: 18px;
            margin-bottom: 20px;
            border-bottom: 2px solid #dc2626;
          }
          .header h1 {
            font-size: 22px;
            font-weight: 800;
            color: #dc2626;
          }
          .header p {
            font-size: 12px;
            color: #71717a;
            margin-top: 4px;
          }
          .receipt-no {
            text-align: center;
            background: #fef2f2;
            border: 1px dashed #dc2626;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 22px;
            font-size: 14px;
            color: #dc2626;
            font-weight: 700;
            letter-spacing: 1px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f4f4f5;
            font-size: 13px;
          }
          .label { color: #71717a; font-weight: 500; }
          .value { font-weight: 600; color: #18181b; }
          .total-box {
            background: #18181b;
            color: white;
            padding: 14px 16px;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            margin-top: 18px;
            font-size: 15px;
            font-weight: 700;
          }
          .due-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #15803d;
            padding: 10px 16px;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 13px;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            margin-top: 26px;
            font-size: 11px;
            color: #a1a1aa;
            border-top: 1px solid #f4f4f5;
            padding-top: 14px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PAYMENT RECEIPT</h1>
          <p>Official payment confirmation</p>
        </div>
        <div class="receipt-no">${receipt.receiptNo}</div>
        <div class="row">
          <span class="label">Student Name</span>
          <span class="value">${receipt.studentName}</span>
        </div>
        <div class="row">
          <span class="label">Student ID</span>
          <span class="value">#${receipt.studentId}</span>
        </div>
        <div class="row">
          <span class="label">Date Paid</span>
          <span class="value">${receipt.datePaid}</span>
        </div>
        <div class="row">
          <span class="label">Duration</span>
          <span class="value">${receipt.duration} Month(s)</span>
        </div>
        <div class="row">
          <span class="label">Issued At</span>
          <span class="value">${receipt.issuedAt}</span>
        </div>
        <div class="total-box">
          <span>Amount Paid</span>
          <span>KSh ${Number(receipt.amount).toLocaleString()}</span>
        </div>
        <div class="due-box">
          <span>Subscription Due</span>
          <span>${receipt.dueDate}</span>
        </div>
        <div class="footer">
          Thank you for your payment.<br/>
          Please keep this receipt for your records.
        </div>
      </body>
    </html>
  `;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=420,height=680");
    printWindow.document.write(getReceiptHTML());
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownload = () => {
    const blob = new Blob([getReceiptHTML()], { type: "text/html" });
    const url  = URL.createObjectURL(blob);

    // Create hidden iframe to render and trigger PDF-style download
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      // Use print-to-PDF via the iframe
      const link = document.createElement("a");
      link.href = url;
      link.download = `Receipt-${receipt.receiptNo}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    };
  };

  return (
    <div>
      <h2>Add Payment</h2>

      {/* ── Receipt Preview ── */}
      {receipt && (
        <div style={{
          background: "#fef2f2",
          border: "1px dashed #dc2626",
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}>
          {/* Receipt Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#dc2626" }}>
              {receipt.receiptNo}
            </h3>
            <span style={{ fontSize: 11, color: "#71717a" }}>{receipt.issuedAt}</span>
          </div>

          {/* Receipt Rows */}
          {[
            ["Student Name", receipt.studentName],
            ["Student ID",   `#${receipt.studentId}`],
            ["Amount",       `KSh ${Number(receipt.amount).toLocaleString()}`],
            ["Date Paid",    receipt.datePaid],
            ["Duration",     `${receipt.duration} Month(s)`],
            ["Due Date",     receipt.dueDate],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "7px 0",
              borderBottom: "1px solid #fecaca",
              fontSize: 13,
            }}>
              <span style={{ color: "#71717a", fontWeight: 500 }}>{label}</span>
              <span style={{ fontWeight: 600, color: "#18181b" }}>{value}</span>
            </div>
          ))}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={handlePrint}
              style={{ flex: 1, background: "#18181b" }}
            >
              🖨️ Print
            </button>
            <button
              onClick={handleDownload}
              style={{ flex: 1, background: "#15803d" }}
            >
              ⬇️ Download
            </button>
            <button
              onClick={() => setReceipt(null)}
              style={{ flex: 1, background: "#71717a" }}
            >
              New Payment
            </button>
          </div>
        </div>
      )}

      {/* ── Payment Form ── */}
      {!receipt && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            placeholder="Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          />
          <input
            placeholder="Amount (KSh)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input
            type="date"
            value={datePaid}
            onChange={(e) => setDatePaid(e.target.value)}
            required
          />
          <input
            placeholder="Duration (months)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Add Payment"}
          </button>
        </form>
      )}
    </div>
  );
}

export default AddPayment;
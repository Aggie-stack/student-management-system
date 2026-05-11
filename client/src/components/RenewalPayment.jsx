import { useState } from "react";
import API from "../api";

const INITIAL_PAYMENT = {
  amount: "",
  date_paid: "",
  duration: "",
};

function RenewalPayment({ onRenewalAdded }) {
  const [step, setStep]         = useState(1);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [student, setStudent]   = useState(null);
  const [payment, setPayment]   = useState(INITIAL_PAYMENT);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const setPaymentField = (field, value) =>
    setPayment((prev) => ({ ...prev, [field]: value }));

  // ── Step 1: Search for student by ID or name ──
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a student ID or name.");
      return;
    }
    setError("");
    setStudent(null);

    try {
      setSearching(true);

      // Try numeric ID first, otherwise search by name
      const isId = /^\d+$/.test(searchQuery.trim());
      let res;

      if (isId) {
        res = await API.get(`/students/${searchQuery.trim()}`);
        setStudent(res.data);
      } else {
        res = await API.get(`/students?search=${encodeURIComponent(searchQuery.trim())}`);
        // Expect either a single object or an array; take first match
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!data) {
          setError("No student found with that name.");
          return;
        }
        setStudent(data);
      }

      setStep(2);
    } catch (err) {
      console.error("Search error:", err.response?.data);
      setError(err.response?.data?.error || "Student not found. Check the ID or name.");
    } finally {
      setSearching(false);
    }
  };

  // ── Step 2: Submit renewal payment ──
  const handleRenew = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!payment.amount || !payment.date_paid || !payment.duration) {
      setError("Please fill in all payment fields.");
      return;
    }

    try {
      setSaving(true);

      await API.post("/payments", {
        student_id: student.id,
        amount:     Number(payment.amount),
        date_paid:  payment.date_paid,
        duration:   Number(payment.duration),
      });

      setSuccess(`Renewal recorded for ${student.name} (ID: ${student.id}).`);
      setPayment(INITIAL_PAYMENT);
      setSearchQuery("");
      setStudent(null);
      setStep(1);

      if (onRenewalAdded) onRenewalAdded(student.id);
    } catch (err) {
      console.error("Renewal error:", err.response?.data);
      setError(err.response?.data?.error || "Renewal failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setStudent(null);
    setSearchQuery("");
    setPayment(INITIAL_PAYMENT);
    setError("");
    setSuccess("");
  };

  return (
    <div>
      <h2>Renewal Payment</h2>

      {/* Success Message */}
      {success && (
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          color: "#15803d",
          padding: "10px 14px",
          borderRadius: 8,
          fontSize: 13,
          marginBottom: 12,
          fontWeight: 500,
        }}>
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          padding: "10px 14px",
          borderRadius: 8,
          fontSize: 13,
          marginBottom: 12,
          fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleRenew}>

        {/* ── Step 1: Find Student ── */}
        {step === 1 && (
          <div className="form-box">
            <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700 }}>
              Step 1 — Find Student
            </h3>

            <input
              placeholder="Student ID or Full Name *"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            />

            <div className="form-footer">
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                style={{ background: searching ? "#aaa" : undefined }}
              >
                {searching ? "Searching..." : "Search →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Confirm Student + Payment ── */}
        {step === 2 && student && (
          <div className="form-box">
            <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700 }}>
              Step 2 — Renewal Payment
            </h3>

            {/* Student summary card */}
            <div style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 13,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: "#1e293b" }}>
                {student.name}
              </div>
              <div style={{ color: "#64748b" }}>
                ID: {student.id} &nbsp;·&nbsp; {student.course} &nbsp;·&nbsp; {student.level}
              </div>
              <div style={{ color: "#64748b" }}>
                {student.phone}{student.email ? ` · ${student.email}` : ""}
              </div>
            </div>

            <input
              type="number"
              placeholder="Amount (KSh) *"
              min="1"
              value={payment.amount}
              onChange={(e) => setPaymentField("amount", e.target.value)}
              required
            />
            <input
              type="date"
              value={payment.date_paid}
              onChange={(e) => setPaymentField("date_paid", e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Duration (Months) *"
              min="1"
              value={payment.duration}
              onChange={(e) => setPaymentField("duration", e.target.value)}
              required
            />

            <div className="form-footer">
              <button type="button" onClick={handleReset}>
                ← Back
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{ background: saving ? "#aaa" : undefined }}
              >
                {saving ? "Saving..." : "Record Renewal"}
              </button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}

export default RenewalPayment;
import { useState } from "react";
import API from "../api";

const INITIAL_STUDENT = {
  name: "", phone: "", email: "", gender: "",
  mode: "", level: "", course: "", membership: false,
};

const INITIAL_PAYMENT = {
  amount: "", date_paid: "", duration: "",
};

function RegisterStudent({ onStudentAdded }) {
  const [step, setStep]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState(INITIAL_STUDENT);
  const [payment, setPayment] = useState(INITIAL_PAYMENT);
  const [error, setError]   = useState("");

  const setStudentField = (field, value) =>
    setStudent((prev) => ({ ...prev, [field]: value }));

  const setPaymentField = (field, value) =>
    setPayment((prev) => ({ ...prev, [field]: value }));

  const handleNext = () => {
    // Validate student fields before moving to step 2
    if (!student.name || !student.phone || !student.gender || !student.mode || !student.level || !student.course) {
      setError("Please fill in all student fields.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Validate payment fields
    if (!payment.amount || !payment.date_paid || !payment.duration) {
      setError("Please fill in all payment fields.");
      return;
    }

    try {
      setSaving(true);

      // 1. Create student
      const res = await API.post("/students", {
        ...student,
        membership: student.membership ? 1 : 0,
      });

      const studentId = res.data.id;

      if (!studentId) {
        setError("Student creation failed. No ID returned.");
        return;
      }

      // 2. Create payment — cast to correct types
      await API.post("/payments", {
        student_id: studentId,
        amount:     Number(payment.amount),
        date_paid:  payment.date_paid,        // already "YYYY-MM-DD" from date input
        duration:   Number(payment.duration),
      });

      setStudent(INITIAL_STUDENT);
      setPayment(INITIAL_PAYMENT);
      setStep(1);

      if (onStudentAdded) onStudentAdded(studentId);

    } catch (err) {
      console.error("Full error:", err.response?.data);
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>Register Student</h2>

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

      <form onSubmit={handleRegister}>

        {/* ── Step 1: Student Details ── */}
        {step === 1 && (
          <div className="form-box">
            <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700 }}>
              Step 1 — Student Details
            </h3>

            <input
              placeholder="Full Name *"
              value={student.name}
              onChange={(e) => setStudentField("name", e.target.value)}
              required
            />
            <input
              placeholder="Phone No. *"
              value={student.phone}
              onChange={(e) => setStudentField("phone", e.target.value)}
              required
            />
            <input
              placeholder="Email Address"
              type="email"
              value={student.email}
              onChange={(e) => setStudentField("email", e.target.value)}
            />

            <select
              value={student.gender}
              onChange={(e) => setStudentField("gender", e.target.value)}
              required
            >
              <option value="">Select Gender *</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select
              value={student.mode}
              onChange={(e) => setStudentField("mode", e.target.value)}
              required
            >
              <option value="">Mode of Learning *</option>
              <option value="online">Online</option>
              <option value="physical">Physical</option>
            </select>

            <select
              value={student.level}
              onChange={(e) => setStudentField("level", e.target.value)}
              required
            >
              <option value="">Select Level *</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <input
              placeholder="Course *"
              value={student.course}
              onChange={(e) => setStudentField("course", e.target.value)}
              required
            />

            <div className="form-footer">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={student.membership}
                  onChange={(e) => setStudentField("membership", e.target.checked)}
                />
                Has Membership Card
              </label>

              <button type="button" onClick={handleNext}>
                Next → Payment
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Payment Details ── */}
        {step === 2 && (
          <div className="form-box">
            <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700 }}>
              Step 2 — Payment Details
            </h3>

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
              <button type="button" onClick={() => setStep(1)}>
                ← Back
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{ background: saving ? "#aaa" : undefined }}
              >
                {saving ? "Registering..." : "Register Student"}
              </button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}

export default RegisterStudent;
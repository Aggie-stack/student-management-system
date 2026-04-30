import { useState } from "react";
import API from "../api";

function AddPayment({ onPaymentAdded }) {
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [datePaid, setDatePaid] = useState("");
  const [duration, setDuration] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await API.post("/payments", {
      student_id: studentId,
      amount,
      date_paid: datePaid,
      duration
    });

    alert(`Payment added! Renewal: ${res.data.renewal_no}`);

    if (onPaymentAdded) onPaymentAdded(); // 🔥 refresh trigger

    setStudentId("");
    setAmount("");
    setDatePaid("");
    setDuration("");
  };

  return (
    <div>
      <h2>Add Payment</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />

        <input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          type="date"
          value={datePaid}
          onChange={(e) => setDatePaid(e.target.value)}
        />

        <input
          placeholder="Duration (months)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <button type="submit">Add Payment</button>
      </form>
    </div>
  );
}

export default AddPayment;
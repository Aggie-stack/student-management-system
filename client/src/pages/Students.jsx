import { useState } from "react";
import AddStudent from "../components/AddStudent";
import AddPayment from "../components/AddPayment";
import StudentList from "../components/StudentList";

function Students() {
  const [refresh, setRefresh] = useState(0);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const triggerRefresh = () => {
    setRefresh((r) => r + 1);
  };

  return (
    <div className="page-container">

      <div className="top-actions">
        <button onClick={() => setShowStudentModal(true)}>
          + Add Student
        </button>

        <button onClick={() => setShowPaymentModal(true)}>
          + Add Payment
        </button>
      </div>

      {showStudentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <AddStudent
              onStudentAdded={() => {
                triggerRefresh();
                setShowStudentModal(false);
              }}
            />
            <button onClick={() => setShowStudentModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <AddPayment
              onPaymentAdded={() => {
                triggerRefresh();
                setShowPaymentModal(false);
              }}
            />
            <button onClick={() => setShowPaymentModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <StudentList
        refresh={refresh}
        triggerRefresh={triggerRefresh}
      />
    </div>
  );
}

export default Students;
function EditStudentModal({
  editStudent,
  setEditStudent,
  editStep,
  setEditStep,
  paymentData,
  setPaymentData,
  handleUpdateStudent,
  handleSaveAll,
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">

        {/* STEP 1 - STUDENT DETAILS */}
        {editStep === 1 && (
          <>
            <h3>Edit Student</h3>

            <input
              value={editStudent.name || ""}
              onChange={(e) =>
                setEditStudent({ ...editStudent, name: e.target.value })
              }
              placeholder="Full Name"
            />

            <input
              value={editStudent.email || ""}
              onChange={(e) =>
                setEditStudent({ ...editStudent, email: e.target.value })
              }
              placeholder="Email Address"
              type="email"
            />

            <select
              value={editStudent.gender || ""}
              onChange={(e) =>
                setEditStudent({ ...editStudent, gender: e.target.value })
              }
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select
              value={editStudent.mode || ""}
              onChange={(e) =>
              setEditStudent({ ...editStudent, mode: e.target.value })
            }
          >
            <option value="">Mode of Learning</option>
            <option value="online">Online</option>
            <option value="physical">Physical</option>
          </select>

          <select
            value={editStudent.level || ""}
            onChange={(e) =>
            setEditStudent({ ...editStudent, level: e.target.value })
          }
        >
          <option value="">Level</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
      </select>

            <input
              value={editStudent.phone || ""}
              onChange={(e) =>
                setEditStudent({ ...editStudent, phone: e.target.value })
              }
              placeholder="Phone No"
            />

            <input
              value={editStudent.course || ""}
              onChange={(e) =>
                setEditStudent({ ...editStudent, course: e.target.value })
              }
              placeholder="Course"
            />

            <label>
              Membership:
              <input
                type="checkbox"
                checked={!!editStudent.membership}
                onChange={(e) =>
                  setEditStudent({
                    ...editStudent,
                    membership: e.target.checked,
                  })
                }
              />
            </label>

            <div className="modal-actions">
              <button onClick={() => setEditStudent(null)}>
                Cancel
              </button>

              <button onClick={handleUpdateStudent}>
                Next → Payment
              </button>
            </div>
          </>
        )}

        {/* STEP 2 - PAYMENT DETAILS */}
        {editStep === 2 && (
          <>
            <h3>Payment Details</h3>

            <input
              type="number"
              placeholder="Amount (KSh)"
              value={paymentData.amount}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  amount: e.target.value,
                })
              }
            />

            <input
              type="date"
              value={paymentData.date_paid}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  date_paid: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Duration (Months)"
              value={paymentData.duration}
              onChange={(e) =>
                setPaymentData({
                  ...paymentData,
                  duration: e.target.value,
                })
              }
            />

            <div className="modal-actions">
              <button onClick={() => setEditStep(1)}>
                ← Back
              </button>

              <button
                onClick={handleSaveAll}
                style={{
                  backgroundColor: "green",
                  color: "white",
                  padding: "10px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Save All
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default EditStudentModal;
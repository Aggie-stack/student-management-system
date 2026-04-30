import { useEffect, useState } from "react";
import API from "../api";
import { FaEdit, FaTrash, FaSearch } from "react-icons/fa";

function StudentList({ refresh }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [membershipFilter, setMembershipFilter] = useState("All");

  const [editStudent, setEditStudent] = useState(null);
  const [deleteStudent, setDeleteStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, [refresh]);

  const fetchStudents = async () => {
    const res = await API.get("/students");
    setStudents(res.data);
  };

const [editStep, setEditStep] = useState(1); 
 const [paymentData, setPaymentData] = useState({
  amount: "",
  date_paid: "",
  duration: ""
});

  // ================= EDIT =================
  const openEditModal = (student) => {
    setEditStudent({ ...student });
    setEditStep(1)
    setPaymentData({
      amount: student.amount || "",
      date_paid: student.date_paid || "",
      duration: student.duration || ""
    });
  };

  const handleUpdateStudent = async () => {
    await API.put(`/students/${editStudent.id}`, editStudent);
    setEditStep(2);
  };

  const handleSavePayment = async () => {
  await API.post("/payments", {
    student_id: editStudent.id,
    amount: paymentData.amount,
    date_paid: paymentData.date_paid,
    duration: paymentData.duration
  });

    setEditStudent(null);
    setEditStep(1);
    fetchStudents();
  };

  // ================= DELETE =================
  const openDeleteModal = (student) => {
    setDeleteStudent(student);
  }; 

  const confirmDelete = async () => {
    await API.delete(`/students/${deleteStudent.id}`);
    setDeleteStudent(null);
    fetchStudents();
  };

  // ================= FILTER =================
  const filteredStudents = students.filter((s) => {
    const text = search.toLowerCase();

    const matchesSearch =
      s.name?.toLowerCase().includes(text) ||
      s.course?.toLowerCase().includes(text) ||
      s.phone?.toLowerCase().includes(text) ||
      String(s.id).includes(text) ||
      s.status?.toLowerCase().includes(text);

    const matchesStatus =
      statusFilter === "All" || s.status === statusFilter;

    const matchesMembership =
      membershipFilter === "All" ||
      (membershipFilter === "Yes" && s.membership) ||
      (membershipFilter === "No" && !s.membership);

    return matchesSearch && matchesStatus && matchesMembership;
  });

  return (
    <div>
      <h2>Students List</h2>

      {/* SEARCH + FILTER */}
      <div className="search-row">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="search-input"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="No Payment">No Payment</option>
          </select>

          <select
            value={membershipFilter}
            onChange={(e) => setMembershipFilter(e.target.value)}
            className="search-input"
          >
            <option value="All">All Membership</option>
            <option value="Yes">Members</option>
            <option value="No">Non Members</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Course</th>
            <th>Phone</th>
            <th>Amount</th>
            <th>Date Paid</th>
            <th>Duration</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Membership</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredStudents.length > 0 ? (
            filteredStudents.map((s, index) => (
              <tr key={s.id}>
                <td>{index + 1}</td>
                <td>{s.name}</td>
                <td>{s.course}</td>
                <td>{s.phone}</td>
                <td>{s.amount}</td>
                <td>{s.date_paid}</td>
                <td>{s.duration}</td>
                <td>{s.due_date}</td>

                <td>
                  <span className={`status ${s.status?.toLowerCase().replace(/\s+/g, "")}`}>
                    {s.status}
                  </span>
                </td>

                <td>
                  <span className={s.membership ? "membership yes" : "membership no"}>
                    {s.membership ? "Yes" : "No"}
                  </span>
                </td>

                <td className="actions-cell">
                  <button className="icon-btn edit" onClick={() => openEditModal(s)}>
                    <FaEdit />
                  </button>

                  <button className="icon-btn delete" onClick={() => openDeleteModal(s)}>
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="no-results">
                ❌ No students found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ================= EDIT MODAL ================= */}
     {editStudent && (
  <div className="modal">
    <div className="modal-content">

      {/* STEP 1: STUDENT */}
      {editStep === 1 && (
        <>
          <h3>Edit Student</h3>

          <input
            value={editStudent.name}
            onChange={(e) =>
              setEditStudent({ ...editStudent, name: e.target.value })
            }
            placeholder="Name"
          />

          <input
            value={editStudent.phone}
            onChange={(e) =>
              setEditStudent({ ...editStudent, phone: e.target.value })
            }
            placeholder="Phone"
          />

          <input
            value={editStudent.course}
            onChange={(e) =>
              setEditStudent({ ...editStudent, course: e.target.value })
            }
            placeholder="Course"
          />

          <label>
            Membership:
            <input
              type="checkbox"
              checked={editStudent.membership}
              onChange={(e) =>
                setEditStudent({
                  ...editStudent,
                  membership: e.target.checked,
                })
              }
            />
          </label>

          <div className="modal-actions">
            <button onClick={() => setEditStudent(null)}>Cancel</button>
            <button onClick={handleUpdateStudent}>
              Next → Payment
            </button>
          </div>
        </>
      )}

      {/* STEP 2: PAYMENT */}
      {editStep === 2 && (
        <>
          <h3>Payment Details</h3>

          <input
            type="number"
            placeholder="Amount"
            value={paymentData.amount}
            onChange={(e) =>
              setPaymentData({ ...paymentData, amount: e.target.value })
            }
          />

          <input
            type="date"
            value={paymentData.date_paid}
            onChange={(e) =>
              setPaymentData({ ...paymentData, date_paid: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Duration (months)"
            value={paymentData.duration}
            onChange={(e) =>
              setPaymentData({ ...paymentData, duration: e.target.value })
            }
          />

          <div className="modal-actions">
            <button onClick={() => setEditStep(1)}>
              ← Back
            </button>

            <button onClick={handleSavePayment}>
              Save All
            </button>
          </div>
        </>
      )}

    </div>
  </div>
)}
      {/* ================= DELETE MODAL ================= */}
      {deleteStudent && (
        <div className="modal">
          <div className="modal-content">
            <h3>Delete Student</h3>
            <p>
              Are you sure you want to delete <b>{deleteStudent.name}</b>?
            </p>

            <div className="modal-actions">
              <button onClick={() => setDeleteStudent(null)}>Cancel</button>
              <button className="danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentList; 
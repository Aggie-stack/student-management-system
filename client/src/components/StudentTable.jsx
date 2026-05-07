import { useState } from "react";
import ActionButtons from "./ActionButtons";

function StudentTable({ students, onHistory, onEdit, onDelete }) {
  const [selected, setSelected] = useState(null);


  return (
    <div className="table-wrapper">

      {/* TABLE */}
      <table className="modern-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Course</th>
            <th>Mode of Study</th>
            <th>Level</th>
            <th>Status</th>
            <th>Membership</th>
            <th>Actions</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {students.length > 0 ? (
            students.map((s) => (
              <tr key={s.id} onClick={() => setSelected(s)}>
                <td>{s.id}</td>
                <td className="name">{s.name}</td>
                <td>{s.course}</td>

                <td>
                  <span className={`badge ${s.mode}`}>
                    {s.mode}
                  </span>
                </td>

                <td>
                  <span className={`badge level-${s.level}`}>
                    {s.level}
                  </span>
                </td>

                <td>
                  <span className={`status ${s.status?.toLowerCase()}`}>
                    {s.status}
                  </span>
                </td>

                <td>
                  <span className={`membership ${s.membership ? "yes" : "no"}`}>
                      {s.membership ? "Yes" : "No"}
                  </span>
                 </td>

                <td onClick={(e) => e.stopPropagation()}>
                  <ActionButtons
                    student={s}
                    onHistory={onHistory}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="no-results">
                No students found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 📄 MODAL (DETAIL VIEW) */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="student-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{selected.name}</h3>

            <p><strong>Email Address:</strong> {selected.email}</p>
            <p><strong>Phone NO.:</strong> {selected.phone}</p>
            <p><strong>Gender:</strong> {selected.gender}</p>
            <p><strong>Amount (ksh):</strong> {selected.amount}</p>
            <p><strong>Date Paid:</strong> {selected.date_paid}</p>
            <p><strong>Due Date:</strong> {selected.due_date}</p>

            <button onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentTable;
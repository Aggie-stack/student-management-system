import { useEffect, useState } from "react";
import API from "../api";

import StudentTable from "./StudentTable";
import SearchFilter from "./SearchFilter";
import EditStudentModal from "./EditStudentModal";
import PaymentHistoryModal from "./PaymentHistoryModal";
import DeleteModal from "./DeleteModal";

function StudentList({ refresh, triggerRefresh }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [membershipFilter, setMembershipFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");

  const [editStudent, setEditStudent] = useState(null);
  const [deleteStudent, setDeleteStudent] = useState(null);

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [editPayment, setEditPayment] = useState(null);

  const [editStep, setEditStep] = useState(1);

  const [paymentData, setPaymentData] = useState({
    id: null,
    amount: "",
    date_paid: "",
    duration: "",
  });

  useEffect(() => {
    fetchStudents();
  }, [refresh]);

  const fetchStudents = async () => {
    try {
      const res = await API.get("/students");
      setStudents(res.data);
    } catch {
      alert("Failed to fetch students");
    }
  };

  const openEditModal = (student) => {
    setEditStudent({ ...student });
    setEditStep(1);

    setPaymentData({
      id: student.payment_id || null,
      amount: student.amount || "",
      date_paid: student.date_paid || "",
      duration: student.duration || "",
    });
  };

  const handleUpdateStudent = async () => {
    await API.put(`/students/${editStudent.id}`, editStudent);
    setEditStep(2);
  };

  const handleSaveAll = async () => {
  try {
    await API.put(`/students/${editStudent.id}`, editStudent);

    await API.post("/payments/upsert", {
      id: paymentData.id,
      student_id: editStudent.id,
      amount: paymentData.amount,
      date_paid: paymentData.date_paid,
      duration: paymentData.duration,
    });

    setEditStudent(null);
    setEditStep(1);

    setPaymentData({
      id: null,
      amount: "",
      date_paid: "",
      duration: "",
    });

    fetchStudents();
    triggerRefresh();

  } catch (err) {
    console.log(err);
    alert("Save failed");
  }
};

  const openPaymentHistory = async (student) => {
    setSelectedStudent(student);
    const res = await API.get(`/payments/${student.id}`);
    setPaymentHistory(res.data);
  };

  const updatePayment = async () => {
    await API.put(`/payments/${editPayment.id}`, editPayment);

    setEditPayment(null);

    const res = await API.get(`/payments/${selectedStudent.id}`);
    setPaymentHistory(res.data);

    fetchStudents();
    triggerRefresh();
  };

  const deletePayment = async (id) => {
    await API.delete(`/payments/${id}`);

    const res = await API.get(`/payments/${selectedStudent.id}`);
    setPaymentHistory(res.data);

    fetchStudents();
    triggerRefresh();
  };

  const confirmDelete = async () => {
    await API.delete(`/students/${deleteStudent.id}`);
    setDeleteStudent(null);
    fetchStudents();
    triggerRefresh();
  };

  const filteredStudents = students.filter((s) => {
    const text = search.toLowerCase();

    return (
      !text ||
      (
        s.name?.toLowerCase().includes(text) ||
        s.course?.toLowerCase().includes(text) ||
        String(s.phone || ""). toLowerCase().includes(text)
      )
     ) &&
      (statusFilter === "All" || s.status === statusFilter) &&
      (membershipFilter === "All" ||
        (membershipFilter === "Yes" && s.membership) ||
        (membershipFilter === "No" && !s.membership)) && 
        (modeFilter === "All" || s.mode === modeFilter) &&
        (levelFilter === "All" || s.level === levelFilter);
  });

  return (
    <div>
      <h2>Students List</h2>

      <SearchFilter
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        membershipFilter={membershipFilter}
        setMembershipFilter={setMembershipFilter}
        modeFilter={modeFilter}
        setModeFilter={setModeFilter}
        levelFilter={levelFilter}
        setLevelFilter={setLevelFilter}
      />

      <StudentTable
        students={filteredStudents}
        onHistory={openPaymentHistory}
        onEdit={openEditModal}
        onDelete={setDeleteStudent}
      />

      {editStudent && (
        <EditStudentModal
          editStudent={editStudent}
          setEditStudent={setEditStudent}
          editStep={editStep}
          setEditStep={setEditStep}
          paymentData={paymentData}
          setPaymentData={setPaymentData}
          handleUpdateStudent={handleUpdateStudent}
          handleSaveAll={handleSaveAll}   // ✅ FIXED
        />
      )}

      {selectedStudent && (
        <PaymentHistoryModal
          selectedStudent={selectedStudent}
          setSelectedStudent={setSelectedStudent}
          paymentHistory={paymentHistory}
          editPayment={editPayment}
          setEditPayment={setEditPayment}
          updatePayment={updatePayment}
          deletePayment={deletePayment}
        />
      )}

      {deleteStudent && (
        <DeleteModal
          deleteStudent={deleteStudent}
          setDeleteStudent={setDeleteStudent}
          confirmDelete={confirmDelete}
        />
      )}
    </div>
  );
}

export default StudentList;
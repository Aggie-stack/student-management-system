import { useEffect, useState } from "react";
import "./App.css";
import { FaHome, FaUserGraduate, FaMoneyBill, FaMoon, FaSun } from "react-icons/fa";

import Dashboard from "./components/Dashboard";
import AddStudent from "./components/AddStudent";
import AddPayment from "./components/AddPayment";
import StudentList from "./components/StudentList";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState("students");
  const [refresh, setRefresh] = useState(0); // 🔥 controls reload

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.body.classList.add("dark");
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    if (newMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className="layout">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>📚 System</h2>

        <button
          className={page === "dashboard" ? "active" : ""}
          onClick={() => setPage("dashboard")}
        >
          <FaHome /> Dashboard
        </button>

        <button
          className={page === "students" ? "active" : ""}
          onClick={() => setPage("students")}
        >
          <FaUserGraduate /> Students
        </button>

        <button
          className={page === "payments" ? "active" : ""}
          onClick={() => setPage("payments")}
        >
          <FaMoneyBill /> Payments
        </button>

        <hr />

        <button onClick={toggleTheme}>
          {darkMode ? <FaSun /> : <FaMoon />}
          {darkMode ? " Light Mode" : " Dark Mode"}
        </button>
      </div>

      {/* MAIN */}
      <div className="main">
        <h1>Student Management System</h1>

        {page === "dashboard" && <Dashboard />}

        {page === "students" && (
          <>
            <div className="forms-row">
              <div className="form-box">
                <AddStudent onStudentAdded={() => setRefresh(prev => prev + 1)} />
              </div>

              <div className="form-box">
                <AddPayment onPaymentAdded={() => setRefresh(prev => prev + 1)} />
              </div>
            </div>

            <StudentList refresh={refresh} />
          </>
        )}

        {page === "payments" && (
          <div className="form-box">
            <AddPayment onPaymentAdded={() => setRefresh(prev => prev + 1)} />
          </div>
        )}
      </div>

    </div>
  );
}

export default App;
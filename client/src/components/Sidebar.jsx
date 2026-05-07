import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaUserGraduate, FaMoneyBill, FaMoon, FaSun } from "react-icons/fa";

function Sidebar({ darkMode, toggleTheme }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="sidebar"
    >
      <h2 className="sidebar-title">📚 System</h2>

      <NavLink
        to="/dashboard"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        <FaHome /> Dashboard
      </NavLink>

      <NavLink
        to="/students"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        <FaUserGraduate /> Students
      </NavLink>

      <NavLink
        to="/payments"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        <FaMoneyBill /> Payments
      </NavLink>

      <hr />

      <button onClick={toggleTheme}>
        {darkMode ? <FaSun /> : <FaMoon />}
        {darkMode ? " Light Mode" : " Dark Mode"}
      </button>

      <button onClick={logout}>
        🚪 Logout
      </button>
    </div>
  );
}

export default Sidebar;
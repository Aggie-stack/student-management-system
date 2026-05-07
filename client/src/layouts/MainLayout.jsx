import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";

function MainLayout() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.body.classList.add("dark");
    }
  }, []);

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
      <Sidebar darkMode={darkMode} toggleTheme={toggleTheme} />

      <div className="main">
        <h1 className="page-title">Students Registration & Management System</h1>
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";

function MainLayout() {
  const [darkMode, setDarkMode] = useState(false);

  // -------------------------------
  // LOAD THEME ON FIRST MOUNT
  // -------------------------------
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      setDarkMode(true);
    } else {
      setDarkMode(false);
    }
  }, []);

  // -------------------------------
  // APPLY THEME WHEN darkMode CHANGES
  // -------------------------------
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // -------------------------------
  // TOGGLE THEME
  // -------------------------------
  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <div className="layout">
      <Sidebar darkMode={darkMode} toggleTheme={toggleTheme} />

      <div className="main">
        <h1 className="page-title">
          Students Registration & Management System
        </h1>

        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;
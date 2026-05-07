import axios from "axios";

const API = axios.create({
  baseURL: "https://student-management-system-w000.onrender.com",
  withCredentials: false
});

// Attach token safely
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;
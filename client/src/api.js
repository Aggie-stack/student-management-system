import axios from "axios";

const isDev = import.meta.env.DEV;

const API = axios.create({
  baseURL: isDev
    ? "http://127.0.0.1:5000"   // local Flask when running npm run dev
    : "https://student-management-system-w000.onrender.com", // production
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (["post", "put", "patch"].includes(config.method)) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

export default API;
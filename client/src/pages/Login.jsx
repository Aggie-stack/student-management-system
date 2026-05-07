import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await API.post("/login", {
        username,
        password,
      });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        navigate("/");
      } else {
        alert("Invalid response from server");
      }

    } catch (error) {
      alert(error.response?.data?.error || "Login failed");
      console.error(error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-form">
          <h2>Admin Login</h2>

          <input
            type="text"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleLogin}>Login</button>

          <p className="forgot">Forgot Password?</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
import { useEffect, useState } from "react";
import API from "../api";

function Dashboard() {
  const [data, setData] = useState({
    total_students: 0,
    total_income: 0,
    active_students: 0,
    expired_students: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get("/dashboard");
      setData(res.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>

      <div className="dashboard">
        <div className="card">
          <h3>Total Students</h3>
          <p>{data.total_students}</p>
        </div>

        <div className="card">
          <h3>Total Income</h3>
          <p>KES {data.total_income}</p>
        </div>

        <div className="card">
          <h3>Active</h3>
          <p>{data.active_students}</p>
        </div>

        <div className="card">
          <h3>Expired</h3>
          <p>{data.expired_students}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
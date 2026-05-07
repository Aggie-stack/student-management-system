import { useEffect, useState } from "react";
import API from "../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";

function Dashboard({ refresh }) {

  // =====================================================
  // STATE
  // =====================================================

  const [data, setData] = useState({
    total_students: 0,
    total_income: 0,
    active_students: 0,
    expired_students: 0,
    male_students: 0,
    female_students: 0,
    classes: [],
    mode_gender: [],
    level_gender: []
  });

  // month starts as null instead of ""
  const [month, setMonth] = useState(null);

  // year | month
  const [viewMode, setViewMode] = useState("year");

  const [loading, setLoading] = useState(false);

  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================

  const fetchData = async (
    selectedMonth = null,
    mode = "year"
  ) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      // ---------------- SAFE PARAMS ----------------
      // Only send month if month mode AND month exists

      const params = {};

      if (mode === "month" && selectedMonth) {
        params.month = selectedMonth;
      }

      const res = await API.get("/dashboard", {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setData({
        ...res.data,
        classes: res.data.classes || [],
        mode_gender: res.data.mode_gender || [],
        level_gender: res.data.level_gender || []
      });

    } catch (error) {
      console.error(
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    fetchData(month, viewMode);
  }, [refresh, month, viewMode]);

  // =====================================================
  // COLORS
  // =====================================================

  const COLORS = [
    "#ff4d4f",
    "#52c41a",
    "#1890ff",
    "#fadb14",
    "#fa8c16"
  ];

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="dashboard-container">

      <h2>📊 Dashboard</h2>

      {loading && <p>Loading dashboard...</p>}

      {/* ===================================================== */}
      {/* CARDS */}
      {/* ===================================================== */}

      <div className="dashboard-grid">

        <div className="card blue">
          <h3>Total Students</h3>
          <p>{data.total_students}</p>
        </div>

        <div className="card green">
          <h3>Total Income</h3>

          <p>
            {new Intl.NumberFormat("en-KE", {
              style: "currency",
              currency: "KES"
            }).format(data.total_income)}
          </p>
        </div>

        <div className="card teal">
          <h3>Active Students</h3>
          <p>{data.active_students}</p>
        </div>

        <div className="card red">
          <h3>Expired Students</h3>
          <p>{data.expired_students}</p>
        </div>

        <div className="card teal">
          <h3>Male Students</h3>
          <p>{data.male_students}</p>
        </div>

        <div className="card pink">
          <h3>Female Students</h3>
          <p>{data.female_students}</p>
        </div>

      </div>

      {/* ===================================================== */}
      {/* FILTERS */}
      {/* ===================================================== */}

      <div className="filter-row">

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "10px"
          }}
        >

          <button
            onClick={() => {
              setViewMode("year");
              setMonth(null);
            }}
          >
            📅 Year View
          </button>

          <button
            onClick={() => setViewMode("month")}
          >
            📆 Month View
          </button>

        </div>

        {/* MONTH SELECT */}

        {viewMode === "month" && (
          <select
            value={month || ""}
            onChange={(e) =>
              setMonth(e.target.value)
            }
          >
            <option value="">
              Select Month
            </option>

            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>

          </select>
        )}

      </div>

      {/* ===================================================== */}
      {/* PIE CHART */}
      {/* ===================================================== */}

      <div className="chart-container">

        <h3 style={{ marginTop: "30px" }}>
          Mode of Study (Gender)
        </h3>

        <ResponsiveContainer
          width="100%"
          height={300}
        >

          <PieChart>

            <Pie
              data={data.mode_gender}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >

              {data.mode_gender.map(
                (_, index) => (
                  <Cell
                    key={index}
                    fill={
                      COLORS[
                        index % COLORS.length
                      ]
                    }
                  />
                )
              )}

            </Pie>

            <Tooltip />
            <Legend />

          </PieChart>

        </ResponsiveContainer>

      </div>

      {/* ===================================================== */}
      {/* LEVEL CHART */}
      {/* ===================================================== */}

      <div className="chart-container">

        <h3 style={{ marginTop: "40px" }}>
          Student Levels
        </h3>

        <ResponsiveContainer
          width="100%"
          height={350}
        >

          <BarChart
            data={data.level_gender}
          >

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis
              allowDecimals={false}
              tickFormatter={(value) =>
                Math.floor(value)
              }
            />

            <Tooltip />

            <Bar
              dataKey="value"
              radius={[10, 10, 0, 0]}
            >

              {data.level_gender.map(
                (_, index) => (
                  <Cell
                    key={index}
                    fill={
                      COLORS[
                        index % COLORS.length
                      ]
                    }
                  />
                )
              )}

            </Bar>

          </BarChart>

        </ResponsiveContainer>

      </div>

      {/* ===================================================== */}
      {/* INCOME CHART */}
      {/* ===================================================== */}

      <div className="chart-container">

        <h3 style={{ marginTop: "40px" }}>
          Income / Month
        </h3>

        <ResponsiveContainer
          width="100%"
          height={350}
        >

          <BarChart
            data={data.classes || []}
          >

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis
              domain={[0, "auto"]}
              tickCount={6}
              tickFormatter={(value) =>
                new Intl.NumberFormat(
                  "en-KE"
                ).format(value)
              }
            />

            <Tooltip />

            <Bar
              dataKey="students"
              radius={[10, 10, 0, 0]}
            >

              {data.classes.map(
                (_, index) => (
                  <Cell
                    key={index}
                    fill={
                      COLORS[
                        index % COLORS.length
                      ]
                    }
                  />
                )
              )}

            </Bar>

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}

export default Dashboard;
import { useState } from "react";
import API from "../api";

function AddStudent({ onStudentAdded }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [membership, setMembership] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await API.post("/students", {
      name,
      phone,
      course,
      membership: membership ? 1 : 0
    });

    alert("Student added!");

    if (onStudentAdded) onStudentAdded(); // 🔥 refresh trigger

    setName("");
    setPhone("");
    setCourse("");
    setMembership(false);
  };

  return (
    <div>
      <h2>Add Student</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          placeholder="Course"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        />
        <div className="form-footer">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={membership}
            onChange={(e) => setMembership(e.target.checked)}
          />
          Has Membership card
        </label>

        <button type="submit">Add</button>
        </div>
      </form>
    </div>
  );
}

export default AddStudent;
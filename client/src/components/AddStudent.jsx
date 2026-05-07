import { useState } from "react";
import API from "../api";

function AddStudent({ onStudentAdded }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [membership, setMembership] = useState(false);
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [mode, setMode] = useState("");
  const [level, setLevel] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    await API.post("/students", {
      name,
      phone,
      course,
      email,
      gender,
      membership: membership ? 1 : 0,
      mode,
      level,
    });

    alert("Student added!");

    if (onStudentAdded) onStudentAdded(); 

    setName("");
    setPhone("");
    setCourse("");
    setMembership(false);
    setMode("");
    setLevel("");
  };

  return (
    <div>
      <h2>Add Student</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Phone No."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input 
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        />
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="">Mode of Learning</option>
          <option value="online">Online</option>
          <option value="physical">Physical</option>
       </select>

        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">Select Level</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
         <option value="advanced">Advanced</option>
       </select>

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
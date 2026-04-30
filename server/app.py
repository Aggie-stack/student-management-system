from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from dateutil.relativedelta import relativedelta
import sqlite3

app = Flask(__name__)
CORS(app)

# ---------------- DATABASE ----------------
def get_db():
    conn = sqlite3.connect('students.db')
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Students table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            course TEXT,
            membership INTEGER DEFAULT 0
        )
    ''')

    # Payments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            amount REAL,
            date_paid TEXT,
            duration INTEGER,
            due_date TEXT,
            renewal_no INTEGER,
            FOREIGN KEY(student_id) REFERENCES students(id)
        )
    ''')

    conn.commit()
    conn.close()


# ---------------- HOME ----------------
@app.route('/')
def home():
    return "Student Management System API is Running"


# ---------------- ADD STUDENT ----------------
@app.route('/students', methods=['POST'])
def add_student():
    data = request.json

    conn = get_db()
    conn.execute("""
        INSERT INTO students (name, phone, course, membership)
        VALUES (?, ?, ?, ?)
    """, (
        data['name'],
        data['phone'],
        data['course'],
        data.get("membership", 0)
    ))
    conn.commit()
    conn.close()

    return jsonify({"message": "Student added successfully"})


# ---------------- GET STUDENTS ----------------
@app.route('/students', methods=['GET'])
def get_students():
    conn = get_db()

    students = conn.execute("""
        SELECT 
            s.id,
            s.name,
            s.phone,
            s.course,
            s.membership,
            p.amount,
            p.date_paid,
            p.duration,
            p.due_date
        FROM students s
        LEFT JOIN payments p 
        ON s.id = p.student_id
        WHERE p.id = (
            SELECT MAX(id)
            FROM payments
            WHERE student_id = s.id
        )
        OR p.id IS NULL
    """).fetchall()

    result = []

    today = datetime.now().date()

    for row in students:
        student = dict(row)

        if student["due_date"]:
            due = datetime.strptime(student["due_date"], "%Y-%m-%d").date()
            student["status"] = "Active" if due >= today else "Expired"
        else:
            student["status"] = "No Payment"

        result.append(student)

    conn.close()
    return jsonify(result)


# ---------------- UPDATE STUDENT ----------------
@app.route('/students/<int:id>', methods=['PUT'])
def update_student(id):
    data = request.json

    conn = get_db()
    conn.execute("""
        UPDATE students
        SET name = ?, phone = ?, course = ?, membership = ?
        WHERE id = ?
    """, (
        data['name'],
        data['phone'],
        data['course'],
        data.get("membership", 0),
        id
    ))

    conn.commit()
    conn.close()

    return jsonify({"message": "Student updated successfully"})


# ---------------- DELETE STUDENT ----------------
@app.route('/students/<int:id>', methods=['DELETE'])
def delete_student(id):
    conn = get_db()

    conn.execute("DELETE FROM payments WHERE student_id = ?", (id,))
    conn.execute("DELETE FROM students WHERE id = ?", (id,))

    conn.commit()
    conn.close()

    return jsonify({"message": "Student deleted successfully"})


# ---------------- ADD PAYMENT ----------------
@app.route('/payments', methods=['POST'])
def add_payment():
    data = request.json

    student_id = data['student_id']
    amount = data['amount']
    date_paid = data['date_paid']
    duration = int(data['duration'])

    paid_date = datetime.strptime(date_paid, "%Y-%m-%d")
    due_date = paid_date + relativedelta(months=duration)

    conn = get_db()

    renewal_no = conn.execute("""
        SELECT COUNT(*) FROM payments WHERE student_id = ?
    """, (student_id,)).fetchone()[0] + 1

    conn.execute("""
        INSERT INTO payments 
        (student_id, amount, date_paid, duration, due_date, renewal_no)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        student_id,
        amount,
        date_paid,
        duration,
        due_date.strftime("%Y-%m-%d"),
        renewal_no
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Payment added successfully",
        "renewal_no": renewal_no,
        "due_date": due_date.strftime("%Y-%m-%d")
    })


# ---------------- GET PAYMENTS ----------------
@app.route('/payments/<int:student_id>', methods=['GET'])
def get_payments(student_id):
    conn = get_db()

    payments = conn.execute("""
        SELECT * FROM payments WHERE student_id = ?
    """, (student_id,)).fetchall()

    conn.close()
    return jsonify([dict(row) for row in payments])


# ---------------- DASHBOARD (FIXED) ----------------
@app.route('/dashboard', methods=['GET'])
def dashboard():
    conn = get_db()

    # Total students
    total_students = conn.execute("""
        SELECT COUNT(*) FROM students
    """).fetchone()[0]

    # Total income
    total_income = conn.execute("""
        SELECT COALESCE(SUM(amount), 0) FROM payments
    """).fetchone()[0]

    # Get latest payment per student
    status_data = conn.execute("""
        SELECT student_id, MAX(due_date) as last_due
        FROM payments
        GROUP BY student_id
    """).fetchall()

    today = datetime.now().date()

    active = 0
    expired = 0

    for row in status_data:
        if row["last_due"]:
            due_date = datetime.strptime(row["last_due"], "%Y-%m-%d").date()
            if due_date >= today:
                active += 1
            else:
                expired += 1

    conn.close()

    return jsonify({
        "total_students": total_students,
        "total_income": total_income,
        "active_students": active,
        "expired_students": expired
    })


# ---------------- RUN APP ----------------
if __name__ == '__main__':
    init_db()
    app.run(debug=True)
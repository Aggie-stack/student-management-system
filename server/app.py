from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import sqlite3
import bcrypt
import jwt
import os
from functools import wraps
from collections import defaultdict

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")

app = Flask(__name__)

# ---------------- CORS ----------------
CORS(app, resources={r"/*": {
    "origins": [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "https://student-management-system-three-kohl.vercel.app"
    ],
    "supports_credentials": True,
    "allow_headers": ["Content-Type", "Authorization"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}})

@app.route("/")
def home():
    return "Backend is running"

@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        return jsonify({}), 200


# ---------------- DB ----------------
def get_db():
    conn = sqlite3.connect("students.db")
    conn.row_factory = sqlite3.Row
    return conn


# ---------------- HELPERS ----------------
def parse_json():
    return request.get_json(force=True, silent=True) or {}


# ---------------- AUTH DECORATOR ----------------
def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization")
        if not auth or " " not in auth:
            return jsonify({"error": "Missing token"}), 401
        try:
            token = auth.split(" ")[1]
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user = decoded
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except Exception:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return wrapper


# ---------------- INIT DB ----------------
def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'admin'
        )
    """)

    try:
        c.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'")
    except Exception:
        pass

    c.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            course TEXT,
            membership INTEGER DEFAULT 0,
            email TEXT,
            gender TEXT,
            mode TEXT,
            level TEXT
        )
    """)

    for col in ["mode TEXT", "level TEXT"]:
        try:
            c.execute(f"ALTER TABLE students ADD COLUMN {col}")
        except Exception:
            pass

    c.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            amount INTEGER,
            date_paid TEXT,
            duration INTEGER,
            due_date TEXT
        )
    """)

    conn.commit()
    conn.close()


# ---------------- SEED USERS ----------------
def seed_users():
    conn = get_db()
    users = [
        ("director", "director123", "director"),
        ("admin",    "admin123",    "admin"),
        ("recep",    "recep123",    "receptionist"),
    ]
    for username, password, role in users:
        existing = conn.execute(
            "SELECT id FROM users WHERE username=?", (username,)
        ).fetchone()
        if not existing:
            hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            conn.execute(
                "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                (username, hashed, role)
            )
    conn.commit()
    conn.close()


# ---------------- LOGIN ----------------
@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    data = parse_json()

    if not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password required"}), 400

    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE username=?",
        (data["username"],)
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(data["password"].encode(), user["password"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    role_requested = data.get("role", "")
    user_role = user["role"] or "admin"

    if role_requested and user_role != role_requested:
        return jsonify({"error": f"This account is not registered as {role_requested}"}), 401

    token = jwt.encode(
        {
            "user_id":  user["id"],
            "username": user["username"],
            "role":     user_role,
            "exp":      datetime.utcnow() + timedelta(hours=8)
        },
        SECRET_KEY,
        algorithm="HS256"
    )

    return jsonify({"token": token, "role": user_role})


# ---------------- CHANGE PASSWORD ----------------
@app.route("/change-password", methods=["POST", "OPTIONS"])
@token_required
def change_password():
    data = parse_json()
    user_id = request.user.get("user_id")

    if not data.get("old_password") or not data.get("new_password"):
        return jsonify({"error": "Both old and new password required"}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    if not bcrypt.checkpw(data["old_password"].encode(), user["password"].encode()):
        conn.close()
        return jsonify({"error": "Current password is incorrect"}), 400

    hashed = bcrypt.hashpw(data["new_password"].encode(), bcrypt.gensalt()).decode()
    conn.execute("UPDATE users SET password=? WHERE id=?", (hashed, user_id))
    conn.commit()
    conn.close()

    return jsonify({"message": "Password updated successfully"})


# ---------------- STUDENTS ----------------
@app.route("/students", methods=["POST", "OPTIONS"])
@token_required
def add_student():
    data = parse_json()

    required = ["name", "phone", "course", "gender", "mode", "level"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = get_db()
    try:
        cursor = conn.execute("""
            INSERT INTO students (name, phone, course, email, gender, membership, mode, level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data["name"],
            data["phone"],
            data["course"],
            data.get("email", ""),
            data["gender"],
            1 if data.get("membership") else 0,
            data["mode"],
            data["level"],
        ))
        student_id = cursor.lastrowid
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    conn.close()
    return jsonify({"message": "Student added", "id": student_id}), 201


@app.route("/students", methods=["GET", "OPTIONS"])
@token_required
def get_students():
    conn = get_db()
    rows = conn.execute("""
        SELECT s.*,
               p.id as payment_id,
               p.amount,
               p.date_paid,
               p.duration,
               p.due_date
        FROM students s
        LEFT JOIN payments p
        ON p.id = (
            SELECT id FROM payments
            WHERE student_id = s.id
            ORDER BY id DESC LIMIT 1
        )
    """).fetchall()
    conn.close()

    today = datetime.now().date()
    result = []
    for r in rows:
        row = dict(r)
        if row.get("due_date"):
            due = datetime.strptime(row["due_date"], "%Y-%m-%d").date()
            row["status"] = "Active" if due >= today else "Expired"
        else:
            row["status"] = "No Payment"
        result.append(row)

    return jsonify(result)


@app.route("/students/<int:id>", methods=["GET", "OPTIONS"])
@token_required
def get_student(id):
    conn = get_db()
    row = conn.execute("SELECT * FROM students WHERE id=?", (id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Student not found"}), 404
    return jsonify(dict(row))


@app.route("/students/<int:id>", methods=["PUT", "OPTIONS"])
@token_required
def update_student(id):
    data = parse_json()
    conn = get_db()
    conn.execute("""
        UPDATE students
        SET name=?, phone=?, course=?, email=?, gender=?, membership=?, mode=?, level=?
        WHERE id=?
    """, (
        data["name"],
        data["phone"],
        data["course"],
        data.get("email"),
        data.get("gender"),
        data.get("membership", 0),
        data.get("mode"),
        data.get("level"),
        id
    ))
    conn.commit()
    conn.close()
    return jsonify({"message": "Student updated"})


@app.route("/students/<int:id>", methods=["DELETE", "OPTIONS"])
@token_required
def delete_student(id):
    conn = get_db()
    conn.execute("DELETE FROM payments WHERE student_id=?", (id,))
    conn.execute("DELETE FROM students WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Deleted"})


# ---------------- PAYMENTS ----------------
@app.route("/payments", methods=["POST", "OPTIONS"])
@token_required
def add_payment():
    data = parse_json()
    try:
        paid     = datetime.strptime(data["date_paid"], "%Y-%m-%d")
        duration = int(data["duration"])
        due      = paid + relativedelta(months=duration)

        conn   = get_db()
        cursor = conn.execute("""
            INSERT INTO payments (student_id, amount, date_paid, duration, due_date)
            VALUES (?, ?, ?, ?, ?)
        """, (
            data["student_id"],
            data["amount"],
            data["date_paid"],
            duration,
            due.strftime("%Y-%m-%d")
        ))
        payment_id = cursor.lastrowid

        student = conn.execute(
            "SELECT name FROM students WHERE id=?", (data["student_id"],)
        ).fetchone()

        conn.commit()
        conn.close()

        return jsonify({
            "message":      "Payment added",
            "payment_id":   payment_id,
            "renewal_no":   f"REC-{str(payment_id).zfill(4)}",
            "student_name": student["name"] if student else "Unknown",
            "student_id":   data["student_id"],
            "amount":       data["amount"],
            "date_paid":    data["date_paid"],
            "duration":     duration,
            "due_date":     due.strftime("%Y-%m-%d"),
        })
    except KeyError as e:
        return jsonify({"error": f"Missing field: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/payments", methods=["GET", "OPTIONS"])
@token_required
def get_all_payments():
    conn = get_db()
    rows = conn.execute("SELECT * FROM payments ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/payments/<int:student_id>", methods=["GET", "OPTIONS"])
@token_required
def get_payments(student_id):
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM payments WHERE student_id=? ORDER BY id DESC
    """, (student_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/payments/<int:id>", methods=["PUT", "OPTIONS"])
@token_required
def update_payment(id):
    data = parse_json()
    paid = datetime.strptime(data["date_paid"], "%Y-%m-%d")
    due  = paid + relativedelta(months=int(data["duration"]))
    conn = get_db()
    conn.execute("""
        UPDATE payments SET amount=?, date_paid=?, duration=?, due_date=? WHERE id=?
    """, (data["amount"], data["date_paid"], data["duration"], due.strftime("%Y-%m-%d"), id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Payment updated"})


@app.route("/payments/<int:id>", methods=["DELETE", "OPTIONS"])
@token_required
def delete_payment(id):
    conn = get_db()
    conn.execute("DELETE FROM payments WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Deleted"})


@app.route("/payments/upsert", methods=["POST", "OPTIONS"])
@token_required
def upsert_payment():
    data = parse_json()
    conn = get_db()
    paid = datetime.strptime(data["date_paid"], "%Y-%m-%d")
    due  = paid + relativedelta(months=int(data["duration"]))

    if data.get("id"):
        conn.execute("""
            UPDATE payments SET amount=?, date_paid=?, duration=?, due_date=? WHERE id=?
        """, (data["amount"], data["date_paid"], data["duration"], due.strftime("%Y-%m-%d"), data["id"]))
    else:
        conn.execute("""
            INSERT INTO payments (student_id, amount, date_paid, duration, due_date)
            VALUES (?, ?, ?, ?, ?)
        """, (data["student_id"], data["amount"], data["date_paid"], data["duration"], due.strftime("%Y-%m-%d")))

    conn.commit()
    conn.close()
    return jsonify({"message": "Payment saved"})


# ---------------- DASHBOARD ----------------
@app.route("/dashboard", methods=["GET"])
@token_required
def dashboard():
    conn  = get_db()
    today = datetime.now().date()

    year  = request.args.get("year",  type=int) or today.year
    month = request.args.get("month", type=int)

    if month:
        start_date = datetime(year, month, 1).date()
        end_date   = start_date + relativedelta(months=1)
    else:
        start_date = datetime(year, 1, 1).date()
        end_date   = datetime(year + 1, 1, 1).date()

    payments = conn.execute("""
        SELECT student_id, date_paid, due_date, amount FROM payments
        WHERE date_paid >= ? AND date_paid < ?
    """, (start_date, end_date)).fetchall()

    if month and len(payments) == 0:
        conn.close()
        return jsonify({
            "total_students": 0, "total_income": 0,
            "active_students": 0, "expired_students": 0,
            "male_students": 0, "female_students": 0,
            "mode_gender": [], "level_gender": [], "classes": []
        })

    total_income = sum(p["amount"] for p in payments)
    student_ids  = list(set(p["student_id"] for p in payments))

    if not student_ids:
        students = []
    else:
        placeholders = ",".join(["?"] * len(student_ids))
        students = conn.execute(f"""
            SELECT id, gender, mode, level FROM students WHERE id IN ({placeholders})
        """, student_ids).fetchall()

    history = defaultdict(list)
    for p in payments:
        history[p["student_id"]].append(p)

    active_students = expired_students = male_students = female_students = 0

    for s in students:
        is_active = any(
            p["due_date"] and datetime.strptime(p["due_date"], "%Y-%m-%d").date() >= today
            for p in history.get(s["id"], [])
        )
        if s["gender"] == "Male":
            male_students += 1
        else:
            female_students += 1
        if is_active:
            active_students += 1
        else:
            expired_students += 1

    mode_gender = [
        {"name": "Male Online",     "value": 0},
        {"name": "Female Online",   "value": 0},
        {"name": "Male Physical",   "value": 0},
        {"name": "Female Physical", "value": 0},
    ]
    for s in students:
        key = f"{(s['gender'] or '').strip()} {(s['mode'] or '').strip().capitalize()}"
        for item in mode_gender:
            if item["name"] == key:
                item["value"] += 1

    levels = conn.execute(f"""
        SELECT level, COUNT(*) as count FROM students
        WHERE id IN ({','.join(['?']*len(student_ids))}) GROUP BY level
    """, student_ids).fetchall() if student_ids else []

    level_gender = [{"name": l["level"], "value": l["count"]} for l in levels]

    income_data = conn.execute("""
        SELECT strftime('%m', date_paid) as month, SUM(amount) as total
        FROM payments WHERE date_paid >= ? AND date_paid < ? GROUP BY month
    """, (start_date, end_date)).fetchall()

    month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    classes = [{"name": month_names[int(r["month"]) - 1], "students": r["total"]} for r in income_data]

    conn.close()

    return jsonify({
        "total_students":   len(student_ids),
        "total_income":     total_income,
        "active_students":  active_students,
        "expired_students": expired_students,
        "male_students":    male_students,
        "female_students":  female_students,
        "mode_gender":      mode_gender,
        "level_gender":     level_gender,
        "classes":          classes
    })


# ---------------- DASHBOARD / COURSES ----------------
@app.route("/dashboard/courses", methods=["GET"])
@token_required
def dashboard_courses():
    """
    Returns each course with the number of DISTINCT students who made
    a payment in the selected period.

    Query params (mirrors /dashboard):
        year  (int, default current year)
        month (int, optional) — filters to that specific month only

    Examples:
        GET /dashboard/courses                   -> full current year
        GET /dashboard/courses?year=2026         -> full year 2026
        GET /dashboard/courses?year=2026&month=5 -> May 2026 only

    COUNT(DISTINCT s.id) guarantees:
        - Student ID 5 + Student ID 9 both on "Computer Classes" -> count 2
        - Student ID 5 with 3 renewal payments in the period     -> count 1
    """
    today = datetime.now().date()
    year  = request.args.get("year",  type=int) or today.year
    month = request.args.get("month", type=int)

    if month:
        start_date = datetime(year, month, 1).date()
        end_date   = start_date + relativedelta(months=1)
    else:
        start_date = datetime(year, 1, 1).date()
        end_date   = datetime(year + 1, 1, 1).date()

    conn = get_db()
    rows = conn.execute("""
        SELECT
            s.course             AS name,
            COUNT(DISTINCT s.id) AS count
        FROM payments p
        JOIN students s ON s.id = p.student_id
        WHERE p.date_paid >= ?
          AND p.date_paid <  ?
          AND s.course IS NOT NULL
          AND s.course != ''
        GROUP BY s.course
        ORDER BY count DESC
    """, (start_date.isoformat(), end_date.isoformat())).fetchall()
    conn.close()

    return jsonify([{"name": r["name"], "count": r["count"]} for r in rows])


# ---------------- DASHBOARD / RENEWALS DUE ----------------
@app.route("/dashboard/renewals-due", methods=["GET"])
@token_required
def dashboard_renewals_due():
    """
    Returns students whose latest payment is expiring within the next
    `days` days (default 7). Uses the most recent payment per student
    so a student with multiple renewals only appears once.

    Query param:
        days (int, default 7) — lookahead window
    """
    days       = request.args.get("days", default=7, type=int)
    today      = datetime.now().date()
    window_end = today + timedelta(days=days)

    conn = get_db()
    rows = conn.execute("""
        SELECT
            p.id,
            s.name,
            s.course,
            p.due_date
        FROM payments p
        JOIN students s ON s.id = p.student_id
        WHERE p.id = (
            SELECT id FROM payments
            WHERE student_id = p.student_id
            ORDER BY id DESC LIMIT 1
        )
          AND p.due_date >= ?
          AND p.due_date <= ?
        ORDER BY p.due_date ASC
    """, (today.isoformat(), window_end.isoformat())).fetchall()
    conn.close()

    return jsonify([
        {
            "id":       r["id"],
            "name":     r["name"],
            "course":   r["course"],
            "due_date": r["due_date"],
        }
        for r in rows
    ])


# ---------------- DASHBOARD / RECENT PAYMENTS ----------------
@app.route("/dashboard/recent-payments", methods=["GET"])
@token_required
def dashboard_recent_payments():
    """
    Returns the most recent payments across all students, joined with
    student name and course.

    Query param:
        limit (int, default 10) — how many rows to return
    """
    limit = request.args.get("limit", default=10, type=int)

    conn = get_db()
    rows = conn.execute("""
        SELECT
            p.id,
            s.name  AS student_name,
            s.course,
            p.amount,
            p.duration,
            p.date_paid
        FROM payments p
        JOIN students s ON s.id = p.student_id
        ORDER BY p.date_paid DESC, p.id DESC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()

    return jsonify([
        {
            "id":           r["id"],
            "student_name": r["student_name"],
            "course":       r["course"],
            "amount":       r["amount"],
            "duration":     r["duration"],
            "date_paid":    r["date_paid"],
        }
        for r in rows
    ])


# ---------------- RUN ----------------
if __name__ == "__main__":
    init_db()
    seed_users()
    app.run(debug=True)

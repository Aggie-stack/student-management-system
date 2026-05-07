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

# ---------------- CORS FIX ----------------
CORS(app, resources={r"/*": {
    "origins": [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "https://student-management-system-three-kohl.vercel.app/login"
    ],
    "supports_credentials": True,
    "allow_headers": ["Content-Type", "Authorization"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}})

@app.route("/")
def home():
    return "Backend is running"

# ---------------- GLOBAL OPTIONS FIX (IMPORTANT) ----------------
@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        return jsonify({}), 200


# ---------------- DB ----------------
def get_db():
    conn = sqlite3.connect("students.db")
    conn.row_factory = sqlite3.Row
    return conn


# ---------------- AUTH ----------------
def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization")
        if not auth:
            return jsonify({"error": "Missing token"}), 401

        try:
            token = auth.split(" ")[1]
            jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except:
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
            username TEXT,
            password TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            course TEXT,
            membership INTEGER DEFAULT 0,
            email TEXT,
            gender TEXT
        )
    """)

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


# ---------------- LOGIN (FIXED - WAS MISSING OPTIONS) ----------------
@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.get_json() or {}

    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE username=?",
        (data["username"],)
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if bcrypt.checkpw(
        data["password"].encode(),
        user["password"].encode()
    ):
        token = jwt.encode(
            {
                "user_id": user["id"],
                "exp": datetime.utcnow() + timedelta(hours=5)
            },
            SECRET_KEY,
            algorithm="HS256"
        )

        return jsonify({"token": token})

    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/students", methods=["POST", "OPTIONS"])
@token_required
def add_student():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.json
    conn = get_db()

    conn.execute("""
        INSERT INTO students
        (name, phone, course, email, gender, membership, mode, level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["name"],
        data["phone"],
        data["course"],
        data.get("email"),
        data.get("gender"),
        data.get("membership", 0),
        data.get("mode"),
        data.get("level")
    ))

    conn.commit()
    conn.close()

    return jsonify({"message": "Student added"})

@app.route("/students", methods=["GET", "OPTIONS"])
@token_required
def get_students():
    if request.method == "OPTIONS":
        return jsonify({}), 200

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
    if request.method == "OPTIONS":
        return jsonify({}), 200

    conn = get_db()

    row = conn.execute(
        "SELECT * FROM students WHERE id=?",
        (id,)
    ).fetchone()

    conn.close()

    if not row:
        return jsonify({"error": "Student not found"}), 404

    return jsonify(dict(row))

@app.route("/students/<int:id>", methods=["PUT", "OPTIONS"])
@token_required
def update_student(id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.json
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
    if request.method == "OPTIONS":
        return jsonify({}), 200

    conn = get_db()
    conn.execute("DELETE FROM payments WHERE student_id=?", (id,))
    conn.execute("DELETE FROM students WHERE id=?", (id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Deleted"})
    
@app.route("/payments", methods=["POST", "OPTIONS"])
@token_required
def add_payment():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.json

    try:
        paid = datetime.strptime(data["date_paid"], "%Y-%m-%d")
        duration = int(data["duration"])
        due = paid + relativedelta(months=duration)

        conn = get_db()

        conn.execute("""
            INSERT INTO payments
            (student_id, amount, date_paid, duration, due_date)
            VALUES (?, ?, ?, ?, ?)
        """, (
            data["student_id"],
            data["amount"],
            data["date_paid"],
            duration,
            due.strftime("%Y-%m-%d")
        ))

        conn.commit()
        conn.close()

        return jsonify({"message": "Payment added"})

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/payments", methods=["GET", "OPTIONS"])
@token_required
def get_all_payments():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    conn = get_db()

    rows = conn.execute("""
        SELECT * FROM payments
        ORDER BY id DESC
    """).fetchall()

    conn.close()

    return jsonify([dict(r) for r in rows])

@app.route("/payments/<int:student_id>", methods=["GET", "OPTIONS"])
@token_required
def get_payments(student_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    conn = get_db()

    rows = conn.execute("""
        SELECT * FROM payments
        WHERE student_id=?
        ORDER BY id DESC
    """, (student_id,)).fetchall()

    conn.close()

    return jsonify([dict(r) for r in rows])

@app.route("/payments/<int:id>", methods=["PUT", "OPTIONS"])
@token_required
def update_payment(id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.json

    paid = datetime.strptime(data["date_paid"], "%Y-%m-%d")
    due = paid + relativedelta(months=int(data["duration"]))

    conn = get_db()

    conn.execute("""
        UPDATE payments
        SET amount=?, date_paid=?, duration=?, due_date=?
        WHERE id=?
    """, (
        data["amount"],
        data["date_paid"],
        data["duration"],
        due.strftime("%Y-%m-%d"),
        id
    ))

    conn.commit()
    conn.close()

    return jsonify({"message": "Payment updated"})

@app.route("/payments/<int:id>", methods=["DELETE", "OPTIONS"])
@token_required
def delete_payment(id):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    conn = get_db()
    conn.execute("DELETE FROM payments WHERE id=?", (id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Deleted"})

@app.route("/payments/upsert", methods=["POST", "OPTIONS"])
@token_required
def upsert_payment():
    if request.method == "OPTIONS":
        return jsonify({}), 

    data = request.json

    conn = get_db()

    paid = datetime.strptime(data["date_paid"], "%Y-%m-%d")
    due = paid + relativedelta(months=int(data["duration"]))

    if data.get("id"):
        # UPDATE
        conn.execute("""
            UPDATE payments
            SET amount=?, date_paid=?, duration=?, due_date=?
            WHERE id=?
        """, (
            data["amount"],
            data["date_paid"],
            data["duration"],
            due.strftime("%Y-%m-%d"),
            data["id"]
        ))
    else:
        # INSERT
        conn.execute("""
            INSERT INTO payments
            (student_id, amount, date_paid, duration, due_date)
            VALUES (?, ?, ?, ?, ?)
        """, (
            data["student_id"],
            data["amount"],
            data["date_paid"],
            data["duration"],
            due.strftime("%Y-%m-%d")
        ))

    conn.commit()
    conn.close()

    return jsonify({"message": "Payment saved"})


@app.route("/dashboard", methods=["GET"])
@token_required
def dashboard():
    conn = get_db()
    today = datetime.now().date()

    # ================= PARAMS =================
    year = request.args.get("year", type=int) or today.year
    month = request.args.get("month", type=int)

    # ================= DATE RANGE =================
    if month:
        start_date = datetime(year, month, 1).date()
        end_date = start_date + relativedelta(months=1)
    else:
        start_date = datetime(year, 1, 1).date()
        end_date = datetime(year + 1, 1, 1).date()

    # ======================================================
    # ---------------- PAYMENTS IN PERIOD ----------------
    # ======================================================
    payments = conn.execute("""
        SELECT student_id, date_paid, due_date, amount
        FROM payments
        WHERE date_paid >= ? AND date_paid < ?
    """, (start_date, end_date)).fetchall()

    # ======================================================
    # ---------------- MONTH EMPTY CASE ----------------
    # ======================================================
    if month and len(payments) == 0:
        return jsonify({
            "total_students": 0,
            "total_income": 0,
            "active_students": 0,
            "expired_students": 0,
            "male_students": 0,
            "female_students": 0,
            "mode_gender": [],
            "level_gender": [],
            "classes": []
        })

    # ======================================================
    # ---------------- TOTAL INCOME ----------------
    # ======================================================
    total_income = sum(p["amount"] for p in payments)

    # ======================================================
    # ---------------- STUDENTS IN PERIOD ----------------
    # ======================================================
    student_ids = list(set(p["student_id"] for p in payments))

    if not student_ids:
        students = []
    else:
        placeholders = ",".join(["?"] * len(student_ids))
        students = conn.execute(f"""
            SELECT id, gender, mode, level
            FROM students
            WHERE id IN ({placeholders})
        """, student_ids).fetchall()

    # ======================================================
    # ---------------- GROUP PAYMENTS ----------------
    # ======================================================
    history = defaultdict(list)

    for p in payments:
        history[p["student_id"]].append(p)

    # ======================================================
    # ---------------- ACTIVE / EXPIRED ----------------
    # ======================================================
    active_students = 0
    expired_students = 0
    male_students = 0
    female_students = 0

    for s in students:
        student_id = s["id"]
        gender = s["gender"]

        is_active = False

        for p in history.get(student_id, []):
            if not p["due_date"]:
                continue

            due = datetime.strptime(p["due_date"], "%Y-%m-%d").date()

            if due >= today:
                is_active = True
                break

        if gender == "Male":
            male_students += 1
        else:
            female_students += 1

        if is_active:
            active_students += 1
        else:
            expired_students += 1

    # ======================================================
    # ---------------- TOTAL STUDENTS ----------------
    # ======================================================
    total_students = len(student_ids)

    # ======================================================
    # ---------------- CHART DATA ----------------
    # ======================================================

    # MODE OF STUDY (GENDER + MODE)
    mode_gender = [
        {"name": "Male Online", "value": 0},
        {"name": "Female Online", "value": 0},
        {"name": "Male Physical", "value": 0},
        {"name": "Female Physical", "value": 0},
    ]

    for s in students:
        gender = s["gender"].strip()
        mode = (s["mode"] or "").strip()

        mode = mode.capitalize()
        
        key = f"{gender} {mode}"

        for item in mode_gender:
            if item["name"] == key:
                item["value"] += 1

    # STUDENT LEVELS
    levels = conn.execute(f"""
        SELECT level, COUNT(*) as count
        FROM students
        WHERE id IN ({','.join(['?']*len(student_ids))})
        GROUP BY level
    """, student_ids).fetchall() if student_ids else []

    level_gender = [
        {"name": l["level"], "value": l["count"]}
        for l in levels
    ]

    # INCOME PER MONTH
    income_data = conn.execute("""
        SELECT strftime('%m', date_paid) as month, SUM(amount) as total
        FROM payments
        WHERE date_paid >= ? AND date_paid < ?
        GROUP BY month
    """, (start_date, end_date)).fetchall()

    month_names = [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec"
    ]

    classes = []

    for row in income_data:
        m = int(row["month"])
        classes.append({
            "name": month_names[m - 1],
            "students": row["total"]
        })

    # ======================================================
    # ---------------- RESPONSE ----------------
    # ======================================================
    return jsonify({
        "total_students": total_students,
        "total_income": total_income,
        "active_students": active_students,
        "expired_students": expired_students,
        "male_students": male_students,
        "female_students": female_students,

        "mode_gender": mode_gender,
        "level_gender": level_gender,
        "classes": classes
    })

# ---------------- RUN ----------------
if __name__ == "__main__":
    init_db()
    app.run(debug=True)
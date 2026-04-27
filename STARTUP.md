# Evenzo — Startup Guide

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| MySQL | 8.0+ | `mysql --version` |

---

## Step 1 — Create the MySQL Database

Open the MySQL shell and run:

```sql
CREATE DATABASE evenzo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## Step 2 — Load the Schema

From the project root:

```bash
mysql -u root -p evenzo < database/schema.sql
```

> If your root account has no password, omit the `-p` flag.

This creates all tables, the `register_for_event` stored procedure, triggers, and the `event_summary` view.

---

## Step 3 — Configure the Backend

Open `backend/.env` and fill in your MySQL credentials:

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password_here
MYSQL_DB=evenzo
SECRET_KEY=evenzo-secret-key-2026-do-not-use-in-prod
```

---

## Step 4 — Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Key packages: `fastapi`, `uvicorn`, `mysql-connector-python`, `passlib[bcrypt]`, `python-jose`

---

## Step 5 — Seed Demo Data (optional but recommended)

```bash
cd database
python seed.py --host localhost --user root --password your_password_here --db evenzo
```

This inserts 5 demo users, 4 venues, 4 events, and sample registrations.

**Demo accounts** (all use password `password123`):

| Email | Role |
|-------|------|
| arjun@srmist.edu.in | Student |
| priya@srmist.edu.in | Student |
| ramesh@srmist.edu.in | Organizer |
| suresh@srmist.edu.in | Faculty |
| vartika@srmist.edu.in | Admin |

---

## Step 6 — Start the Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

API will be live at: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

---

## Step 7 — Install Frontend Dependencies

Open a second terminal:

```bash
cd frontend
npm install
```

---

## Step 8 — Start the Frontend

```bash
cd frontend
npm run dev
```

App will be live at: `http://localhost:5173`

---

## Both servers must be running simultaneously.

Open two terminals — one for the backend (`uvicorn`) and one for the frontend (`npm run dev`).

---

## Troubleshooting

**`Access denied for user 'root'@'localhost'`**
— Wrong password in `.env`. Update `MYSQL_PASSWORD`.

**`Unknown database 'evenzo'`**
— Run Step 1 to create the database first.

**`Table 'evenzo.users' doesn't exist`**
— Run Step 2 to load the schema.

**`ModuleNotFoundError: No module named 'mysql'`**
— Run `pip install mysql-connector-python` in the backend directory.

**`VITE ERROR: Cannot find module`**
— Run `npm install` in the frontend directory.

**Backend returns 401 on all requests**
— Token expired or `SECRET_KEY` mismatch. Log out and log in again.

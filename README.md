# Evenzo — College Event Management System

**Course:** 21CSC205P · Database Management Systems · SRM Institute of Science and Technology  
**Team:** Sarthak Singh (RA2411026010218) · Vartika Jamwal (RA2411026010237)  
**Guide:** Dr. S. Aruna, Associate Professor, Dept. of Computational Intelligence

---

## Tech Stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS + Zustand + Axios  |
| Backend   | FastAPI (Python) + psycopg2                       |
| Database  | PostgreSQL — raw SQL, no ORM                      |
| Auth      | JWT (python-jose) + bcrypt (passlib)              |
| PDF       | ReportLab (participation certificates)            |

---

## Project Structure

```
evenzo/
├── frontend/               React + Vite app
│   └── src/
│       ├── api/client.js   Axios instance with JWT interceptor
│       ├── store/          Zustand auth store
│       ├── components/     Shared UI (Sidebar, EventCard, PaymentModal …)
│       └── pages/          All page components
├── backend/
│   ├── main.py             FastAPI app + CORS
│   ├── auth.py             JWT helpers, passcode constants
│   ├── db.py               psycopg2 connection pool
│   ├── models.py           Pydantic request models
│   └── routers/            auth_router, events, registrations, teams,
│                           dashboard, admin, venues, certificates, notifications
└── database/
    ├── schema.sql          Tables, trigger, stored procedure, view
    └── seed.py             Python seed script (hashes passwords via bcrypt)
```

---

## Setup

### 1. Database

```bash
createdb evenzo
psql -d evenzo -f database/schema.sql
```

### 2. Seed Data

```bash
cd database
pip install psycopg2-binary passlib[bcrypt]
python seed.py
# Optional custom DSN:
# python seed.py --dsn "postgresql://user:pass@localhost/evenzo"
```

### 3. Backend

```bash
cd backend
pip install -r requirements.txt
# Set DATABASE_URL in environment or .env:
#   DATABASE_URL=postgresql://postgres:password@localhost/evenzo
uvicorn main:app --reload
# Interactive API docs: http://localhost:8000/docs
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

---

## Demo Accounts (created by seed.py)

| Name           | Email                      | Password     | Role      |
|----------------|----------------------------|--------------|-----------|
| Arjun Sharma   | arjun@srmist.edu.in        | password123  | student   |
| Ramesh Iyer    | ramesh@srmist.edu.in       | password123  | organizer |
| Vartika Jamwal | vartika@srmist.edu.in      | password123  | admin     |
| Priya Menon    | priya@srmist.edu.in        | password123  | student   |
| Dr. Suresh     | suresh.faculty@srmist.edu.in | password123 | faculty   |

Use the **Demo Accounts** buttons on the login page to fill credentials instantly.

---

## Passcodes (for registration)

| Role      | Passcode            |
|-----------|---------------------|
| Organizer | `EVENZO-ORG-2026`   |
| Admin     | `EVENZO-ADMIN-2026` |

---

## Key Database Features

| Feature            | Details                                                                 |
|--------------------|-------------------------------------------------------------------------|
| Stored Procedure   | `register_for_event(p_user_id, p_event_id, p_team_name, p_payment_ref)` — capacity check, deadline check, duplicate detection, team creation, payment-conditional status |
| Trigger            | `trg_event_status` BEFORE INSERT OR UPDATE on events — auto-sets `event_status` to upcoming / ongoing / completed based on timestamps |
| View               | `event_summary` — joins events + users + venues + registration counts for efficient dashboard queries |
| Exception Handling | psycopg2 surfaces PostgreSQL RAISE messages as HTTP 400 detail strings  |

---

## API Reference

Full Swagger UI at **http://localhost:8000/docs**

| Method  | Endpoint                          | Description                    |
|---------|-----------------------------------|--------------------------------|
| POST    | /auth/register                    | Create account                 |
| POST    | /auth/login                       | Get JWT token + user info      |
| GET     | /auth/me                          | Current user profile           |
| GET     | /events                           | List approved events           |
| GET     | /events/my                        | Organizer's events             |
| GET     | /events/{id}                      | Event detail (event_summary)   |
| POST    | /events                           | Create event (organizer/admin) |
| DELETE  | /events/{id}                      | Delete pending event           |
| POST    | /registrations                    | Register (calls stored proc)   |
| GET     | /registrations/my                 | My registrations               |
| PATCH   | /registrations/{id}/cancel        | Cancel registration            |
| GET     | /teams/my                         | My teams with members          |
| GET     | /dashboard/student                | Student dashboard data         |
| GET     | /dashboard/organizer              | Organizer dashboard data       |
| GET     | /dashboard/admin                  | Admin dashboard data           |
| GET     | /admin/events                     | All events (admin)             |
| GET     | /admin/pending                    | Pending approval list          |
| PATCH   | /admin/events/{id}/approve        | Approve event                  |
| PATCH   | /admin/events/{id}/reject         | Reject event                   |
| GET     | /admin/registrations              | Registration audit log         |
| GET     | /venues                           | List venues                    |
| POST    | /venues                           | Add venue (admin)              |
| DELETE  | /venues/{id}                      | Delete venue (admin)           |
| POST    | /certificates/generate/{event_id} | Generate PDF certificate       |
| GET     | /certificates/download/{cert_id}  | Download certificate PDF       |

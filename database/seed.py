"""
Evenzo seed script — run from the database/ directory:
  python seed.py [--host localhost] [--user root] [--password ""] [--db evenzo]

Requires: mysql-connector-python passlib[bcrypt]
"""
import sys
import argparse

try:
    import mysql.connector
    from passlib.context import CryptContext
except ImportError:
    print("Missing dependencies. Run: pip install mysql-connector-python passlib[bcrypt]")
    sys.exit(1)

pwd  = CryptContext(schemes=["bcrypt"], deprecated="auto")
HASH = pwd.hash("password123")


def seed(host: str, user: str, password: str, db: str):
    conn = mysql.connector.connect(
        host=host, user=user, password=password, database=db, autocommit=False
    )
    cur = conn.cursor()

    try:
        # ── Truncate existing data ────────────────────────────
        cur.execute("SET FOREIGN_KEY_CHECKS=0")
        for tbl in ["notifications", "certificates", "team_members",
                    "registrations", "teams", "events", "venues", "users"]:
            cur.execute(f"TRUNCATE TABLE {tbl}")
        cur.execute("SET FOREIGN_KEY_CHECKS=1")

        # ── Users ─────────────────────────────────────────────
        users = [
            # (full_name, email, role, phone, reg_no, dept, year, course,
            #  college_name, city, org_type, org_role, org_name, designation)
            ("Arjun Sharma",   "arjun@srmist.edu.in",   "student",
             "9876543210", "RA2211003010001", "CSE", "3rd Year", "B.Tech",
             None, None, None, None, None, None),

            ("Ramesh Kumar",   "ramesh@srmist.edu.in",  "organizer",
             "9876543211", None, None, None, None,
             None, None, "Club", "Club Head", "Robotics Club SRM", None),

            ("Vartika Jamwal", "vartika@srmist.edu.in", "admin",
             "9876543212", None, None, None, None,
             None, None, None, None, None, None),

            ("Priya Menon",    "priya@srmist.edu.in",   "student",
             "9876543213", "RA2211003010002", "ECE", "2nd Year", "B.Tech",
             None, None, None, None, None, None),

            ("Dr. Suresh Nair","suresh@srmist.edu.in",  "faculty",
             "9876543214", None, "CSE", None, None,
             None, None, None, None, None, "Associate Professor"),
        ]

        user_ids = []
        for row in users:
            cur.execute(
                """INSERT INTO users
                   (full_name, email, password_hash, phone, role,
                    reg_no, department, year, course,
                    college_name, city, org_type, org_role, org_name, designation)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (row[0], row[1], HASH, row[3], row[2],
                 row[4], row[5], row[6], row[7],
                 row[8], row[9], row[10], row[11], row[12], row[13]),
            )
            user_ids.append(cur.lastrowid)

        arjun_id, ramesh_id, _, priya_id, _ = user_ids
        print(f"  [+] Users inserted  (Arjun={arjun_id}, Ramesh={ramesh_id})")

        # ── Venues ────────────────────────────────────────────
        venues = [
            ("Tech Hub",        "Block 1",        "Lab",        180),
            ("Main Auditorium",  "Central Block",  "Auditorium", 500),
            ("Seminar Hall A",   "Block 3",        "Seminar Hall", 60),
            ("Open Ground",      "Campus Grounds", "Ground",    1000),
        ]
        venue_ids = []
        for name, building, vtype, cap in venues:
            cur.execute(
                "INSERT INTO venues (name, building_name, type, capacity) VALUES (%s,%s,%s,%s)",
                (name, building, vtype, cap),
            )
            venue_ids.append(cur.lastrowid)

        tech_hub_id, main_aud_id, seminar_a_id, _ = venue_ids
        print("  [+] Venues inserted")

        # ── Events ────────────────────────────────────────────
        events = [
            # (title, category, description, venue_id, start, end, deadline,
            #  fee, min_t, max_t, max_part, upi, payee, approval)
            ("HackSRM 5.0", "Hackathon",
             "SRM's flagship 36-hour hackathon. Build innovative solutions across HealthTech, FinTech, EdTech, and Open Innovation. Top teams compete for ₹5L+ prize pool.",
             tech_hub_id,
             "2027-04-22 09:00:00", "2027-04-24 17:00:00", "2027-04-20 23:59:00",
             0, 3, 5, 180, None, None, "approved"),

            ("Riviera 2025", "Cultural",
             "SRM's iconic cultural extravaganza — dance, music, drama, art installations, and celebrity performances across 3 unforgettable days.",
             main_aud_id,
             "2027-04-28 10:00:00", "2027-04-30 22:00:00", "2027-04-26 23:59:00",
             0, 1, 1, 500, None, None, "approved"),

            ("ML Bootcamp", "Workshop",
             "Intensive 2-day hands-on workshop on Machine Learning fundamentals, model building, and deployment using Python, scikit-learn, and TensorFlow.",
             seminar_a_id,
             "2027-05-05 09:00:00", "2027-05-06 17:00:00", "2027-05-03 23:59:00",
             199, 1, 1, 60, "mlbootcamp@srmist", "Robotics Club SRM", "approved"),

            ("DSA Quiz Open", "Technical",
             "Test your Data Structures & Algorithms knowledge in this timed quiz championship. Three rounds of escalating difficulty.",
             seminar_a_id,
             "2027-05-10 14:00:00", "2027-05-10 17:00:00", "2027-05-08 23:59:00",
             0, 1, 1, 200, None, None, "pending"),
        ]

        event_ids = []
        for (title, cat, desc, vid, start, end, deadline,
             fee, min_t, max_t, max_p, upi, payee, approval) in events:
            cur.execute(
                """INSERT INTO events
                   (organizer_id, venue_id, title, category, description,
                    start_datetime, end_datetime, registration_deadline,
                    fee, min_team_size, max_team_size, max_participants,
                    upi_id, payee_name, approval_status)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (ramesh_id, vid, title, cat, desc,
                 start, end, deadline,
                 fee, min_t, max_t, max_p, upi, payee, approval),
            )
            event_ids.append(cur.lastrowid)

        hacksrm_id, riviera_id, ml_id, dsaquiz_id = event_ids
        print(f"  [+] Events inserted  (HackSRM={hacksrm_id}, ML={ml_id})")

        # ── Registrations via stored procedure ────────────────
        conn.commit()  # commit before calling procedure (avoids implicit transaction issues)

        cur.callproc("register_for_event", [arjun_id, hacksrm_id, "Team Nexus", None])
        conn.commit()

        cur.callproc("register_for_event", [arjun_id, ml_id, None, "TXN123"])
        conn.commit()

        print("  [+] Registrations inserted")

        # ── Welcome notifications ──────────────────────────────
        cur.execute(
            """INSERT INTO notifications (user_id, message) VALUES (%s,%s),(%s,%s)""",
            (arjun_id,  "Welcome to Evenzo! You're registered for HackSRM 5.0.",
             ramesh_id, "Your event 'HackSRM 5.0' has been approved."),
        )
        conn.commit()

        print("\n  [OK] Seed complete — all demo logins use password: password123")
        print(f"     arjun@srmist.edu.in    : student")
        print(f"     ramesh@srmist.edu.in   : organizer")
        print(f"     vartika@srmist.edu.in  : admin")
        print(f"     priya@srmist.edu.in    : student")
        print(f"     suresh@srmist.edu.in   : faculty")

    except Exception as e:
        conn.rollback()
        print(f"\n  [ERROR] Seed failed: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Evenzo database with demo data")
    parser.add_argument("--host",     default="localhost")
    parser.add_argument("--user",     default="root")
    parser.add_argument("--password", default="")
    parser.add_argument("--db",       default="evenzo")
    args = parser.parse_args()

    print(f"\nSeeding database at: {args.user}@{args.host}/{args.db}\n")
    seed(args.host, args.user, args.password, args.db)

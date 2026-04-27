from fastapi import APIRouter, Depends
from db import get_cursor
from auth import get_current_user, require_role

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/student")
def student_dashboard(user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        # Get student_id
        cur.execute("SELECT student_id FROM STUDENT WHERE user_id = %s", (uid,))
        srow = cur.fetchone()
        if not srow:
            return {
                "upcoming_events_count": 0, "registrations_count": 0,
                "active_teams_count": 0, "points": 0, "recent_registrations": [],
            }
        student_id = srow[0]

        cur.execute(
            """SELECT
                 SUM(CASE WHEN registration_status IN ('Registered','Pending') THEN 1 ELSE 0 END),
                 SUM(CASE WHEN registration_status = 'Registered' THEN 1 ELSE 0 END)
               FROM REGISTRATION WHERE student_id = %s""",
            (student_id,),
        )
        row = cur.fetchone()
        reg_count, confirmed_count = (row[0] or 0), (row[1] or 0)

        cur.execute(
            """SELECT COUNT(DISTINCT t.team_id)
               FROM TEAM t
               JOIN REGISTRATION r ON r.team_id = t.team_id
               WHERE r.student_id = %s AND r.registration_status != 'Cancelled'""",
            (student_id,),
        )
        active_teams = cur.fetchone()[0]

        cur.execute(
            """SELECT COUNT(*)
               FROM REGISTRATION r JOIN EVENT e ON r.event_id = e.event_id
               WHERE r.student_id = %s AND r.registration_status != 'Cancelled'
                 AND e.start_datetime > NOW()""",
            (student_id,),
        )
        upcoming = cur.fetchone()[0]

        cur.execute(
            """SELECT r.registration_id AS reg_id, r.event_id, e.title,
                      e.start_datetime, r.registration_status AS status,
                      r.created_at AS registered_at,
                      v.venue_name, t.team_name
               FROM REGISTRATION r
               JOIN EVENT e       ON r.event_id = e.event_id
               LEFT JOIN VENUE v  ON e.venue_id = v.venue_id
               LEFT JOIN TEAM t   ON r.team_id  = t.team_id
               WHERE r.student_id = %s AND r.registration_status != 'Cancelled'
               ORDER BY e.start_datetime ASC LIMIT 6""",
            (student_id,),
        )
        cols = [d[0] for d in cur.description]
        recent_regs = [dict(zip(cols, row)) for row in cur.fetchall()]

    return {
        "upcoming_events_count": int(upcoming),
        "registrations_count":   int(reg_count),
        "active_teams_count":    int(active_teams),
        "points":                int(confirmed_count) * 10,
        "recent_registrations":  recent_regs,
    }


@router.get("/organizer")
def organizer_dashboard(user: dict = Depends(require_role("organizer", "faculty", "admin"))):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM EVENT WHERE created_by_user_id = %s", (uid,))
        total_events = cur.fetchone()[0]

        cur.execute(
            """SELECT COUNT(r.registration_id)
               FROM REGISTRATION r JOIN EVENT e ON r.event_id = e.event_id
               WHERE e.created_by_user_id = %s AND r.registration_status = 'Registered'""",
            (uid,),
        )
        total_regs = cur.fetchone()[0]

        cur.execute(
            "SELECT COUNT(*) FROM EVENT WHERE created_by_user_id=%s AND approval_status='Pending'",
            (uid,),
        )
        pending = cur.fetchone()[0]

        cur.execute(
            """SELECT es.event_id, es.title, es.category, es.event_status,
                      es.approval_status, es.start_datetime, es.confirmed_count
               FROM event_summary es
               WHERE es.created_by_user_id = %s
               ORDER BY es.created_at DESC LIMIT 8""",
            (uid,),
        )
        cols = [d[0] for d in cur.description]
        recent = [dict(zip(cols, r)) for r in cur.fetchall()]

    return {
        "total_events":           int(total_events),
        "total_registrations":    int(total_regs),
        "pending_approval_count": int(pending),
        "recent_events":          recent,
    }


@router.get("/admin")
def admin_dashboard(_: dict = Depends(require_role("admin"))):
    with get_cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM EVENT")
        total_events = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM EVENT WHERE approval_status='Pending'")
        pending = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM STUDENT")
        total_students = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM REGISTRATION WHERE registration_status != 'Cancelled'")
        total_regs = cur.fetchone()[0]

        cur.execute(
            """SELECT es.event_id, es.title, es.category, es.organizer_name,
                      es.venue_name, es.description, es.start_datetime, es.created_at
               FROM event_summary es
               WHERE es.approval_status = 'Pending'
               ORDER BY es.created_at ASC LIMIT 10"""
        )
        cols = [d[0] for d in cur.description]
        pending_events = [dict(zip(cols, r)) for r in cur.fetchall()]

    return {
        "total_events":        int(total_events),
        "pending_count":       int(pending),
        "total_students":      int(total_students),
        "total_registrations": int(total_regs),
        "pending_events":      pending_events,
    }

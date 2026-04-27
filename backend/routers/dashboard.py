from fastapi import APIRouter, Depends
from db import get_cursor
from auth import get_current_user, require_role

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/student")
def student_dashboard(user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            """SELECT
                 SUM(CASE WHEN status IN ('registered','pending') THEN 1 ELSE 0 END) AS reg_count,
                 SUM(CASE WHEN status = 'registered' THEN 1 ELSE 0 END) AS confirmed_count
               FROM registrations WHERE user_id = %s""",
            (uid,),
        )
        row = cur.fetchone()
        reg_count, confirmed_count = row[0] or 0, row[1] or 0

        cur.execute(
            """SELECT COUNT(DISTINCT t.team_id)
               FROM teams t
               JOIN registrations r ON r.team_id = t.team_id
               WHERE r.user_id = %s AND r.status != 'cancelled'""",
            (uid,),
        )
        active_teams = cur.fetchone()[0]

        # Upcoming events count (future registered)
        cur.execute(
            """SELECT COUNT(*)
               FROM registrations r
               JOIN events e ON r.event_id = e.event_id
               WHERE r.user_id = %s AND r.status != 'cancelled'
                 AND e.start_datetime > NOW()""",
            (uid,),
        )
        upcoming = cur.fetchone()[0]

        # Recent registrations (carousel data)
        cur.execute(
            """SELECT r.reg_id, r.event_id, e.title,
                      e.start_datetime, r.status, r.registered_at,
                      v.name AS venue_name, t.team_name
               FROM registrations r
               JOIN events e ON r.event_id = e.event_id
               LEFT JOIN venues v ON e.venue_id = v.venue_id
               LEFT JOIN teams  t ON r.team_id  = t.team_id
               WHERE r.user_id = %s AND r.status != 'cancelled'
               ORDER BY e.start_datetime ASC LIMIT 6""",
            (uid,),
        )
        cols = [d[0] for d in cur.description]
        recent_regs = [dict(zip(cols, row)) for row in cur.fetchall()]

    return {
        "upcoming_events_count":  int(upcoming),
        "registrations_count":    int(reg_count),
        "active_teams_count":     int(active_teams),
        "points":                 int(confirmed_count) * 10,
        "recent_registrations":   recent_regs,
    }


@router.get("/organizer")
def organizer_dashboard(user: dict = Depends(require_role("organizer", "faculty", "admin"))):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FROM events WHERE organizer_id = %s", (uid,)
        )
        total_events = cur.fetchone()[0]

        cur.execute(
            """SELECT COUNT(r.reg_id)
               FROM registrations r JOIN events e ON r.event_id = e.event_id
               WHERE e.organizer_id = %s AND r.status = 'registered'""",
            (uid,),
        )
        total_regs = cur.fetchone()[0]

        cur.execute(
            "SELECT COUNT(*) FROM events WHERE organizer_id=%s AND approval_status='pending'",
            (uid,),
        )
        pending = cur.fetchone()[0]

        cur.execute(
            """SELECT es.event_id, es.title, es.category, es.event_status,
                      es.approval_status, es.start_datetime, es.confirmed_count
               FROM event_summary es
               WHERE es.organizer_id = %s
               ORDER BY es.created_at DESC LIMIT 8""",
            (uid,),
        )
        cols = [d[0] for d in cur.description]
        recent = [dict(zip(cols, r)) for r in cur.fetchall()]

    return {
        "total_events":          int(total_events),
        "total_registrations":   int(total_regs),
        "pending_approval_count": int(pending),
        "recent_events":         recent,
    }


@router.get("/admin")
def admin_dashboard(_: dict = Depends(require_role("admin"))):
    with get_cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM events")
        total_events = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM events WHERE approval_status='pending'")
        pending = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM users WHERE role IN ('student','other_student')")
        total_students = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM registrations WHERE status != 'cancelled'")
        total_regs = cur.fetchone()[0]

        cur.execute(
            """SELECT es.event_id, es.title, es.category, es.organizer_name,
                      es.venue_name, es.description, es.start_datetime, es.created_at
               FROM event_summary es
               WHERE es.approval_status = 'pending'
               ORDER BY es.created_at ASC LIMIT 10""",
        )
        cols = [d[0] for d in cur.description]
        pending_events = [dict(zip(cols, r)) for r in cur.fetchall()]

    return {
        "total_events":       int(total_events),
        "pending_count":      int(pending),
        "total_students":     int(total_students),
        "total_registrations": int(total_regs),
        "pending_events":     pending_events,
    }

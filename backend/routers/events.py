from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from db import get_cursor
from models import EventCreate
from auth import get_current_user, require_role

router = APIRouter(prefix="/events", tags=["events"])


def _cols(cur):
    return [d[0] for d in cur.description]


@router.get("")
def list_events(
    search:   Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit:    int = Query(20, le=100),
    offset:   int = Query(0),
):
    """Public — returns approved events only."""
    conditions = ["es.approval_status = 'approved'"]
    params: list = []

    if search:
        conditions.append("es.title LIKE %s")
        params.append(f"%{search}%")
    if category and category != "All":
        conditions.append("es.category = %s")
        params.append(category)

    where = " AND ".join(conditions)

    with get_cursor() as cur:
        cur.execute(
            f"""SELECT * FROM event_summary es WHERE {where}
                ORDER BY es.start_datetime ASC
                LIMIT %s OFFSET %s""",
            params + [limit, offset],
        )
        cols = _cols(cur)
        return [dict(zip(cols, r)) for r in cur.fetchall()]


@router.get("/my")
def my_events(user: dict = Depends(require_role("organizer", "faculty", "admin"))):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            "SELECT * FROM event_summary WHERE organizer_id = %s ORDER BY created_at DESC",
            (uid,),
        )
        cols = _cols(cur)
        return [dict(zip(cols, r)) for r in cur.fetchall()]


@router.get("/{event_id}")
def get_event(event_id: int):
    with get_cursor() as cur:
        cur.execute(
            "SELECT * FROM event_summary WHERE event_id = %s",
            (event_id,),
        )
        cols = _cols(cur)
        row  = cur.fetchone()
    if not row:
        raise HTTPException(404, "Event not found")
    return dict(zip(cols, row))


@router.post("", status_code=201)
def create_event(
    body: EventCreate,
    user: dict = Depends(require_role("organizer", "faculty", "admin")),
):
    uid = int(user["sub"])

    # ── Sanity: start < end, deadline <= start ───────────────────
    if body.end_datetime <= body.start_datetime:
        raise HTTPException(400, "Event end time must be after start time")
    if body.registration_deadline > body.start_datetime:
        raise HTTPException(400, "Registration deadline must be on or before the start time")

    with get_cursor() as cur:
        # ── Venue-clash: overlap against any non-rejected event at same venue ──
        cur.execute(
            """SELECT e.event_id, e.title, e.start_datetime, e.end_datetime
               FROM events e
               WHERE e.venue_id = %s
                 AND e.approval_status IN ('pending','approved')
                 AND e.start_datetime < %s
                 AND e.end_datetime   > %s
               LIMIT 1""",
            (body.venue_id, body.end_datetime, body.start_datetime),
        )
        clash = cur.fetchone()
        if clash:
            raise HTTPException(
                409,
                f"Venue clash: '{clash[1]}' already booked at this venue "
                f"from {clash[2]} to {clash[3]}. Pick a different slot or venue.",
            )

        # ── Venue capacity check ──────────────────────────────────
        cur.execute("SELECT capacity, name FROM venues WHERE venue_id = %s", (body.venue_id,))
        vrow = cur.fetchone()
        if not vrow:
            raise HTTPException(400, "Invalid venue")
        if body.max_participants and body.max_participants > vrow[0]:
            raise HTTPException(
                400,
                f"Max participants ({body.max_participants}) exceeds venue '{vrow[1]}' "
                f"capacity of {vrow[0]}.",
            )

        cur.execute(
            """INSERT INTO events
               (organizer_id, venue_id, title, category, description, eligibility,
                start_datetime, end_datetime, registration_deadline,
                fee, min_team_size, max_team_size, max_participants,
                upi_id, payee_name, approval_status)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                       CASE WHEN %s = 'admin' THEN 'approved' ELSE 'pending' END)""",
            (uid, body.venue_id, body.title, body.category, body.description,
             body.eligibility, body.start_datetime, body.end_datetime,
             body.registration_deadline, body.fee, body.min_team_size,
             body.max_team_size, body.max_participants,
             body.upi_id, body.payee_name, user["role"]),
        )
        event_id = cur.lastrowid
    return {"event_id": event_id, "message": "Event submitted for approval"}


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    user: dict = Depends(require_role("organizer", "faculty", "admin")),
):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            "SELECT organizer_id, approval_status FROM events WHERE event_id = %s",
            (event_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Event not found")
        if user["role"] != "admin" and row[0] != uid:
            raise HTTPException(403, "Not your event")
        if user["role"] != "admin" and row[1] != "pending":
            raise HTTPException(400, "Can only delete pending events")
        cur.execute("DELETE FROM events WHERE event_id = %s", (event_id,))
    return {"message": "Event deleted"}

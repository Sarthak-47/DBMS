from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from db import get_cursor
from auth import require_role

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/events")
def all_events(
    search: Optional[str] = Query(None),
    _: dict = Depends(require_role("admin")),
):
    conditions = ["1=1"]
    params: list = []
    if search:
        conditions.append("(es.title LIKE %s OR es.organizer_name LIKE %s)")
        params += [f"%{search}%", f"%{search}%"]
    where = " AND ".join(conditions)
    with get_cursor() as cur:
        cur.execute(
            f"""SELECT es.event_id, es.title, es.category, es.organizer_name,
                       es.venue_name, es.approval_status, es.event_status,
                       es.start_datetime, es.created_at
                FROM event_summary es WHERE {where}
                ORDER BY es.created_at DESC LIMIT 100""",
            params,
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]


@router.get("/pending")
def pending_events(_: dict = Depends(require_role("admin"))):
    with get_cursor() as cur:
        cur.execute(
            """SELECT es.event_id, es.title, es.category, es.organizer_name,
                      es.venue_name, es.description, es.start_datetime, es.created_at
               FROM event_summary es
               WHERE es.approval_status = 'pending'
               ORDER BY es.created_at ASC""",
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]


@router.patch("/events/{event_id}/approve")
def approve_event(event_id: int, _: dict = Depends(require_role("admin"))):
    with get_cursor() as cur:
        cur.execute(
            "UPDATE events SET approval_status='approved' WHERE event_id=%s",
            (event_id,),
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Event not found")
    return {"message": "Event approved"}


@router.patch("/events/{event_id}/reject")
def reject_event(event_id: int, _: dict = Depends(require_role("admin"))):
    with get_cursor() as cur:
        cur.execute(
            "UPDATE events SET approval_status='rejected' WHERE event_id=%s",
            (event_id,),
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Event not found")
    return {"message": "Event rejected"}


@router.get("/registrations")
def all_registrations(_: dict = Depends(require_role("admin"))):
    with get_cursor() as cur:
        cur.execute(
            """SELECT r.reg_id, u.full_name, u.reg_no,
                      e.title, t.team_name,
                      r.status, r.payment_ref, r.registered_at
               FROM registrations r
               JOIN users  u ON r.user_id  = u.user_id
               JOIN events e ON r.event_id = e.event_id
               LEFT JOIN teams t ON r.team_id = t.team_id
               ORDER BY r.registered_at DESC LIMIT 200""",
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]

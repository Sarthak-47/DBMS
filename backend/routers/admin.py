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
               WHERE es.approval_status = 'Pending'
               ORDER BY es.created_at ASC"""
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]


@router.patch("/events/{event_id}/approve")
def approve_event(event_id: int, user: dict = Depends(require_role("admin"))):
    uid = int(user["sub"])
    with get_cursor() as cur:
        # Get admin_id from ADMIN table
        cur.execute("SELECT admin_id FROM ADMIN WHERE user_id = %s", (uid,))
        arow = cur.fetchone()
        admin_id = arow[0] if arow else None
        cur.execute(
            "UPDATE EVENT SET approval_status='Approved', approved_by_admin_id=%s, approved_at=NOW() WHERE event_id=%s",
            (admin_id, event_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Event not found")
    return {"message": "Event approved"}


@router.patch("/events/{event_id}/reject")
def reject_event(event_id: int, _: dict = Depends(require_role("admin"))):
    with get_cursor() as cur:
        cur.execute(
            "UPDATE EVENT SET approval_status='Rejected' WHERE event_id=%s",
            (event_id,),
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Event not found")
    return {"message": "Event rejected"}


@router.get("/registrations")
def all_registrations(_: dict = Depends(require_role("admin"))):
    with get_cursor() as cur:
        cur.execute(
            """SELECT r.registration_id AS reg_id,
                      s.full_name,
                      srm.reg_no,
                      e.title,
                      t.team_name,
                      r.registration_status AS status,
                      p.transaction_reference AS payment_ref,
                      r.created_at AS registered_at
               FROM REGISTRATION r
               JOIN STUDENT s           ON r.student_id = s.student_id
               JOIN EVENT e             ON r.event_id = e.event_id
               LEFT JOIN SRM_STUDENT srm ON s.student_id = srm.student_id
               LEFT JOIN TEAM t         ON r.team_id = t.team_id
               LEFT JOIN PAYMENT p      ON r.registration_id = p.registration_id
               ORDER BY r.created_at DESC LIMIT 200"""
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]

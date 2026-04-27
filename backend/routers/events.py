import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from typing import Optional
from db import get_cursor
from models import EventCreate
from auth import get_current_user, require_role

QR_DIR = os.path.join(os.path.dirname(__file__), "..", "qr_images")

router = APIRouter(prefix="/events", tags=["events"])


def _cols(cur):
    return [d[0] for d in cur.description]


def _get_organizer_id(cur, user_id: int) -> int:
    """Return the CLUB_OR_DEPARTMENT.organizer_id for this user.
    For admin, use/create the 'Administration' department."""
    cur.execute(
        """SELECT om.organizer_id FROM ORGANIZER_MEMBERS om
           WHERE om.user_id = %s LIMIT 1""",
        (user_id,),
    )
    row = cur.fetchone()
    if row:
        return row[0]

    # Admin fallback: use 'Administration' dept
    cur.execute(
        "SELECT organizer_id FROM CLUB_OR_DEPARTMENT WHERE organizer_name = 'Administration'"
    )
    row = cur.fetchone()
    if row:
        return row[0]

    # Create it
    cur.execute(
        "INSERT INTO CLUB_OR_DEPARTMENT (organizer_type, organizer_name) VALUES ('Department','Administration')"
    )
    return cur.lastrowid


@router.get("")
def list_events(
    search:   Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit:    int = Query(20, le=100),
    offset:   int = Query(0),
):
    conditions = ["es.approval_status = 'Approved'"]
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
                ORDER BY es.start_datetime ASC LIMIT %s OFFSET %s""",
            params + [limit, offset],
        )
        cols = _cols(cur)
        return [dict(zip(cols, r)) for r in cur.fetchall()]


@router.get("/my")
def my_events(user: dict = Depends(require_role("organizer", "faculty", "admin"))):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            "SELECT * FROM event_summary WHERE created_by_user_id = %s ORDER BY created_at DESC",
            (uid,),
        )
        cols = _cols(cur)
        return [dict(zip(cols, r)) for r in cur.fetchall()]


@router.get("/{event_id}")
def get_event(event_id: int):
    with get_cursor() as cur:
        cur.execute("SELECT * FROM event_summary WHERE event_id = %s", (event_id,))
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
    deadline = body.resolved_deadline()
    fee      = body.resolved_fee()

    if not body.title or not body.category:
        raise HTTPException(400, "title and category are required")
    if body.start_datetime and body.end_datetime and body.end_datetime <= body.start_datetime:
        raise HTTPException(400, "Event end time must be after start time")
    if deadline and body.start_datetime and deadline > body.start_datetime:
        raise HTTPException(400, "Registration deadline must be on or before start time")

    with get_cursor() as cur:
        # Venue clash check
        if body.venue_id and body.start_datetime and body.end_datetime:
            cur.execute(
                """SELECT e.event_id, e.title FROM EVENT e
                   WHERE e.venue_id = %s AND e.approval_status IN ('Pending','Approved')
                     AND e.start_datetime < %s AND e.end_datetime > %s
                   LIMIT 1""",
                (body.venue_id, body.end_datetime, body.start_datetime),
            )
            clash = cur.fetchone()
            if clash:
                raise HTTPException(
                    409,
                    f"Venue clash: '{clash[1]}' is already booked in this slot. Pick a different time or venue.",
                )

        # Capacity check
        if body.venue_id and body.max_participants:
            cur.execute("SELECT capacity, venue_name FROM VENUE WHERE venue_id = %s", (body.venue_id,))
            vrow = cur.fetchone()
            if not vrow:
                raise HTTPException(400, "Invalid venue")
            if body.max_participants > vrow[0]:
                raise HTTPException(
                    400,
                    f"max_participants ({body.max_participants}) exceeds venue '{vrow[1]}' capacity ({vrow[0]})",
                )

        organizer_id = _get_organizer_id(cur, uid)
        approval = 'Approved' if user["role"] == 'admin' else 'Pending'

        cur.execute(
            """INSERT INTO EVENT
               (title, description, category, eligibility,
                start_datetime, end_datetime, reg_last_date,
                reg_fee, min_team_size, max_team_size, max_participants,
                upi_id, payee_name, registration_link,
                venue_id, organizer_id, created_by_user_id, approval_status)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (body.title,
             body.description or '',
             body.category,
             body.eligibility or 'Open to all',
             body.start_datetime,
             body.end_datetime,
             deadline,
             fee,
             body.min_team_size,
             body.max_team_size,
             body.max_participants or 100,
             body.upi_id,
             body.payee_name,
             body.registration_link or 'platform',
             body.venue_id,
             organizer_id,
             uid,
             approval),
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
            "SELECT created_by_user_id, approval_status FROM EVENT WHERE event_id = %s",
            (event_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Event not found")
        if user["role"] != "admin" and row[0] != uid:
            raise HTTPException(403, "Not your event")
        if user["role"] != "admin" and row[1] != "Pending":
            raise HTTPException(400, "Can only delete pending events")
        cur.execute("DELETE FROM EVENT WHERE event_id = %s", (event_id,))
    return {"message": "Event deleted"}


@router.post("/{event_id}/upload-qr", status_code=200)
async def upload_qr(
    event_id: int,
    file: UploadFile = File(...),
    user: dict = Depends(require_role("organizer", "faculty", "admin")),
):
    """Upload a UPI QR code image for a paid event."""
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute("SELECT created_by_user_id FROM EVENT WHERE event_id = %s", (event_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Event not found")
        if user["role"] != "admin" and row[0] != uid:
            raise HTTPException(403, "Not your event")

    # Validate file type
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        ext = ".jpg"
    filename = f"qr_{event_id}_{uuid.uuid4().hex[:8]}{ext}"
    os.makedirs(QR_DIR, exist_ok=True)
    save_path = os.path.join(QR_DIR, filename)

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    qr_path = f"/qr/{filename}"
    with get_cursor() as cur:
        cur.execute("UPDATE EVENT SET qr_image_path = %s WHERE event_id = %s", (qr_path, event_id))

    return {"qr_image_path": qr_path}


@router.get("/{event_id}/pending-payments")
def pending_payments(
    event_id: int,
    user: dict = Depends(require_role("organizer", "faculty", "admin")),
):
    """List registrations awaiting payment verification for an organizer's event."""
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute("SELECT created_by_user_id, title FROM EVENT WHERE event_id = %s", (event_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Event not found")
        if user["role"] != "admin" and row[0] != uid:
            raise HTTPException(403, "Not your event")

        cur.execute(
            """SELECT r.registration_id,
                      s.full_name,
                      srm.reg_no,
                      p.transaction_reference,
                      p.payment_status,
                      p.paid_at,
                      r.registration_status,
                      t.team_name,
                      r.created_at
               FROM REGISTRATION r
               JOIN STUDENT s           ON r.student_id = s.student_id
               LEFT JOIN SRM_STUDENT srm ON s.student_id = srm.student_id
               LEFT JOIN PAYMENT p       ON r.registration_id = p.registration_id
               LEFT JOIN TEAM t          ON r.team_id = t.team_id
               WHERE r.event_id = %s AND r.registration_status = 'Pending'
               ORDER BY r.created_at DESC""",
            (event_id,),
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]

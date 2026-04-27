from fastapi import APIRouter, Depends, HTTPException
from db import get_cursor, get_conn
from models import RegistrationCreate
from auth import get_current_user, require_role  # noqa: F401 (require_role used below)

router = APIRouter(prefix="/registrations", tags=["registrations"])


@router.post("", status_code=201)
def register(body: RegistrationCreate, user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_conn() as conn:
        cur = conn.cursor()
        try:
            # User time-clash check
            cur.execute(
                """SELECT e2.event_id, e2.title, e2.start_datetime, e2.end_datetime
                   FROM EVENT e1
                   JOIN REGISTRATION r  ON r.event_id <> e1.event_id
                                       AND r.student_id = (SELECT student_id FROM STUDENT WHERE user_id = %s)
                                       AND r.registration_status <> 'Cancelled'
                   JOIN EVENT e2 ON e2.event_id = r.event_id
                   WHERE e1.event_id = %s
                     AND e1.start_datetime < e2.end_datetime
                     AND e1.end_datetime   > e2.start_datetime
                   LIMIT 1""",
                (uid, body.event_id),
            )
            conflict = cur.fetchone()
            if conflict:
                raise HTTPException(
                    409,
                    f"Time clash: you're already registered for '{conflict[1]}' "
                    f"({conflict[2]} to {conflict[3]}) which overlaps this event.",
                )

            cur.execute(
                "CALL register_for_event(%s, %s, %s, %s)",
                (uid, body.event_id, body.team_name or None, body.payment_ref or None),
            )
            conn.commit()

            cur.execute(
                """SELECT r.registration_id, r.registration_status
                   FROM REGISTRATION r JOIN STUDENT s ON r.student_id = s.student_id
                   WHERE s.user_id = %s AND r.event_id = %s
                   ORDER BY r.created_at DESC LIMIT 1""",
                (uid, body.event_id),
            )
            reg_row = cur.fetchone()
            reg_id = reg_row[0] if reg_row else None
            status = reg_row[1] if reg_row else 'Registered'

        except HTTPException:
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            msg = str(e)
            if ':' in msg:
                msg = msg.split(':', 1)[-1].strip()
            raise HTTPException(400, msg)
        finally:
            cur.close()

    return {"reg_id": reg_id, "status": status, "message": "Registered successfully"}


@router.get("/my")
def my_registrations(user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            """SELECT r.registration_id AS reg_id,
                      r.event_id,
                      e.title,
                      e.category,
                      e.start_datetime,
                      e.end_datetime,
                      v.venue_name,
                      r.registration_status AS status,
                      r.created_at AS registered_at,
                      t.team_name,
                      t.team_id,
                      p.transaction_reference AS payment_ref,
                      p.payment_status
               FROM REGISTRATION r
               JOIN STUDENT s   ON r.student_id = s.student_id
               JOIN EVENT e     ON r.event_id = e.event_id
               LEFT JOIN VENUE v  ON e.venue_id = v.venue_id
               LEFT JOIN TEAM t   ON r.team_id = t.team_id
               LEFT JOIN PAYMENT p ON r.registration_id = p.registration_id
               WHERE s.user_id = %s
               ORDER BY r.created_at DESC""",
            (uid,),
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


@router.patch("/{reg_id}/cancel")
def cancel_registration(reg_id: int, user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            """SELECT s.user_id, r.registration_status
               FROM REGISTRATION r JOIN STUDENT s ON r.student_id = s.student_id
               WHERE r.registration_id = %s""",
            (reg_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Registration not found")
        if row[0] != uid and user["role"] != "admin":
            raise HTTPException(403, "Not your registration")
        if row[1] == "Cancelled":
            raise HTTPException(400, "Already cancelled")
        cur.execute(
            "UPDATE REGISTRATION SET registration_status='Cancelled' WHERE registration_id=%s",
            (reg_id,),
        )
    return {"message": "Registration cancelled"}


@router.patch("/{reg_id}/verify-payment")
def verify_payment(
    reg_id: int,
    user: dict = Depends(require_role("organizer", "faculty", "admin")),
):
    """Organizer confirms a student's payment — moves registration to Registered."""
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            """SELECT e.created_by_user_id, r.registration_status
               FROM REGISTRATION r
               JOIN EVENT e ON r.event_id = e.event_id
               WHERE r.registration_id = %s""",
            (reg_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Registration not found")
        if user["role"] != "admin" and row[0] != uid:
            raise HTTPException(403, "Not your event's registration")
        if row[1] != "Pending":
            raise HTTPException(400, "Registration is not pending payment verification")
        cur.execute(
            "UPDATE REGISTRATION SET registration_status='Registered' WHERE registration_id=%s",
            (reg_id,),
        )
        cur.execute(
            "UPDATE PAYMENT SET payment_status='Success' WHERE registration_id=%s",
            (reg_id,),
        )
    return {"message": "Payment verified — registration confirmed"}


@router.patch("/{reg_id}/reject-payment")
def reject_payment(
    reg_id: int,
    user: dict = Depends(require_role("organizer", "faculty", "admin")),
):
    """Organizer rejects an invalid/unverifiable payment — cancels the registration."""
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            """SELECT e.created_by_user_id, r.registration_status
               FROM REGISTRATION r
               JOIN EVENT e ON r.event_id = e.event_id
               WHERE r.registration_id = %s""",
            (reg_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Registration not found")
        if user["role"] != "admin" and row[0] != uid:
            raise HTTPException(403, "Not your event's registration")
        if row[1] != "Pending":
            raise HTTPException(400, "Registration is not pending payment verification")
        cur.execute(
            "UPDATE REGISTRATION SET registration_status='Cancelled' WHERE registration_id=%s",
            (reg_id,),
        )
        cur.execute(
            "UPDATE PAYMENT SET payment_status='Failed' WHERE registration_id=%s",
            (reg_id,),
        )
    return {"message": "Payment rejected — registration cancelled"}

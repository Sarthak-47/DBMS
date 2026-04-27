from fastapi import APIRouter, Depends, HTTPException
from db import get_cursor, get_conn
from models import RegistrationCreate
from auth import get_current_user, require_role

router = APIRouter(prefix="/registrations", tags=["registrations"])


@router.post("", status_code=201)
def register(body: RegistrationCreate, user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_conn() as conn:
        cur = conn.cursor()
        try:
            # ── User time-clash check ─────────────────────────────
            cur.execute(
                """SELECT e2.event_id, e2.title, e2.start_datetime, e2.end_datetime
                   FROM events e1
                   JOIN registrations r ON r.event_id <> e1.event_id
                                        AND r.user_id = %s
                                        AND r.status <> 'cancelled'
                   JOIN events e2 ON e2.event_id = r.event_id
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
                    f"({conflict[2]} → {conflict[3]}) which overlaps with this event.",
                )

            cur.execute(
                "CALL register_for_event(%s, %s, %s, %s)",
                (uid, body.event_id,
                 body.team_name   or None,
                 body.payment_ref or None),
            )
            conn.commit()
            cur.execute(
                """SELECT reg_id, status FROM registrations
                   WHERE user_id = %s AND event_id = %s
                   ORDER BY registered_at DESC LIMIT 1""",
                (uid, body.event_id),
            )
            reg_id, status = cur.fetchone()
        except HTTPException:
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            msg = str(e)
            # MySQL SIGNAL errors look like "1644 (45000): actual message"
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
            """SELECT r.reg_id, r.event_id, e.title,
                      e.category, e.start_datetime, e.end_datetime,
                      v.name AS venue_name,
                      r.status, r.payment_ref, r.registered_at,
                      t.team_name, t.team_id
               FROM registrations r
               JOIN events e ON r.event_id = e.event_id
               LEFT JOIN venues v ON e.venue_id = v.venue_id
               LEFT JOIN teams  t ON r.team_id  = t.team_id
               WHERE r.user_id = %s
               ORDER BY r.registered_at DESC""",
            (uid,),
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


@router.patch("/{reg_id}/cancel")
def cancel_registration(reg_id: int, user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            "SELECT user_id, status FROM registrations WHERE reg_id = %s", (reg_id,)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Registration not found")
        if row[0] != uid and user["role"] != "admin":
            raise HTTPException(403, "Not your registration")
        if row[1] == "cancelled":
            raise HTTPException(400, "Already cancelled")
        cur.execute(
            "UPDATE registrations SET status='cancelled' WHERE reg_id=%s", (reg_id,)
        )
    return {"message": "Registration cancelled"}

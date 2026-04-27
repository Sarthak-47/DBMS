from fastapi import APIRouter, Depends, HTTPException
from db import get_cursor
from auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/my")
def my_notifications(user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            """SELECT notif_id, message, is_read, created_at
               FROM notifications WHERE user_id = %s
               ORDER BY created_at DESC LIMIT 20""",
            (uid,),
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]


@router.patch("/{notif_id}/read")
def mark_read(notif_id: int, user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            "SELECT user_id FROM notifications WHERE notif_id=%s", (notif_id,)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Notification not found")
        if row[0] != uid:
            raise HTTPException(403, "Not your notification")
        cur.execute(
            "UPDATE notifications SET is_read=TRUE WHERE notif_id=%s", (notif_id,)
        )
    return {"message": "Marked as read"}

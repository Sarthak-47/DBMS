from fastapi import APIRouter, Depends, HTTPException
from db import get_cursor
from models import ClubCreate
from auth_utils import get_current_user, require_role

router = APIRouter(prefix="/clubs", tags=["clubs"])


@router.get("")
def list_clubs():
    with get_cursor() as cur:
        cur.execute(
            """SELECT c.club_id, c.name, c.description, c.verified, c.created_at,
                      u.name AS organiser_name, u.email AS organiser_email,
                      fa.name AS faculty_advisor
               FROM clubs c
               LEFT JOIN users u ON c.organiser_id = u.user_id
               LEFT JOIN users fa ON c.faculty_advisor_id = fa.user_id
               WHERE c.verified = TRUE
               ORDER BY c.name""",
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]


@router.get("/{club_id}")
def get_club(club_id: int):
    with get_cursor() as cur:
        cur.execute(
            """SELECT c.*, u.name AS organiser_name, fa.name AS faculty_advisor
               FROM clubs c
               LEFT JOIN users u ON c.organiser_id = u.user_id
               LEFT JOIN users fa ON c.faculty_advisor_id = fa.user_id
               WHERE c.club_id = %s""",
            (club_id,),
        )
        cols = [d[0] for d in cur.description]
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, "Club not found")
    return dict(zip(cols, row))


@router.post("", status_code=201)
def create_club(body: ClubCreate, user=Depends(require_role("organiser", "admin"))):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            """INSERT INTO clubs(name, description, organiser_id, faculty_advisor_id, verified)
               VALUES(%s, %s, %s, %s, %s) RETURNING club_id""",
            (body.name, body.description, uid, body.faculty_advisor_id,
             user["role"] == "admin"),
        )
        club_id = cur.fetchone()[0]
    return {"club_id": club_id, "message": "Club created, pending verification"}

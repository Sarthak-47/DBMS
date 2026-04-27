from fastapi import APIRouter, Depends, HTTPException
from db import get_cursor
from auth import get_current_user, require_role

router = APIRouter(prefix="/clubs", tags=["clubs"])


@router.get("")
def list_clubs(_: dict = Depends(get_current_user)):
    """List all clubs and departments (CLUB_OR_DEPARTMENT table)."""
    with get_cursor() as cur:
        cur.execute(
            """SELECT organizer_id, organizer_name AS name,
                      organizer_type AS type, created_at
               FROM CLUB_OR_DEPARTMENT
               ORDER BY organizer_name"""
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]


@router.get("/{organizer_id}")
def get_club(organizer_id: int, _: dict = Depends(get_current_user)):
    with get_cursor() as cur:
        cur.execute(
            """SELECT cod.organizer_id, cod.organizer_name AS name,
                      cod.organizer_type AS type, cod.created_at
               FROM CLUB_OR_DEPARTMENT cod
               WHERE cod.organizer_id = %s""",
            (organizer_id,),
        )
        cols = [d[0] for d in cur.description]
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, "Club/Department not found")
    return dict(zip(cols, row))


@router.post("", status_code=201)
def create_club(
    body: dict,
    _: dict = Depends(require_role("admin")),
):
    name = body.get("name") or body.get("organizer_name", "")
    org_type = body.get("type") or body.get("organizer_type", "Club")
    if org_type not in ("Club", "Department"):
        org_type = "Club"
    if not name:
        raise HTTPException(400, "name is required")
    with get_cursor() as cur:
        cur.execute(
            "SELECT organizer_id FROM CLUB_OR_DEPARTMENT WHERE organizer_name = %s",
            (name,),
        )
        if cur.fetchone():
            raise HTTPException(409, "Club/Department with this name already exists")
        cur.execute(
            "INSERT INTO CLUB_OR_DEPARTMENT (organizer_type, organizer_name) VALUES (%s,%s)",
            (org_type, name),
        )
        oid = cur.lastrowid
    return {"organizer_id": oid, "message": "Club/Department created"}


@router.delete("/{organizer_id}")
def delete_club(organizer_id: int, _: dict = Depends(require_role("admin"))):
    with get_cursor() as cur:
        cur.execute(
            "SELECT organizer_id FROM CLUB_OR_DEPARTMENT WHERE organizer_id = %s",
            (organizer_id,),
        )
        if not cur.fetchone():
            raise HTTPException(404, "Club/Department not found")
        cur.execute(
            "DELETE FROM CLUB_OR_DEPARTMENT WHERE organizer_id = %s", (organizer_id,)
        )
    return {"message": "Club/Department deleted"}

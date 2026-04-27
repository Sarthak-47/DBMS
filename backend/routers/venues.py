from fastapi import APIRouter, Depends, HTTPException
from db import get_cursor
from models import VenueCreate
from auth import get_current_user, require_role

router = APIRouter(prefix="/venues", tags=["venues"])


@router.get("")
def list_venues(_: dict = Depends(get_current_user)):
    with get_cursor() as cur:
        cur.execute(
            """SELECT venue_id,
                      venue_name,
                      venue_name AS name,
                      building_name,
                      floor,
                      room_no,
                      type,
                      capacity
               FROM VENUE ORDER BY venue_name"""
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]


@router.post("", status_code=201)
def create_venue(body: VenueCreate, _: dict = Depends(require_role("admin"))):
    vname = body.resolved_venue_name()
    if not vname:
        raise HTTPException(400, "venue_name is required")
    with get_cursor() as cur:
        cur.execute(
            "INSERT INTO VENUE (venue_name, building_name, floor, room_no, type, capacity) VALUES (%s,%s,%s,%s,%s,%s)",
            (vname, body.building_name, body.floor, body.room_no, body.type, body.capacity),
        )
        vid = cur.lastrowid
    return {"venue_id": vid, "message": "Venue created"}


@router.delete("/{venue_id}")
def delete_venue(venue_id: int, _: dict = Depends(require_role("admin"))):
    with get_cursor() as cur:
        cur.execute("SELECT venue_id FROM VENUE WHERE venue_id=%s", (venue_id,))
        if not cur.fetchone():
            raise HTTPException(404, "Venue not found")
        cur.execute("DELETE FROM VENUE WHERE venue_id=%s", (venue_id,))
    return {"message": "Venue deleted"}

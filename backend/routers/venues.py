from fastapi import APIRouter, Depends, HTTPException
from db import get_cursor
from models import VenueCreate
from auth import get_current_user, require_role

router = APIRouter(prefix="/venues", tags=["venues"])


@router.get("")
def list_venues(_: dict = Depends(get_current_user)):
    with get_cursor() as cur:
        cur.execute(
            "SELECT venue_id, name, building_name, type, capacity FROM venues ORDER BY name"
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]


@router.post("", status_code=201)
def create_venue(body: VenueCreate, _: dict = Depends(require_role("admin"))):
    with get_cursor() as cur:
        cur.execute(
            "INSERT INTO venues (name, building_name, type, capacity) VALUES (%s,%s,%s,%s)",
            (body.name, body.building_name, body.type, body.capacity),
        )
        vid = cur.lastrowid
    return {"venue_id": vid, "message": "Venue created"}


@router.delete("/{venue_id}")
def delete_venue(venue_id: int, _: dict = Depends(require_role("admin"))):
    with get_cursor() as cur:
        cur.execute("SELECT venue_id FROM venues WHERE venue_id=%s", (venue_id,))
        if not cur.fetchone():
            raise HTTPException(404, "Venue not found")
        cur.execute("DELETE FROM venues WHERE venue_id=%s", (venue_id,))
    return {"message": "Venue deleted"}

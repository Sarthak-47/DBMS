from fastapi import APIRouter, Depends
from db import get_cursor
from auth import get_current_user

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/my")
def my_teams(user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            """SELECT t.team_id, t.team_name, t.event_id,
                      e.title AS event_title, e.category, e.start_datetime,
                      t.created_at, r.status
               FROM teams t
               JOIN events e ON t.event_id = e.event_id
               JOIN registrations r ON r.team_id = t.team_id AND r.user_id = %s
               WHERE r.status != 'cancelled'
               ORDER BY t.created_at DESC""",
            (uid,),
        )
        cols = [d[0] for d in cur.description]
        teams = [dict(zip(cols, row)) for row in cur.fetchall()]

        # For each team, fetch members
        for team in teams:
            cur.execute(
                """SELECT u.user_id, u.full_name, u.reg_no
                   FROM team_members tm
                   JOIN users u ON tm.user_id = u.user_id
                   WHERE tm.team_id = %s""",
                (team["team_id"],),
            )
            mcols = [d[0] for d in cur.description]
            team["members"] = [dict(zip(mcols, r)) for r in cur.fetchall()]

            # Also include the registrant themselves if no explicit members
            if not team["members"]:
                cur.execute(
                    """SELECT u.user_id, u.full_name, u.reg_no
                       FROM registrations r JOIN users u ON r.user_id = u.user_id
                       WHERE r.team_id = %s""",
                    (team["team_id"],),
                )
                mcols = [d[0] for d in cur.description]
                team["members"] = [dict(zip(mcols, r)) for r in cur.fetchall()]

    return teams

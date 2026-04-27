from fastapi import APIRouter, Depends
from db import get_cursor
from auth import get_current_user

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/my")
def my_teams(user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute("SELECT student_id FROM STUDENT WHERE user_id = %s", (uid,))
        srow = cur.fetchone()
        if not srow:
            return []
        student_id = srow[0]

        cur.execute(
            """SELECT t.team_id, t.team_name, t.event_id,
                      e.title AS event_title, e.category, e.start_datetime,
                      t.created_at, r.registration_status AS status
               FROM TEAM t
               JOIN EVENT e ON t.event_id = e.event_id
               JOIN REGISTRATION r ON r.team_id = t.team_id AND r.student_id = %s
               WHERE r.registration_status != 'Cancelled'
               ORDER BY t.created_at DESC""",
            (student_id,),
        )
        cols = [d[0] for d in cur.description]
        teams = [dict(zip(cols, row)) for row in cur.fetchall()]

        for team in teams:
            # Members via REGISTRATION (all students in this team)
            cur.execute(
                """SELECT s.student_id AS user_id, s.full_name,
                          ss.reg_no
                   FROM REGISTRATION r
                   JOIN STUDENT s ON r.student_id = s.student_id
                   LEFT JOIN SRM_STUDENT ss ON s.student_id = ss.student_id
                   WHERE r.team_id = %s AND r.registration_status != 'Cancelled'""",
                (team["team_id"],),
            )
            mcols = [d[0] for d in cur.description]
            team["members"] = [dict(zip(mcols, r)) for r in cur.fetchall()]

    return teams

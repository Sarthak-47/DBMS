from fastapi import APIRouter, HTTPException, Depends
from db import get_cursor, get_conn
from models import RegisterRequest, LoginRequest
from auth import (
    hash_password, verify_password, create_token,
    get_current_user, ORG_PASSCODE,
)

router = APIRouter(prefix="/auth", tags=["auth"])

VALID_ROLES = {"student", "other_student", "organizer", "faculty"}


def _year_int(year_str: str) -> int:
    """Convert '1st Year'/'2nd Year'/... or '1'/'2'/... -> int."""
    if not year_str:
        return 1
    import re
    m = re.search(r'\d+', str(year_str))
    return int(m.group()) if m else 1


def _member_role(org_role: str) -> str:
    mapping = {
        'Club Head': 'ClubHead', 'clubhead': 'ClubHead',
        'Department Head': 'DeptHead', 'depthead': 'DeptHead',
        'Coordinator': 'Coordinator', 'Member': 'Member',
    }
    return mapping.get(org_role, 'Member')


def _get_role_for_user(cur, user_id: int) -> tuple:
    """Return (role, full_name) by checking subtype tables."""
    cur.execute("SELECT 1 FROM ADMIN WHERE user_id = %s", (user_id,))
    if cur.fetchone():
        cur.execute("SELECT full_name FROM FACULTY WHERE user_id = %s", (user_id,))
        f = cur.fetchone()
        return 'admin', (f[0] if f else 'Admin')

    cur.execute("SELECT full_name FROM FACULTY WHERE user_id = %s", (user_id,))
    f = cur.fetchone()
    if f:
        cur.execute("SELECT 1 FROM ORGANIZER_MEMBERS WHERE user_id = %s", (user_id,))
        return ('organizer' if cur.fetchone() else 'faculty'), f[0]

    cur.execute("SELECT student_id, full_name FROM STUDENT WHERE user_id = %s", (user_id,))
    s = cur.fetchone()
    if s:
        student_id, full_name = s
        cur.execute("SELECT 1 FROM SRM_STUDENT WHERE student_id = %s", (student_id,))
        if cur.fetchone():
            return 'student', full_name
        return 'other_student', full_name

    return 'unknown', 'User'


@router.post("/register", status_code=201)
def register(body: RegisterRequest):
    if body.role == "admin":
        raise HTTPException(403, "Admin accounts cannot be created via registration")
    if body.role not in VALID_ROLES:
        raise HTTPException(400, f"Invalid role '{body.role}'")
    if body.role in ("organizer", "faculty"):
        if body.org_passcode != ORG_PASSCODE:
            raise HTTPException(400, "Invalid organizer passcode")

    hashed = hash_password(body.password)

    with get_conn() as conn:
        cur = conn.cursor()
        try:
            cur.execute("SELECT user_id FROM USER WHERE email = %s", (body.email,))
            if cur.fetchone():
                raise HTTPException(400, "Email already registered")

            cur.execute(
                "INSERT INTO USER (email, password_hash) VALUES (%s, %s)",
                (body.email, hashed),
            )
            user_id = cur.lastrowid

            if body.phone:
                cur.execute(
                    "INSERT INTO USER_PHONE (user_id, phone) VALUES (%s, %s)",
                    (user_id, body.phone),
                )

            if body.role == "student":
                if not body.reg_no:
                    raise HTTPException(400, "reg_no is required for SRM students")
                cur.execute("SELECT 1 FROM SRM_STUDENT WHERE reg_no = %s", (body.reg_no,))
                if cur.fetchone():
                    raise HTTPException(400, "Registration number already in use")
                cur.execute(
                    "INSERT INTO STUDENT (user_id, full_name) VALUES (%s, %s)",
                    (user_id, body.full_name),
                )
                student_id = cur.lastrowid
                cur.execute(
                    "INSERT INTO SRM_STUDENT (student_id, reg_no, year, course, department, specialization) VALUES (%s,%s,%s,%s,%s,%s)",
                    (student_id, body.reg_no.upper(), _year_int(body.year or '1'),
                     body.course or '', body.department or '', body.specialization),
                )

            elif body.role == "other_student":
                cur.execute(
                    "INSERT INTO STUDENT (user_id, full_name) VALUES (%s, %s)",
                    (user_id, body.full_name),
                )
                student_id = cur.lastrowid
                col_name = body.college_name or 'Unknown College'
                cur.execute("SELECT college_id FROM COLLEGE WHERE college_name = %s", (col_name,))
                crow = cur.fetchone()
                if crow:
                    college_id = crow[0]
                else:
                    cur.execute(
                        "INSERT INTO COLLEGE (college_name, city) VALUES (%s, %s)",
                        (col_name, body.city),
                    )
                    college_id = cur.lastrowid
                cur.execute(
                    "INSERT INTO NON_SRM_STUDENT (student_id, college_id, course, year) VALUES (%s,%s,%s,%s)",
                    (student_id, college_id, body.course or '', _year_int(body.year or '1')),
                )

            elif body.role in ("organizer", "faculty"):
                designation = body.designation or body.org_role or 'Member'
                department  = body.department or body.org_name or 'N/A'
                cur.execute(
                    "INSERT INTO FACULTY (user_id, full_name, department, designation) VALUES (%s,%s,%s,%s)",
                    (user_id, body.full_name, department, designation),
                )
                if body.role == "organizer" and body.org_name:
                    org_type = body.org_type if body.org_type in ('Club','Department') else 'Club'
                    cur.execute(
                        "SELECT organizer_id FROM CLUB_OR_DEPARTMENT WHERE organizer_name = %s",
                        (body.org_name,),
                    )
                    crow = cur.fetchone()
                    if crow:
                        org_id = crow[0]
                    else:
                        cur.execute(
                            "INSERT INTO CLUB_OR_DEPARTMENT (organizer_type, organizer_name) VALUES (%s,%s)",
                            (org_type, body.org_name),
                        )
                        org_id = cur.lastrowid
                    cur.execute(
                        "INSERT IGNORE INTO ORGANIZER_MEMBERS (organizer_id, user_id, member_role) VALUES (%s,%s,%s)",
                        (org_id, user_id, _member_role(body.org_role or 'Member')),
                    )

            conn.commit()
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

    return {"message": "Account created", "user_id": user_id}


@router.post("/login")
def login(body: LoginRequest):
    with get_cursor() as cur:
        cur.execute("SELECT user_id, password_hash FROM USER WHERE email = %s", (body.email,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(401, "Invalid credentials")
        user_id, pw_hash = row
        if not verify_password(body.password, pw_hash):
            raise HTTPException(401, "Invalid credentials")
        role, full_name = _get_role_for_user(cur, user_id)

    token = create_token(user_id, role, full_name, body.email)
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "user_id":   user_id,
            "full_name": full_name,
            "role":      role,
            "email":     body.email,
        },
    }


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute("SELECT user_id, email, created_at FROM USER WHERE user_id = %s", (uid,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "User not found")
        result = {
            "user_id": row[0], "email": row[1], "created_at": str(row[2]),
            "role": user["role"], "full_name": user["full_name"],
        }
        cur.execute("SELECT phone FROM USER_PHONE WHERE user_id = %s LIMIT 1", (uid,))
        ph = cur.fetchone()
        result["phone"] = ph[0] if ph else None

        role = user["role"]
        if role == "student":
            cur.execute(
                """SELECT ss.reg_no, ss.year, ss.course, ss.department, ss.specialization
                   FROM STUDENT s JOIN SRM_STUDENT ss ON s.student_id = ss.student_id
                   WHERE s.user_id = %s""", (uid,)
            )
            r = cur.fetchone()
            if r:
                result.update(dict(zip(["reg_no","year","course","department","specialization"], r)))
        elif role == "other_student":
            cur.execute(
                """SELECT c.college_name, c.city, ns.course, ns.year
                   FROM STUDENT s
                   JOIN NON_SRM_STUDENT ns ON s.student_id = ns.student_id
                   JOIN COLLEGE c ON ns.college_id = c.college_id
                   WHERE s.user_id = %s""", (uid,)
            )
            r = cur.fetchone()
            if r:
                result.update(dict(zip(["college_name","city","course","year"], r)))
        elif role in ("organizer","faculty"):
            cur.execute("SELECT department, designation FROM FACULTY WHERE user_id = %s", (uid,))
            r = cur.fetchone()
            if r:
                result.update({"department": r[0], "designation": r[1]})
            cur.execute(
                """SELECT cod.organizer_name, cod.organizer_type, om.member_role
                   FROM ORGANIZER_MEMBERS om
                   JOIN CLUB_OR_DEPARTMENT cod ON om.organizer_id = cod.organizer_id
                   WHERE om.user_id = %s LIMIT 1""", (uid,)
            )
            r = cur.fetchone()
            if r:
                result.update({"org_name": r[0], "org_type": r[1], "org_role": r[2]})
    return result

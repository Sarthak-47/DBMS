from fastapi import APIRouter, Depends, HTTPException
from db import get_cursor, get_conn
from models import RegisterRequest, LoginRequest, TokenResponse
from auth_utils import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

VALID_ROLES = {'student', 'non_srm_student', 'organiser', 'faculty', 'admin'}


@router.post("/register", status_code=201)
def register(body: RegisterRequest):
    if body.role not in VALID_ROLES:
        raise HTTPException(400, f"Invalid role '{body.role}'")

    full_name = f"{body.first_name} {body.last_name}".strip()
    hashed    = hash_password(body.password)

    # Non-SRM students: store college as department, role stored as 'non_srm_student'
    dept = body.college_name if body.role == 'non_srm_student' else body.department

    with get_conn() as conn:
        cur = conn.cursor()
        try:
            cur.execute("SELECT user_id FROM users WHERE email = %s", (body.email,))
            if cur.fetchone():
                raise HTTPException(400, "Email already registered")

            if body.reg_no:
                cur.execute("SELECT user_id FROM users WHERE reg_no = %s", (body.reg_no,))
                if cur.fetchone():
                    raise HTTPException(400, "Registration number already in use")

            cur.execute(
                """INSERT INTO users (name, email, password_hash, role, department, reg_no, year, phone, course, designation)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING user_id""",
                (full_name, body.email, hashed, body.role, dept, body.reg_no, body.year,
                 getattr(body, 'phone', None), getattr(body, 'course', None), getattr(body, 'designation', None)),
            )
            user_id = cur.fetchone()[0]

            # Store extra non-SRM details in notifications as a metadata record (lightweight)
            # In production this would be a non_srm_students table
            if body.role == 'non_srm_student' and body.college_name:
                extra = (
                    f"College: {body.college_name}"
                    + (f" | Course: {body.course}" if body.course else "")
                    + (f" | City: {body.city}" if body.city else "")
                    + (f" | State: {body.state}" if body.state else "")
                )
                cur.execute(
                    "INSERT INTO notifications(user_id, message, is_read) VALUES(%s, %s, TRUE)",
                    (user_id, f"Welcome to Evenzo! Your profile: {extra}"),
                )
        finally:
            cur.close()

    return {"message": "Account created", "user_id": user_id}


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    with get_cursor() as cur:
        cur.execute(
            "SELECT user_id, name, password_hash, role FROM users WHERE email = %s",
            (body.email,),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(401, "Invalid credentials")

    user_id, name, pw_hash, role = row

    if not verify_password(body.password, pw_hash):
        raise HTTPException(401, "Invalid credentials")

    # Allow non_srm_student to log in with either 'student' or 'non_srm_student' role selected
    if body.role and body.role != role:
        if not (role == 'non_srm_student' and body.role == 'student'):
            raise HTTPException(403, f"Account role is '{role}', not '{body.role}'")

    token = create_token(user_id, role, name)
    return TokenResponse(access_token=token, role=role, user_id=user_id, name=name)


@router.get("/me")
def me(user=Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            """SELECT user_id, name, email, role, reg_no, department, designation,
                      year, phone, course, created_at
               FROM users WHERE user_id = %s""",
            (uid,),
        )
        cols = [d[0] for d in cur.description]
        row  = cur.fetchone()
    if not row:
        raise HTTPException(404, "User not found")
    return dict(zip(cols, row))

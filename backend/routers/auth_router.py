from fastapi import APIRouter, HTTPException, Depends
from db import get_cursor
from models import RegisterRequest, LoginRequest
from auth import (
    hash_password, verify_password, create_token,
    get_current_user, ORG_PASSCODE, ADMIN_PASSCODE,
)

router = APIRouter(prefix="/auth", tags=["auth"])

VALID_ROLES = {"student", "other_student", "organizer", "faculty"}


@router.post("/register", status_code=201)
def register(body: RegisterRequest):
    # Admin accounts cannot self-register; they must be created directly in the database.
    if body.role == "admin":
        raise HTTPException(403, "Admin accounts cannot be created via registration")

    if body.role not in VALID_ROLES:
        raise HTTPException(400, f"Invalid role '{body.role}'")

    # Passcode validation
    if body.role in ("organizer", "faculty"):
        if body.org_passcode != ORG_PASSCODE:
            raise HTTPException(400, "Invalid organizer passcode")

    hashed = hash_password(body.password)

    with get_cursor() as cur:
        cur.execute("SELECT user_id FROM users WHERE email = %s", (body.email,))
        if cur.fetchone():
            raise HTTPException(400, "Email already registered")

        if body.reg_no:
            cur.execute("SELECT user_id FROM users WHERE reg_no = %s", (body.reg_no,))
            if cur.fetchone():
                raise HTTPException(400, "Registration number already in use")

        cur.execute(
            """INSERT INTO users
               (full_name, email, password_hash, phone, role,
                reg_no, department, year, course,
                college_name, city,
                org_type, org_role, org_name, designation)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (body.full_name, body.email, hashed, body.phone, body.role,
             body.reg_no, body.department, body.year, body.course,
             body.college_name, body.city,
             body.org_type, body.org_role, body.org_name, body.designation),
        )
        user_id = cur.lastrowid

    return {"message": "Account created", "user_id": user_id}


@router.post("/login")
def login(body: LoginRequest):
    with get_cursor() as cur:
        cur.execute(
            "SELECT user_id, full_name, password_hash, role, email FROM users WHERE email = %s",
            (body.email,),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(401, "Invalid credentials")

    user_id, full_name, pw_hash, role, email = row

    if not verify_password(body.password, pw_hash):
        raise HTTPException(401, "Invalid credentials")

    token = create_token(user_id, role, full_name, email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"user_id": user_id, "full_name": full_name, "role": role, "email": email},
    }


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            """SELECT user_id, full_name, email, phone, role,
                      reg_no, department, year, course,
                      college_name, city, org_type, org_role, org_name, designation,
                      created_at
               FROM users WHERE user_id = %s""",
            (uid,),
        )
        cols = [d[0] for d in cur.description]
        row  = cur.fetchone()
    if not row:
        raise HTTPException(404, "User not found")
    return dict(zip(cols, row))

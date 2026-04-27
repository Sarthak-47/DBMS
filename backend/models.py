from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    full_name:    str
    email:        EmailStr
    password:     str
    phone:        Optional[str] = None
    role:         str = "student"
    # SRM student
    reg_no:       Optional[str] = None
    department:   Optional[str] = None
    year:         Optional[str] = None
    course:       Optional[str] = None
    # Other-college student
    college_name: Optional[str] = None
    city:         Optional[str] = None
    # Organizer / Faculty
    org_type:     Optional[str] = None
    org_role:     Optional[str] = None
    org_name:     Optional[str] = None
    designation:  Optional[str] = None
    # Passcodes (validated on backend)
    org_passcode:   Optional[str] = None
    admin_passcode: Optional[str] = None


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


# ── Events ────────────────────────────────────────────────────
class EventCreate(BaseModel):
    title:                 str
    category:              str
    description:           Optional[str] = None
    eligibility:           Optional[str] = None
    venue_id:              Optional[int] = None
    start_datetime:        Optional[datetime] = None
    end_datetime:          Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    fee:                   float = 0.0
    min_team_size:         int = 1
    max_team_size:         int = 1
    max_participants:      Optional[int] = None
    upi_id:                Optional[str] = None
    payee_name:            Optional[str] = None


# ── Registrations ─────────────────────────────────────────────
class RegistrationCreate(BaseModel):
    event_id:    int
    team_name:   Optional[str] = None
    payment_ref: Optional[str] = None


# ── Venues ────────────────────────────────────────────────────
class VenueCreate(BaseModel):
    name:          str
    building_name: Optional[str] = None
    type:          str
    capacity:      Optional[int] = None


# ── Certificates ──────────────────────────────────────────────
class CertGenRequest(BaseModel):
    cert_type: str = "participation"

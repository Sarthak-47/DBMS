from pydantic import BaseModel, EmailStr
from typing import Optional
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
    year:         Optional[str] = None   # "1st Year" … "4th Year" or plain int string
    course:       Optional[str] = None
    specialization: Optional[str] = None
    # Other-college student
    college_name: Optional[str] = None
    city:         Optional[str] = None
    # Organizer / Faculty
    org_type:     Optional[str] = None    # 'Club' | 'Department'
    org_role:     Optional[str] = None    # 'ClubHead'|'DeptHead'|'Coordinator'|'Member'
    org_name:     Optional[str] = None
    designation:  Optional[str] = None
    # Passcode
    org_passcode: Optional[str] = None


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
    # Accept either frontend name (registration_deadline) or DB name (reg_last_date)
    registration_deadline: Optional[datetime] = None
    reg_last_date:         Optional[datetime] = None
    # Accept either frontend name (fee) or DB name (reg_fee)
    fee:                   float = 0.0
    reg_fee:               Optional[float] = None
    min_team_size:         int = 1
    max_team_size:         int = 1
    max_participants:      Optional[int] = None
    upi_id:                Optional[str] = None
    payee_name:            Optional[str] = None
    registration_link:     Optional[str] = None

    def resolved_deadline(self):
        return self.reg_last_date or self.registration_deadline

    def resolved_fee(self):
        if self.reg_fee is not None:
            return self.reg_fee
        return self.fee


# ── Registrations ─────────────────────────────────────────────
class RegistrationCreate(BaseModel):
    event_id:    int
    team_name:   Optional[str] = None
    payment_ref: Optional[str] = None


# ── Venues ────────────────────────────────────────────────────
class VenueCreate(BaseModel):
    venue_name:    str
    name:          Optional[str] = None  # frontend sends 'name', backend aliases
    building_name: Optional[str] = None
    floor:         Optional[str] = None
    room_no:       Optional[str] = None
    type:          str
    capacity:      int

    def resolved_venue_name(self):
        return self.venue_name or self.name or ""


# ── Certificates ──────────────────────────────────────────────
class CertGenRequest(BaseModel):
    cert_type: str = "participation"

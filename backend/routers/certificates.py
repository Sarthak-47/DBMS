import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from db import get_cursor
from auth import get_current_user

router = APIRouter(prefix="/certificates", tags=["certificates"])

CERTS_DIR = os.path.join(os.path.dirname(__file__), "..", "certs")


def _generate_pdf(path: str, full_name: str, reg_no: str,
                  event_title: str, event_date: str, organizer_name: str) -> None:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import cm
    from reportlab.pdfgen import canvas

    W, H = A4
    c = canvas.Canvas(path, pagesize=A4)

    # Gold border frame
    gold = colors.HexColor("#C8A96E")
    c.setStrokeColor(gold)
    c.setLineWidth(6)
    c.rect(1.5*cm, 1.5*cm, W - 3*cm, H - 3*cm)
    c.setLineWidth(2)
    c.rect(1.9*cm, 1.9*cm, W - 3.8*cm, H - 3.8*cm)

    # Title
    c.setFillColor(gold)
    c.setFont("Times-Bold", 36)
    c.drawCentredString(W/2, H - 5*cm, "Certificate of Participation")

    # Divider
    c.setStrokeColor(gold)
    c.setLineWidth(1)
    c.line(3*cm, H - 5.8*cm, W - 3*cm, H - 5.8*cm)

    # Body
    c.setFillColor(colors.HexColor("#FAFAF7"))
    c.setFont("Times-Roman", 16)
    c.drawCentredString(W/2, H - 7.5*cm, "This is to certify that")

    c.setFont("Times-Bold", 28)
    c.setFillColor(gold)
    c.drawCentredString(W/2, H - 9.5*cm, full_name)

    if reg_no:
        c.setFont("Times-Roman", 13)
        c.setFillColor(colors.HexColor("#AAAAAA"))
        c.drawCentredString(W/2, H - 10.5*cm, f"({reg_no})")

    c.setFont("Times-Roman", 16)
    c.setFillColor(colors.HexColor("#FAFAF7"))
    c.drawCentredString(W/2, H - 12*cm, "has successfully participated in")

    c.setFont("Times-Bold", 22)
    c.setFillColor(gold)
    c.drawCentredString(W/2, H - 13.5*cm, event_title)

    c.setFont("Times-Roman", 14)
    c.setFillColor(colors.HexColor("#FAFAF7"))
    c.drawCentredString(W/2, H - 14.8*cm, f"held on {event_date}")

    # Organizer line
    c.setFont("Times-Italic", 13)
    c.setFillColor(colors.HexColor("#AAAAAA"))
    c.drawCentredString(W/2, H - 16*cm, f"Organized by: {organizer_name}")

    # Footer
    c.setFillColor(gold)
    c.setLineWidth(1)
    c.line(3*cm, 3.5*cm, W - 3*cm, 3.5*cm)
    c.setFont("Times-Bold", 12)
    c.drawCentredString(W/2, 2.8*cm, "Evenzo · SRM Institute of Science and Technology")

    c.save()


@router.get("/my")
def my_certs(user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        # cert_id stored against student_id; join through STUDENT to filter by user_id
        cur.execute(
            """SELECT c.cert_id, c.cert_type, c.issued_at,
                      e.title AS event_title, e.start_datetime
               FROM CERTIFICATES c
               JOIN EVENT e      ON c.event_id = e.event_id
               JOIN STUDENT s    ON c.student_id = s.student_id
               WHERE s.user_id = %s
               ORDER BY c.issued_at DESC""",
            (uid,),
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]


@router.post("/generate/{event_id}", status_code=201)
def generate_cert(event_id: int, user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        # Get student_id for this user
        cur.execute("SELECT student_id FROM STUDENT WHERE user_id = %s", (uid,))
        srow = cur.fetchone()
        if not srow:
            raise HTTPException(400, "No student profile for this user")
        student_id = srow[0]

        # Check confirmed registration
        cur.execute(
            """SELECT registration_id FROM REGISTRATION
               WHERE student_id = %s AND event_id = %s
                 AND registration_status = 'Registered'""",
            (student_id, event_id),
        )
        if not cur.fetchone():
            raise HTTPException(400, "No confirmed registration for this event")

        # Check duplicate
        cur.execute(
            "SELECT cert_id FROM CERTIFICATES WHERE student_id = %s AND event_id = %s",
            (student_id, event_id),
        )
        if cur.fetchone():
            raise HTTPException(400, "Certificate already issued")

        # Fetch event + student details
        cur.execute(
            """SELECT e.title, e.start_datetime,
                      s.full_name,
                      srm.reg_no,
                      cd.organizer_name
               FROM EVENT e
               JOIN STUDENT s           ON s.student_id = %s
               LEFT JOIN SRM_STUDENT srm ON s.student_id = srm.student_id
               LEFT JOIN CLUB_OR_DEPARTMENT cd ON e.organizer_id = cd.organizer_id
               WHERE e.event_id = %s""",
            (student_id, event_id),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(404, "Event not found")
        event_title, start_dt, full_name, reg_no, org_name = row

        # Generate PDF
        os.makedirs(CERTS_DIR, exist_ok=True)
        filename  = f"cert_{uid}_{event_id}.pdf"
        pdf_path  = os.path.join(CERTS_DIR, filename)
        event_date = start_dt.strftime("%B %d, %Y") if start_dt else "TBD"
        _generate_pdf(pdf_path, full_name, reg_no or "", event_title,
                      event_date, org_name or "Evenzo")

        cur.execute(
            """INSERT INTO CERTIFICATES (student_id, event_id, cert_type, pdf_path)
               VALUES (%s, %s, %s, %s)""",
            (student_id, event_id, "participation", f"/certs/{filename}"),
        )
        cert_id = cur.lastrowid

    return {"cert_id": cert_id, "pdf_path": f"/certs/{filename}"}


@router.get("/download/{cert_id}")
def download_cert(cert_id: int, user: dict = Depends(get_current_user)):
    uid = int(user["sub"])
    with get_cursor() as cur:
        cur.execute(
            """SELECT c.pdf_path, s.user_id
               FROM CERTIFICATES c
               JOIN STUDENT s ON c.student_id = s.student_id
               WHERE c.cert_id = %s""",
            (cert_id,),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(404, "Certificate not found")
    if row[1] != uid and user.get("role") != "admin":
        raise HTTPException(403, "Not your certificate")

    pdf_path = row[0].lstrip("/")
    full_path = os.path.join(os.path.dirname(__file__), "..", pdf_path)
    if not os.path.exists(full_path):
        raise HTTPException(404, "PDF file not found")
    return FileResponse(full_path, media_type="application/pdf",
                        filename=os.path.basename(full_path))

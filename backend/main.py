import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from db import init_pool
from routers import auth_router, events, registrations, teams, venues, dashboard, certificates, notifications, admin

app = FastAPI(
    title="Evenzo API",
    description="College Event Management System — SRM Institute of Science and Technology",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated certificates as static files
certs_dir = os.path.join(os.path.dirname(__file__), "certs")
os.makedirs(certs_dir, exist_ok=True)
app.mount("/certs", StaticFiles(directory=certs_dir), name="certs")

# Serve UPI QR images uploaded by organizers
qr_dir = os.path.join(os.path.dirname(__file__), "qr_images")
os.makedirs(qr_dir, exist_ok=True)
app.mount("/qr", StaticFiles(directory=qr_dir), name="qr")

app.include_router(auth_router.router)
app.include_router(events.router)
app.include_router(registrations.router)
app.include_router(teams.router)
app.include_router(venues.router)
app.include_router(dashboard.router)
app.include_router(certificates.router)
app.include_router(notifications.router)
app.include_router(admin.router)


@app.on_event("startup")
def startup():
    init_pool()


@app.get("/")
def root():
    return {"app": "Evenzo", "version": "2.0.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}

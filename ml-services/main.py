from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from intake import router as intake_router
from notetaker import router as notetaker_router

app = FastAPI(title="EasyLaw ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intake_router)
app.include_router(notetaker_router)

@app.get("/")
def root():
    return {"message": "EasyLaw ML service is running"}
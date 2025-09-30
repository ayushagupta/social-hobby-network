from fastapi import FastAPI
from app.routers import auth, groups

app = FastAPI()

app.include_router(auth.router)
app.include_router(groups.router)
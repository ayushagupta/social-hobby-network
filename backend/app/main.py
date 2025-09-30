from fastapi import FastAPI
from app.routers import auth, groups, memberships

app = FastAPI()

app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(memberships.router)
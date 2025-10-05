from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, groups, memberships, posts, chat, notifications, search

app = FastAPI()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # which origins can make requests
    allow_credentials=True,      # allow cookies, Authorization headers
    allow_methods=["*"],         # allow all HTTP methods
    allow_headers=["*"],         # allow all headers
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(groups.router)
app.include_router(memberships.router)
app.include_router(posts.router)
app.include_router(chat.router)
app.include_router(notifications.router)
app.include_router(search.router)
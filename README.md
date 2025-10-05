# HobbyNet - Social Hobby Network

HobbyNet is a complete, full-stack social networking application which allows users to connect with others based on shared hobbies by creating and joining groups, posting content, and engaging in real-time conversations. The application features a scalable, modern architecture with a powerful search engine and a real-time notification system.

## Key features

- **User Authentication**: Secure user registration and login using JWT token-based authentication.
- **Group Management**: Users can create public hobby-based groups or join existing ones.
- **Content Posting**: Group members can create and view posts within their communities.
- **Real-Time Chat & Notifications**: A scalable, real-time messaging system for both group chats and one-on-one direct messages, powered by WebSockets and a Redis Pub/Sub message broker. A persistent notification system alerts users to new messages and conversations.
- **Unified Search**: A powerful, typo-tolerant (fuzzy) search engine, powered by Elasticsearch, that allows users to find users, groups, and posts from a single search bar.

## Tech Stack
- **Frontend**: React (JavaScript), Redux Toolkit, TailwindCSS, Axios
- **Backend**: FastAPI, Alembic
- **Database**: PostgreSQL
- **Infrastructure**: Redis Pub/Sub, Elasticsearch, Docker

## Setup and Installation

To run this project locally, you will need `git`, `Python 3.10+`, `pip`, `Node.js`, `npm`, and `Docker` installed on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/ayushagupta/social-hobby-network.git
cd social-hobby-network
```

### 2. Database setup (PostgreSQL)
Ensure you have a PostgreSQL server running. Create a new database for the project.

### 3. Redis and Elasticsearch Setup (Docker)
The easiest way to run the required services is with Docker. Run these commands in separate terminal windows.
**Start Redis**:
```bash
docker run -p 6379:6379 redis
```

**Start Elasticsearch**:
```bash
docker run -p 9200:9200 -e "xpack.security.enabled=false" -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:8.11.1
```

Verify Elasticsearch is running by navigating to `http://localhost:9200` in your browser.

### 4. Backend setup
1. **Navigate to the backend directory:**
```bash
cd backend
```

2. **Create and activate a virtual environment:**
```bash
python -m venv venv
source venv/bin/activate
```

3. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure Environment Variables:**
Create a `.env` file in the `backend` directory and add your configuration details. You can copy the example below:
```
# .env
DATABASE_URL="postgresql://<user>:<password>@localhost/hobbynet"
SECRET_KEY="<your-super-secret-jwt-key>"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. **Run Database Migrations:**
Apply all database schema changes.
```
alembic upgrade head
```

### 5. Frontend setup
1. **Navigate to the frontend directory:**
```bash
cd frontend
```

2. **Install Node.js dependencies:**
```bash
npm install
```

## Usage & Commands
To run the full application, you will need three terminal windows open simultaneously.

**Terminal 1: Backend Server**
```bash
# Navigate to the /backend directory and activate your virtual environment
cd backend
source venv/bin/activate

# Run the Uvicorn server
uvicorn app.main:app --reload
```
- Your backend API will be available at `http://localhost:8000`

**Terminal 2: Frontend Server**
```bash
# Navigate to the /frontend directory
cd frontend

# Run the React development server
npm run dev
```
- Your frontend application will be available at `http://localhost:5173`

**Terminal 3: Services (if not running as a background service)**
- Ensure your Docker containers for Redis and Elasticsearch are running. 

You can now access the HobbyNet application in your browser at `http://localhost:5173`.

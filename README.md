# AI-Powered Crisis Coordination System for Hospitality

A real-time emergency coordination platform for hotels, featuring AI classification, live dashboards, and geospatial tracking.

## 🚀 Getting Started

### Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables in `.env`:
   - `OPENAI_API_KEY`: Your OpenAI API key for incident classification.

4. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Frontend Setup (React + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## 🔷 Features

- **One-Tap SOS**: Immediate reporting for guests with geo-location.
- **Voice SOS**: Trigger incidents using voice commands (processed via Web Speech API & OpenAI).
- **Live Dashboard**: Real-time incident feed using WebSockets.
- **Interactive Map**: Visualize incident locations and staff placement.
- **AI Engine**: Google Gemini 1.5 Flash (SOP-grounded).

## 🚀 Deployment

### Backend (Render)
1. Create a new **Web Service** on Render.
2. Connect this GitHub repository.
3. Set **Root Directory** to `backend`.
4. Set **Start Command** to `gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT`.
5. Add Environment Variables:
   - `GOOGLE_API_KEY`: Your Gemini API Key.
   - `DATABASE_URL`: `sqlite:///./crisis_system.db` (or a persistent Postgres URL).

### Frontend (Vercel)
1. Create a new project on Vercel.
2. Connect this GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Add Environment Variables:
   - `VITE_API_URL`: Your Render Web Service URL (e.g., `https://crisis-hub-api.onrender.com`).
   - `VITE_WS_URL`: Your Render WebSocket URL (e.g., `wss://crisis-hub-api.onrender.com/ws`).
5. Deploy!

##Contributors

Hari.M

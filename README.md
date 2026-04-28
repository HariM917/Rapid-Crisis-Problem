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
- **AI Classification**: Automated emergency categorization (Fire, Medical, Security).
- **Analytics**: Trend visualization using Chart.js.

## 🛠 Tech Stack

- **Frontend**: React, Tailwind CSS, Leaflet.js, Chart.js, Framer Motion.
- **Backend**: FastAPI, SQLAlchemy, SQLite, WebSockets.
- **AI**: OpenAI GPT-3.5 API.

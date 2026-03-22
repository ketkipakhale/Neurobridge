# NeuroBridge — Adaptive Learning Platform

## About
Full-stack adaptive learning web application with AI-powered features, built using Node.js, Express, and MongoDB.

## Features
- Multi-user login system with JWT authentication
- Adaptive quiz engine with voice answers (Web Speech API)
- Real-time skill map based on quiz performance
- Analytics dashboard with Chart.js
- Pomodoro study timer
- Smart notes with auto-save
- Progressive Web App (PWA) — works offline
- Dark / Light mode toggle
- Class leaderboard and XP system

## Tech Stack
- **Frontend:** HTML, CSS, Vanilla JavaScript, Chart.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JWT tokens, bcrypt password hashing
- **Extra:** PWA, Web Speech API, localStorage

## How to Run

### Frontend
Open `neurobridge_v2.html` directly in any browser — no setup needed!

### Backend
```bash
cd Neurobridge-backend
npm install
node server.js
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| POST | /api/scores | Submit quiz score |
| GET | /api/scores/summary | Get progress summary |
| GET | /api/leaderboard | Get class leaderboard |
| GET | /api/notes | Get all notes |

## Developer
**Ketaki Pakhale**
GitHub: [@ketkipakhale](https://github.com/ketkipakhale)

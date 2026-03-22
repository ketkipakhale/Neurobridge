# NeuroBridge — Complete Setup & Deployment Guide
## From Zero to Live in 30 Minutes

---

## 📁 Project Structure

```
neurobridge/
├── neurobridge.html      ← Main frontend (open directly in browser)
├── manifest.json         ← PWA manifest
├── sw.js                 ← Service Worker (offline support)
├── server.js             ← Node.js + Express backend
├── package.json          ← Backend dependencies
├── .env.example          ← Environment variable template
└── DEPLOY_GUIDE.md       ← This file
```

---

## PART 1 — Run Frontend (No Setup Needed)

1. Double-click `neurobridge.html`
2. It opens in your browser — done! ✅

For the PWA features (Install button, offline mode):
- Place all files in the same folder
- Open via a local server (see Part 3 below)

---

## PART 2 — Setup Backend (Node.js + MongoDB)

### Step 1 — Install Node.js
Download from: https://nodejs.org (choose LTS version)

Verify install:
```bash
node --version    # Should show v18+
npm --version     # Should show v9+
```

### Step 2 — Get a Free MongoDB Database
1. Go to https://cloud.mongodb.com
2. Create a free account → Click "Build a Database"
3. Choose **FREE (M0 Sandbox)** tier
4. Select a region close to India (Mumbai/Singapore)
5. Create username + password (save these!)
6. Go to **Network Access** → Add `0.0.0.0/0` (allow all IPs)
7. Go to **Database** → Click **Connect** → **Compass** → Copy the connection string
8. Replace `<password>` with your actual password

### Step 3 — Setup the Backend
```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env

# 3. Open .env and paste your MongoDB URI
# MONGODB_URI=mongodb+srv://yourname:yourpass@cluster0.xxxxx.mongodb.net/neurobridge

# 4. Start the server
npm start
```

You should see:
```
✅ MongoDB connected
🚀 NeuroBridge server running on http://localhost:5000
```

### Step 4 — Test the API
Open in browser: http://localhost:5000/api/health

You should see:
```json
{ "status": "ok", "app": "NeuroBridge API", "version": "1.0.0" }
```

### API Endpoints Available:
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/register | Register new student |
| POST | /api/auth/login | Login & get JWT token |
| GET | /api/auth/me | Get current user |
| POST | /api/scores | Submit quiz score |
| GET | /api/scores/summary | Get progress summary |
| GET | /api/leaderboard | Get class leaderboard |
| GET | /api/streak | Get study streak |
| GET | /api/notes | Get all notes |
| POST | /api/notes | Create note |
| PUT | /api/notes/:id | Update note |
| DELETE | /api/notes/:id | Delete note |

---

## PART 3 — GitHub Setup

### Step 1 — Create Repository
1. Go to https://github.com → Sign in
2. Click **+** → **New repository**
3. Name it: `neurobridge`
4. Make it **Public** (required for free Vercel deploy)
5. Click **Create repository**

### Step 2 — Push Your Code
```bash
# Open terminal in your project folder, then:
git init
git add .
git commit -m "Initial commit: NeuroBridge adaptive learning platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/neurobridge.git
git push -u origin main
```

### Step 3 — Good GitHub Practices
```bash
# Every time you make changes:
git add .
git commit -m "Add voice Q&A feature"
git push
```

**Create a .gitignore file** (to hide secrets):
```
node_modules/
.env
*.log
.DS_Store
```

---

## PART 4 — Deploy Frontend on Vercel (FREE)

### Step 1
1. Go to https://vercel.com → Sign up with GitHub
2. Click **Add New Project**
3. Import your `neurobridge` GitHub repo
4. Keep default settings → Click **Deploy**

### Step 2 — Your app is LIVE! 🎉
Vercel gives you a URL like: `https://neurobridge.vercel.app`

Share this link in your interviews and resume!

### Step 3 — Auto-deploy
Every time you push to GitHub → Vercel auto-deploys in ~30 seconds.

---

## PART 5 — Deploy Backend on Render (FREE)

### Step 1
1. Go to https://render.com → Sign up with GitHub
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Set these settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** `Node`

### Step 2 — Add Environment Variables
In Render dashboard → **Environment** tab:
```
MONGODB_URI = your_mongodb_connection_string
JWT_SECRET  = your_secret_key
PORT        = 5000
```

### Step 3 — Your API is LIVE!
Render gives URL like: `https://neurobridge-api.onrender.com`

Test it: `https://neurobridge-api.onrender.com/api/health`

---

## PART 6 — Connect Frontend to Backend

In your `neurobridge.html`, add this at the top of the `<script>` section:

```javascript
const API_BASE = 'https://neurobridge-api.onrender.com';
// For local testing use: 'http://localhost:5000'

async function apiLogin(email, password) {
  const res = await fetch(API_BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) localStorage.setItem('nb-token', data.token);
  return data;
}

async function apiSubmitScore(subject, score, correct, wrong) {
  const token = localStorage.getItem('nb-token');
  const res = await fetch(API_BASE + '/api/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ subject, score, correct, wrong, xpEarned: correct * 80 })
  });
  return res.json();
}
```

---

## PART 7 — Resume Description

Use this on your resume/CV:

> **NeuroBridge — Adaptive Learning Platform** *(Final Year Project)*
> Built a full-stack education web app with React-style JS frontend, Node.js/Express REST API, and MongoDB database. Features include: role-based authentication (JWT), AI-driven skill gap analysis, adaptive quiz engine, real-time analytics dashboard with Chart.js, Pomodoro study timer, smart notes with auto-save, voice-based quiz answers (Web Speech API), Progressive Web App (PWA) with offline support, and class leaderboard. Deployed frontend on Vercel and backend on Render.
> **Tech:** JavaScript, Node.js, Express.js, MongoDB, Chart.js, PWA, Web Speech API, JWT

---

## PART 8 — Interview Q&A Cheat Sheet

**Q: What tech stack did you use?**
A: Frontend is vanilla JavaScript with Chart.js for data visualization. Backend is Node.js with Express framework and MongoDB as the database. I used JWT for authentication and deployed the frontend on Vercel and backend on Render.

**Q: How does authentication work?**
A: When a user logs in, the server verifies credentials using bcrypt for password hashing, then issues a JWT token. The frontend stores this token and sends it in the Authorization header for all subsequent API calls.

**Q: What was the hardest challenge?**
A: Designing the adaptive quiz system. I had to think about how to track per-subject performance, identify knowledge gaps, and generate recommendations — essentially building a simple recommendation engine.

**Q: What is a PWA?**
A: Progressive Web App. I added a service worker and manifest.json so the app can be installed on a phone's home screen and works offline. It caches static assets and API responses so students can study even without internet.

**Q: How does the Voice Q&A work?**
A: I used the browser's built-in Web Speech API (SpeechRecognition). When the student clicks the mic button, it listens for spoken answers (A, B, C, or D) and automatically selects the option. No external API or cost involved.

---

*Built with ❤️ for the final year project — Good luck! 🎓*

// NeuroBridge Backend — Node.js + Express + MongoDB
// Run: npm install && npm start

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

// ─── CONNECT TO MONGODB ────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neurobridge')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ─── MODELS ───────────────────────────────────────────────────────

// User Model
const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true, minlength: 6 },
  role:       { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  rollNumber: { type: String },
  department: { type: String, default: 'Computer Science' },
  yearOfStudy:{ type: Number, default: 4 },
  avatar:     { type: String },
  createdAt:  { type: Date, default: Date.now }
});
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
const User = mongoose.model('User', userSchema);

// Progress / Quiz Score Model
const progressSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject:   { type: String, required: true },
  score:     { type: Number, required: true, min: 0, max: 100 },
  xpEarned:  { type: Number, default: 0 },
  correct:   { type: Number, default: 0 },
  wrong:     { type: Number, default: 0 },
  timeTaken: { type: Number },          // seconds
  quizType:  { type: String, default: 'knowledge-pulse' },
  completedAt: { type: Date, default: Date.now }
});
const Progress = mongoose.model('Progress', progressSchema);

// Streak Model
const streakSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak:{ type: Number, default: 0 },
  longestStreak:{ type: Number, default: 0 },
  lastStudyDate:{ type: Date },
  studyDates:   [{ type: Date }]
});
const Streak = mongoose.model('Streak', streakSchema);

// Note Model
const noteSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, default: 'Untitled' },
  body:    { type: String, default: '' },
  tags:    [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', noteSchema);

// ─── AUTH MIDDLEWARE ───────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'neurobridge_secret_2024');
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ─── AUTH ROUTES ───────────────────────────────────────────────────

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, rollNumber } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role, rollNumber });
    await Streak.create({ userId: user._id });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'neurobridge_secret_2024', { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'neurobridge_secret_2024', { expiresIn: '7d' });

    // Update streak
    await updateStreak(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, rollNumber: user.rollNumber }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get current user
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PROGRESS ROUTES ───────────────────────────────────────────────

// Submit quiz score
app.post('/api/scores', auth, async (req, res) => {
  try {
    const { subject, score, correct, wrong, timeTaken, quizType } = req.body;
    const xpEarned = correct * 80;

    const progress = await Progress.create({
      userId: req.userId, subject, score, correct, wrong, timeTaken, quizType, xpEarned
    });

    res.status(201).json({ progress, xpEarned, message: `+${xpEarned} XP earned!` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get my progress summary
app.get('/api/scores/summary', auth, async (req, res) => {
  try {
    const scores = await Progress.find({ userId: req.userId }).sort({ completedAt: -1 });

    const subjectMap = {};
    scores.forEach(s => {
      if (!subjectMap[s.subject]) subjectMap[s.subject] = [];
      subjectMap[s.subject].push(s.score);
    });

    const summary = Object.entries(subjectMap).map(([subject, arr]) => ({
      subject,
      avgScore: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
      attempts: arr.length,
      best: Math.max(...arr)
    }));

    const totalXP = scores.reduce((sum, s) => sum + s.xpEarned, 0);
    res.json({ summary, totalXP, recentScores: scores.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', auth, async (req, res) => {
  try {
    const result = await Progress.aggregate([
      { $group: { _id: '$userId', totalXP: { $sum: '$xpEarned' }, attempts: { $sum: 1 } } },
      { $sort: { totalXP: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', totalXP: 1, attempts: 1 } }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── STREAK ROUTES ─────────────────────────────────────────────────

app.get('/api/streak', auth, async (req, res) => {
  try {
    const streak = await Streak.findOne({ userId: req.userId });
    res.json(streak || { currentStreak: 0, longestStreak: 0, studyDates: [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

async function updateStreak(userId) {
  const streak = await Streak.findOne({ userId });
  if (!streak) return;

  const today = new Date(); today.setHours(0,0,0,0);
  const last = streak.lastStudyDate ? new Date(streak.lastStudyDate) : null;
  if (last) last.setHours(0,0,0,0);

  const alreadyStudiedToday = last && last.getTime() === today.getTime();
  if (alreadyStudiedToday) return;

  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
  const consecutive = last && last.getTime() === yesterday.getTime();

  streak.currentStreak = consecutive ? streak.currentStreak + 1 : 1;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastStudyDate = today;
  streak.studyDates.push(today);
  await streak.save();
}

// ─── NOTES ROUTES ──────────────────────────────────────────────────

app.get('/api/notes', auth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/notes', auth, async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    const note = await Note.create({ userId: req.userId, title, body, tags });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/notes/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/notes/:id', auth, async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── HEALTH CHECK ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'NeuroBridge API', version: '1.0.0', time: new Date() });
});

// ─── START SERVER ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 NeuroBridge server running on http://localhost:${PORT}`);
  console.log(`📚 API Health: http://localhost:${PORT}/api/health`);
});

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
app.use(express.json());

// Routes
app.use('/api/daily', require('./routes/daily'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/objectives', require('./routes/objectives'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/events', require('./routes/events'));
app.use('/api/weekly-tasks', require('./routes/weekly-tasks'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/cadences', require('./routes/cadences'));
app.use('/api/calls', require('./routes/calls'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Seller Tracker API running on http://localhost:${PORT}`);
});

// Made with Bob

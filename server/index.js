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
// When credentials is true, origin cannot be '*', so we use a function
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // If FRONTEND_URL is set, only allow that origin
    if (process.env.FRONTEND_URL) {
      if (origin === process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // If no FRONTEND_URL is set, allow all origins
      callback(null, true);
    }
  },
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

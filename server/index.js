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
        // Don't throw error - just reject the origin but allow the request to continue
        // This prevents CORS errors from masking real errors
        console.warn(`CORS: Rejected origin ${origin} (expected ${process.env.FRONTEND_URL})`);
        callback(null, false);
      }
    } else {
      // If no FRONTEND_URL is set, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
app.use(express.json());

// Request logging middleware to help debug issues
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

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

// Error handling middleware - MUST be after all routes
// This catches any errors and ensures proper error responses with CORS headers
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  
  // Set CORS headers manually for error responses
  const origin = req.headers.origin;
  if (origin && (!process.env.FRONTEND_URL || origin === process.env.FRONTEND_URL)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  // Send error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Seller Tracker API running on http://localhost:${PORT}`);
  console.log(`CORS: ${process.env.FRONTEND_URL ? `Restricted to ${process.env.FRONTEND_URL}` : 'Allowing all origins'}`);
});

// Made with Bob

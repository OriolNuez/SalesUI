const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// PostgreSQL connection pool
let pool = null;

// Initialize PostgreSQL connection if DATABASE_URL is provided
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Test connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ PostgreSQL connection error:', err.message);
      console.log('⚠️  Falling back to JSON file storage');
      pool = null;
    } else {
      console.log('✅ Connected to PostgreSQL database');
      console.log('📊 Database time:', res.rows[0].now);
    }
  });
}

// Original lowdb function for JSON file storage
function getDb(filename, defaults) {
  const adapter = new FileSync(path.join(dataDir, filename));
  const db = low(adapter);
  db.defaults(defaults).write();
  return db;
}

// PostgreSQL query helper
async function query(text, params) {
  if (!pool) {
    throw new Error('PostgreSQL not configured. Set DATABASE_URL environment variable.');
  }
  return pool.query(text, params);
}

// Get PostgreSQL pool
function getPool() {
  return pool;
}

// Check if using PostgreSQL
function isUsingPostgres() {
  return pool !== null;
}

module.exports = { 
  getDb,      // For JSON file storage (backward compatibility)
  query,      // For PostgreSQL queries
  getPool,    // Get the connection pool
  isUsingPostgres  // Check which storage is being used
};

// Made with Bob

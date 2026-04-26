const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function getDb(filename, defaults) {
  const adapter = new FileSync(path.join(dataDir, filename));
  const db = low(adapter);
  db.defaults(defaults).write();
  return db;
}

module.exports = { getDb };

// Made with Bob

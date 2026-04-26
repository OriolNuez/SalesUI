const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

const DEFAULT_SETTINGS = {
  currency: 'USD',
  currencySymbol: '$',
  stages: ['Engage', 'Qualify', 'Design', 'Propose', 'Negotiate', 'Closing', 'Won', 'Lost'],
  userName: 'Seller',
  weekStartsOn: 'monday'
};

function db() {
  return getDb('settings.json', { settings: DEFAULT_SETTINGS });
}

// GET /api/settings
router.get('/', (req, res) => {
  res.json(db().get('settings').value());
});

// PUT /api/settings
router.put('/', (req, res) => {
  const d = db();
  const current = d.get('settings').value();
  const updated = { ...current, ...req.body };
  d.set('settings', updated).write();
  res.json(updated);
});

module.exports = router;

// Made with Bob

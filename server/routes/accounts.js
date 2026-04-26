const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

function db() {
  return getDb('accounts.json', { accounts: [] });
}

// GET /api/accounts
router.get('/', (req, res) => {
  res.json(db().get('accounts').value());
});

// GET /api/accounts/:id
router.get('/:id', (req, res) => {
  const account = db().get('accounts').find({ id: req.params.id }).value();
  if (!account) return res.status(404).json({ error: 'Account not found' });
  res.json(account);
});

// POST /api/accounts
router.post('/', (req, res) => {
  // Validation
  if (!req.body.name || !req.body.name.trim()) {
    return res.status(400).json({ error: 'Account name is required' });
  }
  
  const account = {
    id: uuidv4(),
    name: req.body.name,
    contact: req.body.contact || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    sector: req.body.sector || '',
    notes: req.body.notes || '',
    actions: [],
    lastActivity: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  db().get('accounts').push(account).write();
  res.status(201).json(account);
});

// PUT /api/accounts/:id
router.put('/:id', (req, res) => {
  const d = db();
  const account = d.get('accounts').find({ id: req.params.id }).value();
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const updated = { ...account, ...req.body, id: req.params.id };
  d.get('accounts').find({ id: req.params.id }).assign(updated).write();
  res.json(updated);
});

// DELETE /api/accounts/:id
router.delete('/:id', (req, res) => {
  db().get('accounts').remove({ id: req.params.id }).write();
  res.json({ success: true });
});

// POST /api/accounts/:id/actions  — add action to account
router.post('/:id/actions', (req, res) => {
  const d = db();
  const account = d.get('accounts').find({ id: req.params.id }).value();
  if (!account) return res.status(404).json({ error: 'Account not found' });

  // Validation
  if (!req.body.text || !req.body.text.trim()) {
    return res.status(400).json({ error: 'Action text is required' });
  }

  const action = {
    id: uuidv4(),
    text: req.body.text,
    dueDate: req.body.dueDate || null,
    priority: req.body.priority || 'normal',
    status: 'pending',
    type: req.body.type || 'task', // task | call | meeting | email
    notes: req.body.notes || '',
    createdAt: new Date().toISOString()
  };

  account.actions = account.actions || [];
  account.actions.push(action);
  account.lastActivity = new Date().toISOString();
  d.get('accounts').find({ id: req.params.id }).assign(account).write();
  res.status(201).json(action);
});

// PATCH /api/accounts/:id/actions/:actionId
router.patch('/:id/actions/:actionId', (req, res) => {
  const d = db();
  const account = d.get('accounts').find({ id: req.params.id }).value();
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const actionIndex = account.actions.findIndex(a => a.id === req.params.actionId);
  if (actionIndex === -1) return res.status(404).json({ error: 'Action not found' });

  account.actions[actionIndex] = { ...account.actions[actionIndex], ...req.body };
  account.lastActivity = new Date().toISOString();
  d.get('accounts').find({ id: req.params.id }).assign(account).write();
  res.json(account.actions[actionIndex]);
});

// DELETE /api/accounts/:id/actions/:actionId
router.delete('/:id/actions/:actionId', (req, res) => {
  const d = db();
  const account = d.get('accounts').find({ id: req.params.id }).value();
  if (!account) return res.status(404).json({ error: 'Account not found' });
  account.actions = account.actions.filter(a => a.id !== req.params.actionId);
  d.get('accounts').find({ id: req.params.id }).assign(account).write();
  res.json({ success: true });
});

module.exports = router;

// Made with Bob

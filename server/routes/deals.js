const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

const STAGES = ['Engage', 'Qualify', 'Design', 'Propose', 'Negotiate', 'Closing', 'Won', 'Lost'];

function db() {
  return getDb('deals.json', { deals: [] });
}

function accountsDb() {
  return getDb('accounts.json', { accounts: [] });
}

// GET /api/deals
router.get('/', (req, res) => {
  res.json(db().get('deals').value());
});

// GET /api/deals/:id
router.get('/:id', (req, res) => {
  const deal = db().get('deals').find({ id: req.params.id }).value();
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  res.json(deal);
});

// POST /api/deals
router.post('/', (req, res) => {
  // Validation
  if (!req.body.name || !req.body.name.trim()) {
    return res.status(400).json({ error: 'Deal name is required' });
  }
  
  let accountId = req.body.accountId || null;
  let accountName = req.body.accountName || '';

  // Auto-create account if accountName provided but no accountId
  if (accountName && !accountId) {
    const aDb = accountsDb();
    const existing = aDb.get('accounts').find(a =>
      a.name.toLowerCase() === accountName.toLowerCase()
    ).value();
    if (existing) {
      accountId = existing.id;
    } else {
      const newAccount = {
        id: uuidv4(),
        name: accountName,
        contact: req.body.contact || '',
        email: '',
        phone: '',
        sector: '',
        notes: `Auto-created from deal: ${req.body.name}`,
        actions: [],
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      aDb.get('accounts').push(newAccount).write();
      accountId = newAccount.id;
    }
  }

  const deal = {
    id: uuidv4(),
    name: req.body.name,
    accountName,
    accountId,
    contact: req.body.contact || '',
    value: req.body.value || 0,
    stage: req.body.stage || 'Engage',
    predictedCloseDate: req.body.predictedCloseDate || null,
    notes: req.body.notes || '',
    // New fields
    nextMeeting: req.body.nextMeeting || null,
    products: req.body.products || [],
    nextSteps: req.body.nextSteps || '',
    businessPartner: req.body.businessPartner || '',
    iscLink: req.body.iscLink || '',
    history: [
      {
        stage: req.body.stage || 'Engage',
        date: new Date().toISOString(),
        note: 'Deal created'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db().get('deals').push(deal).write();
  res.status(201).json(deal);
});

// PUT /api/deals/:id
router.put('/:id', (req, res) => {
  const d = db();
  const deal = d.get('deals').find({ id: req.params.id }).value();
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const updated = {
    ...deal,
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };

  // If stage changed, add to history
  if (req.body.stage && req.body.stage !== deal.stage) {
    updated.history = [
      ...(deal.history || []),
      {
        stage: req.body.stage,
        date: new Date().toISOString(),
        note: req.body.stageNote || `Moved to ${req.body.stage}`
      }
    ];
  }

  d.get('deals').find({ id: req.params.id }).assign(updated).write();
  res.json(updated);
});

// DELETE /api/deals/:id
router.delete('/:id', (req, res) => {
  db().get('deals').remove({ id: req.params.id }).write();
  res.json({ success: true });
});

// GET /api/deals/summary/pipeline  — pipeline totals by stage
router.get('/summary/pipeline', (req, res) => {
  const deals = db().get('deals').value();
  const summary = {};
  STAGES.forEach(s => {
    const stageDeals = deals.filter(d => d.stage === s);
    summary[s] = {
      count: stageDeals.length,
      totalValue: stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
    };
  });
  const activeDeals = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost');
  summary._totals = {
    pipelineValue: activeDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    totalDeals: activeDeals.length,
    wonValue: deals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    wonCount: deals.filter(d => d.stage === 'Won').length
  };
  res.json(summary);
});

module.exports = router;

// Made with Bob

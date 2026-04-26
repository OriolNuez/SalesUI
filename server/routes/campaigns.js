const express = require('express');
const router = express.Router();
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, '../data/campaigns.json'));
const db = low(adapter);

// Initialize database
db.defaults([]).write();

// Get deals database for campaign opportunities
const dealsAdapter = new FileSync(path.join(__dirname, '../data/deals.json'));
const dealsDb = low(dealsAdapter);

// GET all campaigns
router.get('/', (req, res) => {
  try {
    const campaigns = db.value();
    res.json({ data: campaigns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single campaign
router.get('/:id', (req, res) => {
  try {
    const campaign = db.find({ id: req.params.id }).value();
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ data: campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE campaign
router.post('/', (req, res) => {
  try {
    const { name, description, status, startDate, endDate, targetRevenue } = req.body;
    
    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Campaign name is required' });
    }
    
    const campaign = {
      id: uuidv4(),
      name,
      description: description || '',
      status: status || 'planning',
      startDate: startDate || null,
      endDate: endDate || null,
      targetRevenue: targetRevenue || 0,
      accountIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.push(campaign).write();
    res.status(201).json({ data: campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE campaign
router.put('/:id', (req, res) => {
  try {
    const { name, description, status, startDate, endDate, targetRevenue, accountIds } = req.body;
    
    const campaign = db.find({ id: req.params.id }).value();
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const updates = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
      ...(targetRevenue !== undefined && { targetRevenue }),
      ...(accountIds !== undefined && { accountIds }),
      updatedAt: new Date().toISOString()
    };

    db.find({ id: req.params.id })
      .assign(updates)
      .write();

    const updated = db.find({ id: req.params.id }).value();
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE campaign
router.delete('/:id', (req, res) => {
  try {
    const campaign = db.find({ id: req.params.id }).value();
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    db.remove({ id: req.params.id }).write();
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADD account to campaign
router.post('/:id/accounts', (req, res) => {
  try {
    const { accountId } = req.body;
    
    const campaign = db.find({ id: req.params.id }).value();
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (!campaign.accountIds.includes(accountId)) {
      campaign.accountIds.push(accountId);
      campaign.updatedAt = new Date().toISOString();
      
      db.find({ id: req.params.id })
        .assign(campaign)
        .write();
    }

    const updated = db.find({ id: req.params.id }).value();
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// REMOVE account from campaign
router.delete('/:id/accounts/:accountId', (req, res) => {
  try {
    const campaign = db.find({ id: req.params.id }).value();
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    campaign.accountIds = campaign.accountIds.filter(id => id !== req.params.accountId);
    campaign.updatedAt = new Date().toISOString();
    
    db.find({ id: req.params.id })
      .assign(campaign)
      .write();

    const updated = db.find({ id: req.params.id }).value();
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET campaign opportunities (by hashtag)
router.get('/:id/opportunities', (req, res) => {
  try {
    const campaign = db.find({ id: req.params.id }).value();
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Find deals with campaign hashtag in title or notes
    const campaignHashtag = `#${campaign.name.replace(/\s+/g, '')}`;
    const deals = dealsDb.value() || [];
    
    const campaignDeals = deals.filter(deal => {
      const titleMatch = deal.title && deal.title.includes(campaignHashtag);
      const notesMatch = deal.notes && deal.notes.includes(campaignHashtag);
      const campaignMatch = deal.campaign && deal.campaign === campaign.name;
      return titleMatch || notesMatch || campaignMatch;
    });

    res.json({ data: campaignDeals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Made with Bob

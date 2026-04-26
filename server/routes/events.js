const express = require('express');
const router = express.Router();
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const eventsAdapter = new FileSync(path.join(__dirname, '../data/events.json'));
const eventsDb = low(eventsAdapter);

const invitationsAdapter = new FileSync(path.join(__dirname, '../data/invitations.json'));
const invitationsDb = low(invitationsAdapter);

// Initialize databases
eventsDb.defaults([]).write();
invitationsDb.defaults([]).write();

// GET all events
router.get('/', (req, res) => {
  try {
    const events = eventsDb.value();
    res.json({ data: events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single event
router.get('/:id', (req, res) => {
  try {
    const event = eventsDb.find({ id: req.params.id }).value();
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ data: event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE event
router.post('/', (req, res) => {
  try {
    const { name, description, type, date, location } = req.body;
    
    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Event name is required' });
    }
    
    const event = {
      id: uuidv4(),
      name,
      description: description || '',
      type: type || 'other',
      date: date || null,
      location: location || '',
      accountIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    eventsDb.push(event).write();
    res.status(201).json({ data: event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE event
router.put('/:id', (req, res) => {
  try {
    const { name, description, type, date, location, accountIds } = req.body;
    
    const event = eventsDb.find({ id: req.params.id }).value();
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updates = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(type !== undefined && { type }),
      ...(date !== undefined && { date }),
      ...(location !== undefined && { location }),
      ...(accountIds !== undefined && { accountIds }),
      updatedAt: new Date().toISOString()
    };

    eventsDb.find({ id: req.params.id })
      .assign(updates)
      .write();

    const updated = eventsDb.find({ id: req.params.id }).value();
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE event
router.delete('/:id', (req, res) => {
  try {
    const event = eventsDb.find({ id: req.params.id }).value();
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Delete all invitations for this event
    invitationsDb.remove({ eventId: req.params.id }).write();
    
    // Delete the event
    eventsDb.remove({ id: req.params.id }).write();
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADD account to event
router.post('/:id/accounts', (req, res) => {
  try {
    const { accountId } = req.body;
    
    const event = eventsDb.find({ id: req.params.id }).value();
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.accountIds.includes(accountId)) {
      event.accountIds.push(accountId);
      event.updatedAt = new Date().toISOString();
      
      eventsDb.find({ id: req.params.id })
        .assign(event)
        .write();
    }

    const updated = eventsDb.find({ id: req.params.id }).value();
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// REMOVE account from event
router.delete('/:id/accounts/:accountId', (req, res) => {
  try {
    const event = eventsDb.find({ id: req.params.id }).value();
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.accountIds = event.accountIds.filter(id => id !== req.params.accountId);
    event.updatedAt = new Date().toISOString();
    
    // Also delete invitations for this account
    invitationsDb.remove({ eventId: req.params.id, accountId: req.params.accountId }).write();
    
    eventsDb.find({ id: req.params.id })
      .assign(event)
      .write();

    const updated = eventsDb.find({ id: req.params.id }).value();
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET event invitations
router.get('/:id/invitations', (req, res) => {
  try {
    const event = eventsDb.find({ id: req.params.id }).value();
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const invitations = invitationsDb.filter({ eventId: req.params.id }).value();
    res.json({ data: invitations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE invitation
router.post('/:id/invitations', (req, res) => {
  try {
    const { accountId, contactName, contactPosition, platform, status, sentDate, responseDate, notes } = req.body;
    
    const event = eventsDb.find({ id: req.params.id }).value();
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const invitation = {
      id: uuidv4(),
      eventId: req.params.id,
      accountId,
      contactName: contactName || '',
      contactPosition: contactPosition || '',
      platform: platform || 'email',
      status: status || 'not_sent',
      sentDate: sentDate || null,
      responseDate: responseDate || null,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    invitationsDb.push(invitation).write();
    res.status(201).json({ data: invitation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE invitation
router.put('/invitations/:id', (req, res) => {
  try {
    const { contactName, contactPosition, platform, status, sentDate, responseDate, notes } = req.body;
    
    const invitation = invitationsDb.find({ id: req.params.id }).value();
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const updates = {
      ...(contactName !== undefined && { contactName }),
      ...(contactPosition !== undefined && { contactPosition }),
      ...(platform !== undefined && { platform }),
      ...(status !== undefined && { status }),
      ...(sentDate !== undefined && { sentDate }),
      ...(responseDate !== undefined && { responseDate }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date().toISOString()
    };

    invitationsDb.find({ id: req.params.id })
      .assign(updates)
      .write();

    const updated = invitationsDb.find({ id: req.params.id }).value();
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE invitation
router.delete('/invitations/:id', (req, res) => {
  try {
    const invitation = invitationsDb.find({ id: req.params.id }).value();
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    invitationsDb.remove({ id: req.params.id }).write();
    res.json({ message: 'Invitation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Made with Bob

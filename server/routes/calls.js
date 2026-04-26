const express = require('express');
const router = express.Router();
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, '../data/calls.json'));
const db = low(adapter);

// Initialize database
db.defaults({ calls: [] }).write();

// Get all calls with optional filtering
router.get('/', (req, res) => {
  try {
    let calls = db.get('calls').value() || [];
    
    // Apply filters if provided
    const { outcome, accountId, startDate, endDate, search } = req.query;
    
    if (outcome) {
      calls = calls.filter(call => call.outcome === outcome);
    }
    
    if (accountId) {
      calls = calls.filter(call => call.accountId === accountId);
    }
    
    if (startDate) {
      calls = calls.filter(call => new Date(call.callDate) >= new Date(startDate));
    }
    
    if (endDate) {
      calls = calls.filter(call => new Date(call.callDate) <= new Date(endDate));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      calls = calls.filter(call => 
        call.contactName.toLowerCase().includes(searchLower) ||
        call.accountName.toLowerCase().includes(searchLower) ||
        (call.notes && call.notes.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort by date descending (newest first)
    calls.sort((a, b) => new Date(b.callDate) - new Date(a.callDate));
    
    res.json({ data: calls });
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

// Get call statistics
router.get('/stats', (req, res) => {
  try {
    const calls = db.get('calls').value() || [];
    
    const { startDate, endDate } = req.query;
    let filteredCalls = calls;
    
    if (startDate) {
      filteredCalls = filteredCalls.filter(call => new Date(call.callDate) >= new Date(startDate));
    }
    
    if (endDate) {
      filteredCalls = filteredCalls.filter(call => new Date(call.callDate) <= new Date(endDate));
    }
    
    // Calculate statistics
    const totalCalls = filteredCalls.length;
    const meetingsScheduled = filteredCalls.filter(c => c.outcome === 'meeting_scheduled').length;
    const rejected = filteredCalls.filter(c => c.outcome === 'rejected').length;
    const interested = filteredCalls.filter(c => c.outcome === 'interested').length;
    const notInterested = filteredCalls.filter(c => c.outcome === 'not_interested').length;
    const voicemail = filteredCalls.filter(c => c.outcome === 'voicemail').length;
    const noAnswer = filteredCalls.filter(c => c.outcome === 'no_answer').length;
    
    const successRate = totalCalls > 0 ? ((meetingsScheduled / totalCalls) * 100).toFixed(1) : 0;
    const contactRate = totalCalls > 0 ? (((totalCalls - noAnswer) / totalCalls) * 100).toFixed(1) : 0;
    
    // Calls by day of week
    const callsByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    filteredCalls.forEach(call => {
      const day = new Date(call.callDate).getDay();
      callsByDayOfWeek[day]++;
    });
    
    // Calls by hour
    const callsByHour = Array(24).fill(0);
    filteredCalls.forEach(call => {
      const hour = new Date(call.callDate).getHours();
      callsByHour[hour]++;
    });
    
    // Success rate by hour
    const successByHour = Array(24).fill(0).map(() => ({ total: 0, success: 0 }));
    filteredCalls.forEach(call => {
      const hour = new Date(call.callDate).getHours();
      successByHour[hour].total++;
      if (call.outcome === 'meeting_scheduled') {
        successByHour[hour].success++;
      }
    });
    
    // Calls trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCalls = calls.filter(c => new Date(c.callDate) >= thirtyDaysAgo);
    
    const callsTrend = {};
    recentCalls.forEach(call => {
      const date = new Date(call.callDate).toISOString().split('T')[0];
      callsTrend[date] = (callsTrend[date] || 0) + 1;
    });
    
    // Average call duration
    const callsWithDuration = filteredCalls.filter(c => c.callDuration > 0);
    const avgDuration = callsWithDuration.length > 0
      ? (callsWithDuration.reduce((sum, c) => sum + c.callDuration, 0) / callsWithDuration.length).toFixed(1)
      : 0;
    
    res.json({
      data: {
        totalCalls,
        meetingsScheduled,
        rejected,
        interested,
        notInterested,
        voicemail,
        noAnswer,
        successRate: parseFloat(successRate),
        contactRate: parseFloat(contactRate),
        avgDuration: parseFloat(avgDuration),
        outcomeDistribution: {
          meeting_scheduled: meetingsScheduled,
          rejected,
          interested,
          not_interested: notInterested,
          voicemail,
          no_answer: noAnswer
        },
        callsByDayOfWeek,
        callsByHour,
        successByHour: successByHour.map(h => h.total > 0 ? ((h.success / h.total) * 100).toFixed(1) : 0),
        callsTrend
      }
    });
  } catch (error) {
    console.error('Error fetching call stats:', error);
    res.status(500).json({ error: 'Failed to fetch call statistics' });
  }
});

// Get a single call
router.get('/:id', (req, res) => {
  try {
    const call = db.get('calls').find({ id: req.params.id }).value();
    
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    res.json({ data: call });
  } catch (error) {
    console.error('Error fetching call:', error);
    res.status(500).json({ error: 'Failed to fetch call' });
  }
});

// Create a new call
router.post('/', (req, res) => {
  try {
    const newCall = {
      id: Date.now().toString(),
      contactName: req.body.contactName,
      contactPosition: req.body.contactPosition || '',
      accountId: req.body.accountId || null,
      accountName: req.body.accountName || '',
      linkedInUrl: req.body.linkedInUrl || '',
      phoneNumber: req.body.phoneNumber || '',
      email: req.body.email || '',
      callDate: req.body.callDate || new Date().toISOString(),
      callDuration: req.body.callDuration || 0,
      callType: req.body.callType || 'outbound',
      callPurpose: req.body.callPurpose || '',
      outcome: req.body.outcome || 'no_answer',
      rejectionReason: req.body.rejectionReason || '',
      nextMeetingDate: req.body.nextMeetingDate || null,
      notes: req.body.notes || '',
      tags: req.body.tags || [],
      linkedOpportunityId: req.body.linkedOpportunityId || null,
      linkedCampaignId: req.body.linkedCampaignId || null,
      followUpRequired: req.body.followUpRequired || false,
      followUpDate: req.body.followUpDate || null,
      followUpCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.get('calls').push(newCall).write();
    
    res.status(201).json({ data: newCall });
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ error: 'Failed to create call' });
  }
});

// Update a call
router.put('/:id', (req, res) => {
  try {
    const call = db.get('calls').find({ id: req.params.id }).value();
    
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    const updatedCall = {
      ...call,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };
    
    db.get('calls')
      .find({ id: req.params.id })
      .assign(updatedCall)
      .write();
    
    res.json({ data: updatedCall });
  } catch (error) {
    console.error('Error updating call:', error);
    res.status(500).json({ error: 'Failed to update call' });
  }
});

// Delete a call
router.delete('/:id', (req, res) => {
  try {
    const call = db.get('calls').find({ id: req.params.id }).value();
    
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    db.get('calls')
      .remove({ id: req.params.id })
      .write();
    
    res.json({ message: 'Call deleted successfully' });
  } catch (error) {
    console.error('Error deleting call:', error);
    res.status(500).json({ error: 'Failed to delete call' });
  }
});

module.exports = router;

// Made with Bob

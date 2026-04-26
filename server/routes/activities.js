const express = require('express');
const router = express.Router();
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const adapter = new FileSync(path.join(__dirname, '../data/activities.json'));
const db = low(adapter);

// Initialize database
db.defaults({ activities: [] }).write();

// Get all activities with optional filtering
router.get('/', (req, res) => {
  try {
    let activities = db.get('activities').value() || [];
    
    // Apply filters if provided
    const { activityType, outcome, accountId, startDate, endDate, search } = req.query;
    
    if (activityType) {
      activities = activities.filter(a => a.activityType === activityType);
    }
    
    if (outcome) {
      activities = activities.filter(a => a.outcome === outcome);
    }
    
    if (accountId) {
      activities = activities.filter(a => a.accountId === accountId);
    }
    
    if (startDate) {
      activities = activities.filter(a => new Date(a.activityDate) >= new Date(startDate));
    }
    
    if (endDate) {
      activities = activities.filter(a => new Date(a.activityDate) <= new Date(endDate));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      activities = activities.filter(a => 
        a.contactName.toLowerCase().includes(searchLower) ||
        a.accountName.toLowerCase().includes(searchLower) ||
        (a.notes && a.notes.toLowerCase().includes(searchLower)) ||
        (a.emailSubject && a.emailSubject.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort by date descending (newest first)
    activities.sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
    
    res.json({ data: activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get activity statistics
router.get('/stats', (req, res) => {
  try {
    const activities = db.get('activities').value() || [];
    
    const { startDate, endDate, activityType } = req.query;
    let filteredActivities = activities;
    
    if (startDate) {
      filteredActivities = filteredActivities.filter(a => new Date(a.activityDate) >= new Date(startDate));
    }
    
    if (endDate) {
      filteredActivities = filteredActivities.filter(a => new Date(a.activityDate) <= new Date(endDate));
    }
    
    if (activityType) {
      filteredActivities = filteredActivities.filter(a => a.activityType === activityType);
    }
    
    // Overall statistics
    const totalActivities = filteredActivities.length;
    const callActivities = filteredActivities.filter(a => a.activityType === 'call');
    const emailActivities = filteredActivities.filter(a => a.activityType === 'email');
    const linkedinActivities = filteredActivities.filter(a => a.activityType === 'linkedin');
    
    // Call statistics
    const callMeetingsScheduled = callActivities.filter(a => a.outcome === 'meeting_scheduled').length;
    const callSuccessRate = callActivities.length > 0 ? ((callMeetingsScheduled / callActivities.length) * 100).toFixed(1) : 0;
    const callContactRate = callActivities.length > 0 ? 
      (((callActivities.length - callActivities.filter(a => a.outcome === 'no_answer').length) / callActivities.length) * 100).toFixed(1) : 0;
    
    // Email statistics
    const emailReplied = emailActivities.filter(a => 
      a.outcome === 'replied_positive' || a.outcome === 'replied_neutral' || a.outcome === 'replied_negative'
    ).length;
    const emailOpened = emailActivities.filter(a => a.emailOpened).length;
    const emailReplyRate = emailActivities.length > 0 ? ((emailReplied / emailActivities.length) * 100).toFixed(1) : 0;
    const emailOpenRate = emailActivities.length > 0 ? ((emailOpened / emailActivities.length) * 100).toFixed(1) : 0;
    
    // LinkedIn statistics
    const linkedinAccepted = linkedinActivities.filter(a => a.outcome === 'connection_accepted').length;
    const linkedinReplied = linkedinActivities.filter(a => a.outcome === 'message_replied').length;
    const linkedinResponseRate = linkedinActivities.length > 0 ? 
      (((linkedinAccepted + linkedinReplied) / linkedinActivities.length) * 100).toFixed(1) : 0;
    
    // Activity distribution by type
    const activityDistribution = {
      call: callActivities.length,
      email: emailActivities.length,
      linkedin: linkedinActivities.length
    };
    
    // Outcome distribution by type
    const callOutcomes = {};
    const emailOutcomes = {};
    const linkedinOutcomes = {};
    
    callActivities.forEach(a => {
      callOutcomes[a.outcome] = (callOutcomes[a.outcome] || 0) + 1;
    });
    
    emailActivities.forEach(a => {
      emailOutcomes[a.outcome] = (emailOutcomes[a.outcome] || 0) + 1;
    });
    
    linkedinActivities.forEach(a => {
      linkedinOutcomes[a.outcome] = (linkedinOutcomes[a.outcome] || 0) + 1;
    });
    
    // Activities by day of week
    const activitiesByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
    filteredActivities.forEach(a => {
      const day = new Date(a.activityDate).getDay();
      activitiesByDayOfWeek[day]++;
    });
    
    // Activities by hour
    const activitiesByHour = Array(24).fill(0);
    filteredActivities.forEach(a => {
      const hour = new Date(a.activityDate).getHours();
      activitiesByHour[hour]++;
    });
    
    // Success rate by hour (for calls)
    const successByHour = Array(24).fill(0).map(() => ({ total: 0, success: 0 }));
    callActivities.forEach(a => {
      const hour = new Date(a.activityDate).getHours();
      successByHour[hour].total++;
      if (a.outcome === 'meeting_scheduled') {
        successByHour[hour].success++;
      }
    });
    
    // Activities trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivities = activities.filter(a => new Date(a.activityDate) >= thirtyDaysAgo);
    
    const activitiesTrend = {};
    recentActivities.forEach(a => {
      const date = new Date(a.activityDate).toISOString().split('T')[0];
      if (!activitiesTrend[date]) {
        activitiesTrend[date] = { call: 0, email: 0, linkedin: 0 };
      }
      activitiesTrend[date][a.activityType]++;
    });
    
    // Average call duration
    const callsWithDuration = callActivities.filter(a => a.callDuration > 0);
    const avgCallDuration = callsWithDuration.length > 0
      ? (callsWithDuration.reduce((sum, a) => sum + a.callDuration, 0) / callsWithDuration.length).toFixed(1)
      : 0;
    
    res.json({
      data: {
        totalActivities,
        activityDistribution,
        
        // Call stats
        totalCalls: callActivities.length,
        callMeetingsScheduled,
        callSuccessRate: parseFloat(callSuccessRate),
        callContactRate: parseFloat(callContactRate),
        avgCallDuration: parseFloat(avgCallDuration),
        callOutcomes,
        
        // Email stats
        totalEmails: emailActivities.length,
        emailReplied,
        emailOpened,
        emailReplyRate: parseFloat(emailReplyRate),
        emailOpenRate: parseFloat(emailOpenRate),
        emailOutcomes,
        
        // LinkedIn stats
        totalLinkedIn: linkedinActivities.length,
        linkedinAccepted,
        linkedinReplied,
        linkedinResponseRate: parseFloat(linkedinResponseRate),
        linkedinOutcomes,
        
        // Time-based stats
        activitiesByDayOfWeek,
        activitiesByHour,
        successByHour: successByHour.map(h => h.total > 0 ? ((h.success / h.total) * 100).toFixed(1) : 0),
        activitiesTrend
      }
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ error: 'Failed to fetch activity statistics' });
  }
});

// Get a single activity
router.get('/:id', (req, res) => {
  try {
    const activity = db.get('activities').find({ id: req.params.id }).value();
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    res.json({ data: activity });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Create a new activity
router.post('/', (req, res) => {
  try {
    const newActivity = {
      id: Date.now().toString(),
      activityType: req.body.activityType || 'call',
      
      // Contact information
      contactName: req.body.contactName,
      contactPosition: req.body.contactPosition || '',
      accountId: req.body.accountId || null,
      accountName: req.body.accountName || '',
      linkedInUrl: req.body.linkedInUrl || '',
      phoneNumber: req.body.phoneNumber || '',
      email: req.body.email || '',
      
      // Activity details
      activityDate: req.body.activityDate || new Date().toISOString(),
      outcome: req.body.outcome || '',
      notes: req.body.notes || '',
      followUpRequired: req.body.followUpRequired || false,
      followUpDate: req.body.followUpDate || null,
      
      // Call-specific fields
      callDuration: req.body.callDuration || 0,
      callType: req.body.callType || 'outbound',
      callPurpose: req.body.callPurpose || '',
      rejectionReason: req.body.rejectionReason || '',
      nextMeetingDate: req.body.nextMeetingDate || null,
      
      // Email-specific fields
      emailSubject: req.body.emailSubject || '',
      emailType: req.body.emailType || '',
      emailSent: req.body.emailSent || false,
      emailOpened: req.body.emailOpened || false,
      emailReplied: req.body.emailReplied || false,
      emailBounced: req.body.emailBounced || false,
      
      // LinkedIn-specific fields
      linkedInMessageType: req.body.linkedInMessageType || '',
      linkedInConnectionStatus: req.body.linkedInConnectionStatus || '',
      linkedInEngagementType: req.body.linkedInEngagementType || '',
      
      // Metadata
      linkedOpportunityId: req.body.linkedOpportunityId || null,
      linkedCampaignId: req.body.linkedCampaignId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.get('activities').push(newActivity).write();
    
    // Auto-log to objectives (obj-7: "Leads Called On")
    try {
      const objectivesDb = getDb('objectives.json', { objectives: [], logs: [] });
      const activityDate = new Date(newActivity.activityDate).toISOString().split('T')[0];
      
      const logEntry = {
        id: uuidv4(),
        objectiveId: 'obj-7',
        value: 1,
        date: activityDate,
        note: `${newActivity.activityType.charAt(0).toUpperCase() + newActivity.activityType.slice(1)} - ${newActivity.contactName} (${newActivity.accountName})`,
        source: 'activities',
        activityId: newActivity.id,
        createdAt: new Date().toISOString()
      };
      
      objectivesDb.get('logs').push(logEntry).write();
    } catch (objError) {
      console.error('Error logging to objectives:', objError);
      // Don't fail the activity creation if objectives logging fails
    }
    
    res.status(201).json({ data: newActivity });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// Update an activity
router.put('/:id', (req, res) => {
  try {
    const activity = db.get('activities').find({ id: req.params.id }).value();
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    const updatedActivity = {
      ...activity,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };
    
    db.get('activities')
      .find({ id: req.params.id })
      .assign(updatedActivity)
      .write();
    
    res.json({ data: updatedActivity });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// Delete an activity
router.delete('/:id', (req, res) => {
  try {
    const activity = db.get('activities').find({ id: req.params.id }).value();
    
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    db.get('activities')
      .remove({ id: req.params.id })
      .write();
    
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

module.exports = router;

// Made with Bob

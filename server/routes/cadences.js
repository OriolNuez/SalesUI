const express = require('express');
const router = express.Router();
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const adapter = new FileSync(path.join(__dirname, '../data/cadences.json'));
const db = low(adapter);

// Initialize database
db.defaults({ cadenceTemplates: [], enrollments: [], emailTemplates: [] }).write();

// ═══════════════════════════════════════════════════════════════════════════
// CADENCE TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

// Get all cadence templates
router.get('/templates', (req, res) => {
  try {
    const templates = db.get('cadenceTemplates').value() || [];
    res.json({ data: templates });
  } catch (error) {
    console.error('Error fetching cadence templates:', error);
    res.status(500).json({ error: 'Failed to fetch cadence templates' });
  }
});

// Get a single cadence template
router.get('/templates/:id', (req, res) => {
  try {
    const template = db.get('cadenceTemplates').find({ id: req.params.id }).value();
    if (!template) {
      return res.status(404).json({ error: 'Cadence template not found' });
    }
    res.json({ data: template });
  } catch (error) {
    console.error('Error fetching cadence template:', error);
    res.status(500).json({ error: 'Failed to fetch cadence template' });
  }
});

// Create a new cadence template
router.post('/templates', (req, res) => {
  try {
    const newTemplate = {
      id: uuidv4(),
      name: req.body.name,
      description: req.body.description || '',
      campaignId: req.body.campaignId || null,
      isActive: req.body.isActive !== false,
      steps: req.body.steps || [], // Array of step objects
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.get('cadenceTemplates').push(newTemplate).write();
    res.status(201).json({ data: newTemplate });
  } catch (error) {
    console.error('Error creating cadence template:', error);
    res.status(500).json({ error: 'Failed to create cadence template' });
  }
});

// Update a cadence template
router.put('/templates/:id', (req, res) => {
  try {
    const template = db.get('cadenceTemplates').find({ id: req.params.id }).value();
    if (!template) {
      return res.status(404).json({ error: 'Cadence template not found' });
    }

    const updatedTemplate = {
      ...template,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    db.get('cadenceTemplates')
      .find({ id: req.params.id })
      .assign(updatedTemplate)
      .write();

    res.json({ data: updatedTemplate });
  } catch (error) {
    console.error('Error updating cadence template:', error);
    res.status(500).json({ error: 'Failed to update cadence template' });
  }
});

// Delete a cadence template
router.delete('/templates/:id', (req, res) => {
  try {
    const template = db.get('cadenceTemplates').find({ id: req.params.id }).value();
    if (!template) {
      return res.status(404).json({ error: 'Cadence template not found' });
    }

    db.get('cadenceTemplates').remove({ id: req.params.id }).write();
    res.json({ message: 'Cadence template deleted successfully' });
  } catch (error) {
    console.error('Error deleting cadence template:', error);
    res.status(500).json({ error: 'Failed to delete cadence template' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ENROLLMENTS
// ═══════════════════════════════════════════════════════════════════════════

// Get all enrollments with optional filtering
router.get('/enrollments', (req, res) => {
  try {
    let enrollments = db.get('enrollments').value() || [];
    
    const { templateId, accountId, contactId, status } = req.query;
    
    if (templateId) {
      enrollments = enrollments.filter(e => e.templateId === templateId);
    }
    if (accountId) {
      enrollments = enrollments.filter(e => e.accountId === accountId);
    }
    if (contactId) {
      enrollments = enrollments.filter(e => e.contactId === contactId);
    }
    if (status) {
      enrollments = enrollments.filter(e => e.status === status);
    }

    // Sort by enrollment date descending
    enrollments.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));
    
    res.json({ data: enrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Get a single enrollment
router.get('/enrollments/:id', (req, res) => {
  try {
    const enrollment = db.get('enrollments').find({ id: req.params.id }).value();
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    res.json({ data: enrollment });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment' });
  }
});

// Enroll a contact in a cadence
router.post('/enrollments', (req, res) => {
  try {
    const template = db.get('cadenceTemplates').find({ id: req.body.templateId }).value();
    if (!template) {
      return res.status(404).json({ error: 'Cadence template not found' });
    }

    // Create step executions based on template steps
    const stepExecutions = template.steps.map(step => ({
      stepId: step.id,
      stepDay: step.day,
      stepType: step.type,
      scheduledDate: dayjs().add(step.day, 'day').format('YYYY-MM-DD'),
      status: 'pending', // pending, completed, skipped, failed
      completedAt: null,
      activityId: null,
      notes: ''
    }));

    const newEnrollment = {
      id: uuidv4(),
      templateId: req.body.templateId,
      templateName: template.name,
      accountId: req.body.accountId,
      accountName: req.body.accountName,
      contactId: req.body.contactId || null,
      contactName: req.body.contactName,
      contactEmail: req.body.contactEmail || '',
      contactPhone: req.body.contactPhone || '',
      contactLinkedIn: req.body.contactLinkedIn || '',
      status: 'active', // active, paused, completed, cancelled
      currentStep: 0,
      stepExecutions: stepExecutions,
      enrolledAt: new Date().toISOString(),
      completedAt: null,
      pausedAt: null,
      cancelledAt: null,
      notes: req.body.notes || ''
    };

    db.get('enrollments').push(newEnrollment).write();
    res.status(201).json({ data: newEnrollment });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    res.status(500).json({ error: 'Failed to create enrollment' });
  }
});

// Update enrollment status
router.patch('/enrollments/:id/status', (req, res) => {
  try {
    const enrollment = db.get('enrollments').find({ id: req.params.id }).value();
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const { status } = req.body;
    const updates = { status };

    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
    } else if (status === 'paused') {
      updates.pausedAt = new Date().toISOString();
    } else if (status === 'cancelled') {
      updates.cancelledAt = new Date().toISOString();
    } else if (status === 'active') {
      updates.pausedAt = null;
    }

    db.get('enrollments')
      .find({ id: req.params.id })
      .assign(updates)
      .write();

    const updatedEnrollment = db.get('enrollments').find({ id: req.params.id }).value();
    res.json({ data: updatedEnrollment });
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    res.status(500).json({ error: 'Failed to update enrollment status' });
  }
});

// Complete a step in an enrollment
router.patch('/enrollments/:id/steps/:stepIndex/complete', (req, res) => {
  try {
    const enrollment = db.get('enrollments').find({ id: req.params.id }).value();
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const stepIndex = parseInt(req.params.stepIndex);
    if (stepIndex < 0 || stepIndex >= enrollment.stepExecutions.length) {
      return res.status(400).json({ error: 'Invalid step index' });
    }

    enrollment.stepExecutions[stepIndex].status = 'completed';
    enrollment.stepExecutions[stepIndex].completedAt = new Date().toISOString();
    enrollment.stepExecutions[stepIndex].activityId = req.body.activityId || null;
    enrollment.stepExecutions[stepIndex].notes = req.body.notes || '';
    enrollment.currentStep = stepIndex + 1;

    // Check if all steps are completed
    const allCompleted = enrollment.stepExecutions.every(s => s.status === 'completed' || s.status === 'skipped');
    if (allCompleted) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date().toISOString();
    }

    db.get('enrollments')
      .find({ id: req.params.id })
      .assign(enrollment)
      .write();

    res.json({ data: enrollment });
  } catch (error) {
    console.error('Error completing step:', error);
    res.status(500).json({ error: 'Failed to complete step' });
  }
});

// Skip a step in an enrollment
router.patch('/enrollments/:id/steps/:stepIndex/skip', (req, res) => {
  try {
    const enrollment = db.get('enrollments').find({ id: req.params.id }).value();
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const stepIndex = parseInt(req.params.stepIndex);
    if (stepIndex < 0 || stepIndex >= enrollment.stepExecutions.length) {
      return res.status(400).json({ error: 'Invalid step index' });
    }

    enrollment.stepExecutions[stepIndex].status = 'skipped';
    enrollment.stepExecutions[stepIndex].notes = req.body.reason || 'Skipped';
    enrollment.currentStep = stepIndex + 1;

    db.get('enrollments')
      .find({ id: req.params.id })
      .assign(enrollment)
      .write();

    res.json({ data: enrollment });
  } catch (error) {
    console.error('Error skipping step:', error);
    res.status(500).json({ error: 'Failed to skip step' });
  }
});

// Delete an enrollment
router.delete('/enrollments/:id', (req, res) => {
  try {
    const enrollment = db.get('enrollments').find({ id: req.params.id }).value();
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    db.get('enrollments').remove({ id: req.params.id }).write();
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ error: 'Failed to delete enrollment' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

// Get all email templates
router.get('/email-templates', (req, res) => {
  try {
    const templates = db.get('emailTemplates').value() || [];
    res.json({ data: templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

// Create email template
router.post('/email-templates', (req, res) => {
  try {
    const newTemplate = {
      id: uuidv4(),
      name: req.body.name,
      subject: req.body.subject,
      body: req.body.body,
      variables: req.body.variables || [], // e.g., ['contactName', 'accountName', 'companyName']
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.get('emailTemplates').push(newTemplate).write();
    res.status(201).json({ data: newTemplate });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ error: 'Failed to create email template' });
  }
});

// Update email template
router.put('/email-templates/:id', (req, res) => {
  try {
    const template = db.get('emailTemplates').find({ id: req.params.id }).value();
    if (!template) {
      return res.status(404).json({ error: 'Email template not found' });
    }

    const updatedTemplate = {
      ...template,
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    db.get('emailTemplates')
      .find({ id: req.params.id })
      .assign(updatedTemplate)
      .write();

    res.json({ data: updatedTemplate });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ error: 'Failed to update email template' });
  }
});

// Delete email template
router.delete('/email-templates/:id', (req, res) => {
  try {
    const template = db.get('emailTemplates').find({ id: req.params.id }).value();
    if (!template) {
      return res.status(404).json({ error: 'Email template not found' });
    }

    db.get('emailTemplates').remove({ id: req.params.id }).write();
    res.json({ message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ error: 'Failed to delete email template' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

// Get cadence statistics
router.get('/stats', (req, res) => {
  try {
    const enrollments = db.get('enrollments').value() || [];
    const templates = db.get('cadenceTemplates').value() || [];

    const stats = {
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter(e => e.status === 'active').length,
      completedEnrollments: enrollments.filter(e => e.status === 'completed').length,
      pausedEnrollments: enrollments.filter(e => e.status === 'paused').length,
      cancelledEnrollments: enrollments.filter(e => e.status === 'cancelled').length,
      totalTemplates: templates.length,
      activeTemplates: templates.filter(t => t.isActive).length,
      
      // Step completion stats
      totalSteps: enrollments.reduce((sum, e) => sum + e.stepExecutions.length, 0),
      completedSteps: enrollments.reduce((sum, e) => 
        sum + e.stepExecutions.filter(s => s.status === 'completed').length, 0),
      pendingSteps: enrollments.reduce((sum, e) => 
        sum + e.stepExecutions.filter(s => s.status === 'pending').length, 0),
      
      // Performance by template
      templatePerformance: templates.map(template => {
        const templateEnrollments = enrollments.filter(e => e.templateId === template.id);
        const completed = templateEnrollments.filter(e => e.status === 'completed').length;
        const active = templateEnrollments.filter(e => e.status === 'active').length;
        
        return {
          templateId: template.id,
          templateName: template.name,
          totalEnrollments: templateEnrollments.length,
          activeEnrollments: active,
          completedEnrollments: completed,
          completionRate: templateEnrollments.length > 0 
            ? ((completed / templateEnrollments.length) * 100).toFixed(1) 
            : 0
        };
      })
    };

    res.json({ data: stats });
  } catch (error) {
    console.error('Error fetching cadence stats:', error);
    res.status(500).json({ error: 'Failed to fetch cadence statistics' });
  }
});

module.exports = router;

// Made with Bob
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

function getDayDb(date) {
  return getDb('daily.json', { days: {} });
}

// GET /api/daily/:date  (date format: YYYY-MM-DD)
router.get('/:date', (req, res) => {
  const db = getDayDb();
  const day = db.get(`days.${req.params.date}`).value() || {
    date: req.params.date,
    tasks: [],
    completedLog: [],
    diary: { wins: '', blockers: '', tomorrowFocus: '', notes: '' }
  };
  res.json(day);
});

// PUT /api/daily/:date  — save full day object
router.put('/:date', (req, res) => {
  const db = getDayDb();
  db.set(`days.${req.params.date}`, req.body).write();
  res.json(req.body);
});

// POST /api/daily/:date/tasks  — add a task
router.post('/:date/tasks', (req, res) => {
  const { v4: uuidv4 } = require('uuid');
  const db = getDayDb();
  const dayPath = `days.${req.params.date}`;
  const day = db.get(dayPath).value() || {
    date: req.params.date,
    tasks: [],
    completedLog: [],
    diary: { wins: '', blockers: '', tomorrowFocus: '', notes: '' }
  };
  const task = {
    id: uuidv4(),
    text: req.body.text,
    time: req.body.time || '',
    priority: req.body.priority || 'normal',
    done: false,
    createdAt: new Date().toISOString()
  };
  day.tasks.push(task);
  db.set(dayPath, day).write();
  res.json(task);
});

// PATCH /api/daily/:date/tasks/:taskId  — update task (e.g. mark done)
router.patch('/:date/tasks/:taskId', (req, res) => {
  const db = getDayDb();
  const dayPath = `days.${req.params.date}`;
  const day = db.get(dayPath).value();
  if (!day) return res.status(404).json({ error: 'Day not found' });

  const taskIndex = day.tasks.findIndex(t => t.id === req.params.taskId);
  if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });

  day.tasks[taskIndex] = { ...day.tasks[taskIndex], ...req.body };

  // If marking done, add to completed log
  if (req.body.done && !day.tasks[taskIndex].completedAt) {
    day.tasks[taskIndex].completedAt = new Date().toISOString();
    day.completedLog = day.completedLog || [];
    day.completedLog.push({
      taskId: req.params.taskId,
      text: day.tasks[taskIndex].text,
      completedAt: day.tasks[taskIndex].completedAt
    });
  }

  db.set(dayPath, day).write();
  res.json(day.tasks[taskIndex]);
});

// DELETE /api/daily/:date/tasks/:taskId
router.delete('/:date/tasks/:taskId', (req, res) => {
  const db = getDayDb();
  const dayPath = `days.${req.params.date}`;
  const day = db.get(dayPath).value();
  if (!day) return res.status(404).json({ error: 'Day not found' });
  day.tasks = day.tasks.filter(t => t.id !== req.params.taskId);
  db.set(dayPath, day).write();
  res.json({ success: true });
});

// PATCH /api/daily/:date/diary  — update diary section
router.patch('/:date/diary', (req, res) => {
  const db = getDayDb();
  const dayPath = `days.${req.params.date}`;
  const day = db.get(dayPath).value() || {
    date: req.params.date,
    tasks: [],
    completedLog: [],
    diary: {}
  };
  day.diary = { ...day.diary, ...req.body };
  db.set(dayPath, day).write();
  res.json(day.diary);
});

module.exports = router;

// Made with Bob

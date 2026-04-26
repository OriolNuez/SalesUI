const express = require('express');
const router = express.Router();
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');

dayjs.extend(isoWeek);

const adapter = new FileSync(path.join(__dirname, '../data/weekly-tasks.json'));
const db = low(adapter);

// Initialize database
db.defaults([]).write();

// Helper function to get current week start (Monday)
function getCurrentWeekStart() {
  return dayjs().startOf('isoWeek').format('YYYY-MM-DD');
}

// Helper function to archive old completed tasks
function archiveOldTasks() {
  const currentWeek = getCurrentWeekStart();
  const tasks = db.value();
  
  // Process tasks and create new array to avoid mutation issues
  const activeTasks = tasks.map(task => {
    // Create a copy to avoid mutating the original
    const taskCopy = { ...task };
    
    // If task doesn't have weekStart, it's from old system
    if (!taskCopy.weekStart) {
      // If it's completed, mark for removal
      if (taskCopy.done) {
        return null;
      }
      // If incomplete, carry over to current week
      taskCopy.weekStart = currentWeek;
      return taskCopy;
    }
    
    // Keep tasks from current week or future weeks unchanged
    if (taskCopy.weekStart >= currentWeek) {
      return taskCopy;
    }
    
    // For tasks from PAST weeks only:
    if (!taskCopy.done) {
      // Carry incomplete tasks to current week
      taskCopy.weekStart = currentWeek;
      return taskCopy;
    }
    
    // Remove completed tasks from previous weeks
    return null;
  }).filter(task => task !== null);
  
  db.setState(activeTasks).write();
  return activeTasks;
}

// GET all weekly tasks (with automatic archiving)
router.get('/', (req, res) => {
  try {
    // Archive old completed tasks before returning
    const tasks = archiveOldTasks();
    res.json({ data: tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single task
router.get('/:id', (req, res) => {
  try {
    const task = db.find({ id: req.params.id }).value();
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ data: task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE task
router.post('/', (req, res) => {
  try {
    const { text, priority, dueDate, weekStart } = req.body;
    
    // Validation
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Task text is required' });
    }
    
    const task = {
      id: uuidv4(),
      text,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      done: false,
      weekStart: weekStart || getCurrentWeekStart(), // Use provided weekStart or default to current week
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.push(task).write();
    res.status(201).json({ data: task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE task
router.put('/:id', (req, res) => {
  try {
    const { text, priority, dueDate, done } = req.body;
    
    const task = db.find({ id: req.params.id }).value();
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updates = {
      ...(text !== undefined && { text }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate }),
      ...(done !== undefined && { done }),
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

// DELETE task
router.delete('/:id', (req, res) => {
  try {
    const task = db.find({ id: req.params.id }).value();
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.remove({ id: req.params.id }).write();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Made with Bob

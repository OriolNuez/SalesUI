const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');
const XLSX = require('xlsx');
const dayjs = require('dayjs');

const DEFAULT_OBJECTIVES = [
  {
    id: 'obj-1',
    name: 'Business Development',
    description: 'Proactive effort to uncover and grow opportunities. Targeted campaigns, weekly sprints, cross-sell/upsell, partner collaboration.',
    target: 3,
    period: 'weekly',
    unit: 'opportunities uncovered',
    color: '#3B82F6'
  },
  {
    id: 'obj-2',
    name: 'Lead Passing',
    description: 'Team-working with Territory Sales Specialists. Grow clients for install base expansion above focus.',
    target: 3,
    period: 'monthly',
    unit: 'opportunities grown from whitespace',
    color: '#8B5CF6'
  },
  {
    id: 'obj-3',
    name: 'Client & BP Engagement',
    description: 'Minimum 2 client meetings per week. Proactive approach driving partner engagement.',
    target: 2,
    period: 'weekly',
    unit: 'meetings',
    color: '#10B981'
  },
  {
    id: 'obj-4',
    name: 'WIP Business Plan',
    description: 'Tsunami and strategic weekly business approach. Product focus plans.',
    target: 1,
    period: 'weekly',
    unit: 'strategies entered',
    color: '#F59E0B'
  },
  {
    id: 'obj-5',
    name: 'Learning Enablement',
    description: 'Commitment to skill growth. Your Learning, proactive enablement, technical skills.',
    target: 8,
    period: 'weekly',
    unit: 'learning hours',
    color: '#EF4444'
  },
  {
    id: 'obj-6',
    name: 'Behavioural Objectives',
    description: 'Team player, wider team collaboration, wider ecosystem collaboration.',
    target: 2,
    period: 'weekly',
    unit: 'team collab events',
    color: '#EC4899'
  },
  {
    id: 'obj-7',
    name: 'Leads Called On',
    description: 'Proactive outreach to leads.',
    target: 10,
    period: 'weekly',
    unit: 'calls',
    color: '#06B6D4'
  },
  {
    id: 'obj-8',
    name: 'Opportunities Closed',
    description: 'Deals moved to Won or Lost stage.',
    target: 2,
    period: 'monthly',
    unit: 'opportunities closed',
    color: '#84CC16'
  }
];

function db() {
  return getDb('objectives.json', {
    objectives: DEFAULT_OBJECTIVES,
    logs: []
  });
}

// GET /api/objectives  — get all objective definitions
router.get('/', (req, res) => {
  res.json(db().get('objectives').value());
});

// PUT /api/objectives/:id  — update objective definition
router.put('/:id', (req, res) => {
  const d = db();
  const obj = d.get('objectives').find({ id: req.params.id }).value();
  if (!obj) return res.status(404).json({ error: 'Objective not found' });
  const updated = { ...obj, ...req.body, id: req.params.id };
  d.get('objectives').find({ id: req.params.id }).assign(updated).write();
  res.json(updated);
});

// GET /api/objectives/logs  — get all activity logs
router.get('/logs', (req, res) => {
  const { objectiveId, from, to } = req.query;
  let logs = db().get('logs').value();
  if (objectiveId) logs = logs.filter(l => l.objectiveId === objectiveId);
  if (from) logs = logs.filter(l => l.date >= from);
  if (to) logs = logs.filter(l => l.date <= to);
  res.json(logs);
});

// POST /api/objectives/log  — log an activity entry
router.post('/log', (req, res) => {
  const d = db();
  const entry = {
    id: uuidv4(),
    objectiveId: req.body.objectiveId,
    value: req.body.value || 1,
    note: req.body.note || '',
    date: req.body.date || new Date().toISOString().split('T')[0],
    source: req.body.source || 'manual', // manual | accounts | daily | crm
    createdAt: new Date().toISOString()
  };
  d.get('logs').push(entry).write();
  res.status(201).json(entry);
});

// DELETE /api/objectives/logs/:id
router.delete('/logs/:id', (req, res) => {
  db().get('logs').remove({ id: req.params.id }).write();
  res.json({ success: true });
});

// GET /api/objectives/scores  — computed scores for a period
// Query: ?period=weekly&date=2024-03-01  OR  ?period=monthly&date=2024-03-01
router.get('/scores', (req, res) => {
  const { period, date } = req.query;
  const d = db();
  const objectives = d.get('objectives').value();
  const logs = d.get('logs').value();

  const refDate = date ? new Date(date) : new Date();

  let from, to;
  if (period === 'monthly') {
    from = new Date(refDate.getFullYear(), refDate.getMonth(), 1).toISOString().split('T')[0];
    to = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).toISOString().split('T')[0];
  } else {
    // weekly — Monday to Sunday
    const day = refDate.getDay();
    const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(refDate.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    from = monday.toISOString().split('T')[0];
    to = sunday.toISOString().split('T')[0];
  }

  const scores = objectives.map(obj => {
    const relevantLogs = logs.filter(l =>
      l.objectiveId === obj.id &&
      l.date >= from &&
      l.date <= to
    );
    const actual = relevantLogs.reduce((sum, l) => sum + (Number(l.value) || 1), 0);
    
    // Calculate target based on period
    // If viewing monthly but objective is weekly, multiply by 4
    // If viewing weekly but objective is monthly, divide by 4
    let adjustedTarget = obj.target;
    if (period === 'monthly' && obj.period === 'weekly') {
      adjustedTarget = obj.target * 4;
    } else if (period === 'weekly' && obj.period === 'monthly') {
      adjustedTarget = Math.ceil(obj.target / 4);
    }
    
    const pct = adjustedTarget > 0 ? Math.min((actual / adjustedTarget) * 100, 100) : 0;
    return {
      id: obj.id,
      name: obj.name,
      target: adjustedTarget,
      baseTarget: obj.target,
      basePeriod: obj.period,
      actual,
      percentage: Math.round(pct),
      period: period,
      unit: obj.unit,
      color: obj.color,
      from,
      to
    };
  });

  res.json(scores);
});

// Export objectives and logs to Excel
router.get('/export', async (req, res) => {
  const db = getDb('objectives.json', { objectives: DEFAULT_OBJECTIVES, logs: [] });
  const objectives = db.get('objectives').value() || DEFAULT_OBJECTIVES;
  const logs = db.get('logs').value() || [];

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Objectives Definitions
  const objData = objectives.map(obj => ({
    'ID': obj.id,
    'Name': obj.name,
    'Description': obj.description,
    'Target': obj.target,
    'Period': obj.period,
    'Unit': obj.unit
  }));
  const ws1 = XLSX.utils.json_to_sheet(objData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Objectives');

  // Sheet 2: All Logs
  const logsData = logs.map(log => {
    const obj = objectives.find(o => o.id === log.objectiveId);
    return {
      'Date': log.date,
      'Objective': obj ? obj.name : log.objectiveId,
      'Value': log.value,
      'Note': log.note || '',
      'Source': log.source || 'manual',
      'Log ID': log.id
    };
  }).sort((a, b) => b.Date.localeCompare(a.Date));
  const ws2 = XLSX.utils.json_to_sheet(logsData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Activity Logs');

  // Sheet 3: Weekly Performance (last 12 weeks)
  const weeklyData = [];
  for (let i = 0; i < 12; i++) {
    const refDate = dayjs().subtract(i, 'week').format('YYYY-MM-DD');
    const day = dayjs(refDate).day();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = dayjs(refDate).add(diff, 'day');
    const sun = mon.add(6, 'day');
    const from = mon.format('YYYY-MM-DD');
    const to = sun.format('YYYY-MM-DD');

    const weekRow = {
      'Week': `${mon.format('MMM D')} - ${sun.format('MMM D, YYYY')}`
    };

    objectives.forEach(obj => {
      const relevantLogs = logs.filter(l =>
        l.objectiveId === obj.id &&
        l.date >= from &&
        l.date <= to
      );
      const actual = relevantLogs.reduce((sum, l) => sum + (Number(l.value) || 1), 0);
      const adjustedTarget = obj.period === 'monthly' ? Math.ceil(obj.target / 4) : obj.target;
      const pct = adjustedTarget > 0 ? Math.round((actual / adjustedTarget) * 100) : 0;
      weekRow[obj.name] = `${actual}/${adjustedTarget} (${pct}%)`;
    });

    weeklyData.push(weekRow);
  }
  const ws3 = XLSX.utils.json_to_sheet(weeklyData);
  XLSX.utils.book_append_sheet(wb, ws3, 'Weekly Performance');

  // Sheet 4: Monthly Performance (last 6 months)
  const monthlyData = [];
  for (let i = 0; i < 6; i++) {
    const refDate = dayjs().subtract(i, 'month').format('YYYY-MM-DD');
    const from = dayjs(refDate).startOf('month').format('YYYY-MM-DD');
    const to = dayjs(refDate).endOf('month').format('YYYY-MM-DD');

    const monthRow = {
      'Month': dayjs(refDate).format('MMMM YYYY')
    };

    objectives.forEach(obj => {
      const relevantLogs = logs.filter(l =>
        l.objectiveId === obj.id &&
        l.date >= from &&
        l.date <= to
      );
      const actual = relevantLogs.reduce((sum, l) => sum + (Number(l.value) || 1), 0);
      const adjustedTarget = obj.period === 'weekly' ? obj.target * 4 : obj.target;
      const pct = adjustedTarget > 0 ? Math.round((actual / adjustedTarget) * 100) : 0;
      monthRow[obj.name] = `${actual}/${adjustedTarget} (${pct}%)`;
    });

    monthlyData.push(monthRow);
  }
  const ws4 = XLSX.utils.json_to_sheet(monthlyData);
  XLSX.utils.book_append_sheet(wb, ws4, 'Monthly Performance');

  // Generate buffer and send
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename=objectives-export-${dayjs().format('YYYY-MM-DD')}.xlsx`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

module.exports = router;

// Made with Bob

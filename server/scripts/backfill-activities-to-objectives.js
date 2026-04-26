const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load activities database
const activitiesAdapter = new FileSync(path.join(__dirname, '../data/activities.json'));
const activitiesDb = low(activitiesAdapter);

// Load objectives database
const objectivesAdapter = new FileSync(path.join(__dirname, '../data/objectives.json'));
const objectivesDb = low(objectivesAdapter);

// Initialize if needed
objectivesDb.defaults({ objectives: [], objectiveLogs: [] }).write();

console.log('Starting backfill of activities to objectives...\n');

// Get all activities
const activities = activitiesDb.get('activities').value() || [];
console.log(`Found ${activities.length} activities to process`);

// Get existing objective logs to avoid duplicates
const existingLogs = objectivesDb.get('objectiveLogs').value() || [];
const existingActivityIds = new Set(
  existingLogs
    .filter(log => log.source === 'activities' && log.activityId)
    .map(log => log.activityId)
);

console.log(`Found ${existingActivityIds.size} activities already logged\n`);

let backfilledCount = 0;
let skippedCount = 0;

// Process each activity
activities.forEach(activity => {
  // Skip if already logged
  if (existingActivityIds.has(activity.id)) {
    console.log(`⏭️  Skipping activity ${activity.id} - already logged`);
    skippedCount++;
    return;
  }

  // Extract date from activity
  const activityDate = new Date(activity.activityDate).toISOString().split('T')[0];
  
  // Create log entry for obj-7 (Leads Called On)
  const logEntry = {
    id: uuidv4(),
    objectiveId: 'obj-7',
    value: 1,
    date: activityDate,
    note: `${activity.activityType.charAt(0).toUpperCase() + activity.activityType.slice(1)} - ${activity.contactName} (${activity.accountName})`,
    source: 'activities',
    activityId: activity.id,
    createdAt: new Date().toISOString()
  };

  // Add to objectives logs
  objectivesDb.get('objectiveLogs').push(logEntry).write();
  
  console.log(`✅ Backfilled: ${activityDate} - ${activity.activityType} - ${activity.contactName} (${activity.accountName})`);
  backfilledCount++;
});

console.log('\n' + '='.repeat(60));
console.log('Backfill complete!');
console.log(`✅ Backfilled: ${backfilledCount} activities`);
console.log(`⏭️  Skipped: ${skippedCount} activities (already logged)`);
console.log(`📊 Total activities: ${activities.length}`);
console.log('='.repeat(60));

// Made with Bob

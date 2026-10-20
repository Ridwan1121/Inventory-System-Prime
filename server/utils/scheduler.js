// ============================================================
// AUTO-CONNECT SCHEDULER
// ============================================================
const cron = require('node-cron');
const db = require('../models/database');
const { calculateNextRun } = require('./helpers');

let schedulerJob = null;

function startScheduler(io) {
    schedulerJob = cron.schedule('* * * * *', () => {
        const now = new Date().toISOString();
        db.all(`SELECT s.*, t.name as tenant_name, t.business_name, t.email as tenant_email 
                FROM schedules s 
                JOIN tenants t ON s.tenant_id = t.id 
                WHERE s.is_active = 1 AND s.next_run <= ?`, [now], (err, schedules) => {
            if (err) return console.error('Scheduler error:', err);
            schedules.forEach(schedule => executeSchedule(schedule, io));
        });
    });
    console.log('⏰ Auto-Connect Scheduler started');
}

function executeSchedule(schedule, io) {
    const nextRun = calculateNextRun(schedule);
    db.run(`INSERT INTO schedule_logs (schedule_id, tenant_id, status, message) 
            VALUES (?, ?, 'success', 'Auto-connection executed')`, [schedule.id, schedule.tenant_id]);
    db.run('UPDATE schedules SET last_run = CURRENT_TIMESTAMP, next_run = ? WHERE id = ?',
        [nextRun ? nextRun.toISOString() : null, schedule.id]);
    if (io) {
        io.to(`tenant_${schedule.tenant_id}`).emit('auto_connect', {
            schedule_id: schedule.id,
            schedule_name: schedule.schedule_name,
            message: `⏰ Auto-connection: ${schedule.schedule_name}`,
            timestamp: new Date().toISOString()
        });
    }
    console.log(`✅ Auto-connected: ${schedule.business_name} - ${schedule.schedule_name}`);
}

function stopScheduler() {
    if (schedulerJob) { schedulerJob.stop(); console.log('⏹️ Scheduler stopped'); }
}

module.exports = { startScheduler, stopScheduler, executeSchedule };

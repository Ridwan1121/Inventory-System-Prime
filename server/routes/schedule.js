// ============================================================
// SCHEDULE ROUTES - Auto-Connect Scheduling
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');
const { calculateNextRun, logAudit, getClientIP } = require('../utils/helpers');

// ============================================
// CREATE SCHEDULE
// ============================================
router.post('/', authenticateToken, requireTenant, (req, res) => {
    const { 
        schedule_name, schedule_type, frequency, custom_interval, 
        days_of_week, time_of_day, start_date, end_date 
    } = req.body;

    if (!schedule_name || !frequency || !time_of_day) {
        return res.status(400).json({ error: 'Fadlan buuxi magaca, frequency, iyo waqtiga!' });
    }

    const nextRun = calculateNextRun({
        frequency,
        custom_interval,
        days_of_week,
        time_of_day
    });

    db.run(`INSERT INTO schedules (tenant_id, schedule_name, schedule_type, frequency, custom_interval, 
            days_of_week, time_of_day, start_date, end_date, next_run) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, schedule_name, schedule_type || 'auto_connect', frequency, custom_interval || null,
         days_of_week || null, time_of_day, start_date || null, end_date || null, nextRun ? nextRun.toISOString() : null],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            logAudit(db, req.user.id, 'tenant', req.user.id, 'CREATE_SCHEDULE', `Schedule: ${schedule_name}`, getClientIP(req));
            res.status(201).json({
                message: '✅ Schedule waa la sameeyay!',
                schedule: { id: this.lastID, schedule_name, next_run: nextRun }
            });
        });
});

// ============================================
// GET ALL SCHEDULES
// ============================================
router.get('/', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT * FROM schedules WHERE tenant_id = ? ORDER BY created_at DESC', [req.user.id], (err, schedules) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(schedules);
    });
});

// ============================================
// UPDATE SCHEDULE
// ============================================
router.put('/:id', authenticateToken, requireTenant, (req, res) => {
    const { schedule_name, frequency, custom_interval, days_of_week, time_of_day, is_active } = req.body;
    
    const nextRun = calculateNextRun({
        frequency: frequency || 'daily',
        custom_interval,
        days_of_week,
        time_of_day: time_of_day || '09:00'
    });

    db.run(`UPDATE schedules SET schedule_name=?, frequency=?, custom_interval=?, days_of_week=?, 
            time_of_day=?, is_active=?, next_run=? WHERE id=? AND tenant_id=?`,
        [schedule_name, frequency, custom_interval, days_of_week, time_of_day, is_active, 
         nextRun ? nextRun.toISOString() : null, req.params.id, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: '✅ Schedule waa la cusboonaysiiyay!' });
        });
});

// ============================================
// DELETE SCHEDULE
// ============================================
router.delete('/:id', authenticateToken, requireTenant, (req, res) => {
    db.run('DELETE FROM schedules WHERE id = ? AND tenant_id = ?', [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ Schedule waa la tirtiray!' });
    });
});

// ============================================
// GET SCHEDULE LOGS
// ============================================
router.get('/:id/logs', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT * FROM schedule_logs WHERE schedule_id = ? AND tenant_id = ? ORDER BY executed_at DESC LIMIT 100',
        [req.params.id, req.user.id], (err, logs) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(logs);
        });
});

// ============================================
// MANUAL TRIGGER
// ============================================
router.post('/:id/trigger', authenticateToken, requireTenant, (req, res) => {
    db.get('SELECT * FROM schedules WHERE id = ? AND tenant_id = ?', [req.params.id, req.user.id], (err, schedule) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!schedule) return res.status(404).json({ error: 'Schedule lama helin!' });
        
        db.run(`INSERT INTO schedule_logs (schedule_id, tenant_id, status, message) 
                VALUES (?, ?, 'success', 'Manual trigger')`,
            [schedule.id, req.user.id]);
        
        db.run('UPDATE schedules SET last_run = CURRENT_TIMESTAMP WHERE id = ?', [schedule.id]);
        
        res.json({ 
            message: '✅ Schedule waa la kiciyay si guul leh!',
            schedule_name: schedule.schedule_name,
            executed_at: new Date().toISOString()
        });
    });
});

module.exports = router;

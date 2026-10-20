const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken, requireTenant } = require('../middleware/auth');
const { calculateNextRun, logAudit, getClientIP } = require('../utils/helpers');

router.post('/', authenticateToken, requireTenant, (req, res) => {
    const { schedule_name, schedule_type, frequency, custom_interval, days_of_week, time_of_day, start_date, end_date } = req.body;
    if (!schedule_name || !frequency || !time_of_day) return res.status(400).json({ error: 'Fadlan buuxi magaca, frequency, iyo waqtiga!' });
    const nextRun = calculateNextRun({ frequency, custom_interval, days_of_week, time_of_day });
    db.run('INSERT INTO schedules (tenant_id, schedule_name, schedule_type, frequency, custom_interval, days_of_week, time_of_day, start_date, end_date, next_run) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, schedule_name, schedule_type || 'auto_connect', frequency, custom_interval || null, days_of_week || null, time_of_day, start_date || null, end_date || null, nextRun ? nextRun.toISOString() : null],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: '✅ Schedule waa la sameeyay!', id: this.lastID });
        });
});

router.get('/', authenticateToken, requireTenant, (req, res) => {
    db.all('SELECT * FROM schedules WHERE tenant_id = ? ORDER BY created_at DESC', [req.user.id], (err, schedules) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(schedules);
    });
});

router.delete('/:id', authenticateToken, requireTenant, (req, res) => {
    db.run('DELETE FROM schedules WHERE id = ? AND tenant_id = ?', [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ Schedule waa la tirtiray!' });
    });
});

module.exports = router;
